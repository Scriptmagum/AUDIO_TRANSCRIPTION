"""
graph_api.py — Authentification MSAL (Client Credentials) et téléchargement
               de fichiers depuis SharePoint/OneDrive via Microsoft Graph API.

Permissions Application requises dans Azure AD :
  - Files.Read.All
  - (optionnel) Sites.Read.All si les fichiers sont sur un site SharePoint dédié
"""

from __future__ import annotations

import logging
import re
from pathlib import Path

import aiohttp
import msal

import config

logger = logging.getLogger(__name__)

# ── Cache MSAL en mémoire (token renouvelé automatiquement) ───────────────────
_msal_app: msal.ConfidentialClientApplication | None = None


def _get_msal_app() -> msal.ConfidentialClientApplication:
    global _msal_app
    if _msal_app is None:
        authority = f"https://login.microsoftonline.com/{config.TENANT_ID}"
        _msal_app = msal.ConfidentialClientApplication(
            client_id=config.GRAPH_CLIENT_ID,
            client_credential=config.GRAPH_CLIENT_SECRET,
            authority=authority,
        )
    return _msal_app


async def get_graph_token() -> str:
    """
    Acquiert (ou renouvelle depuis le cache MSAL) un token pour Graph API.

    Returns:
        Bearer token (str).

    Raises:
        RuntimeError: si l'acquisition échoue.
    """
    app = _get_msal_app()

    # Essai depuis le cache avant de contacter Azure AD
    result = app.acquire_token_silent(config.GRAPH_SCOPES, account=None)
    if not result:
        logger.info("Graph : acquisition d'un nouveau token via client_credentials…")
        result = app.acquire_token_for_client(scopes=config.GRAPH_SCOPES)

    if "access_token" not in result:
        error = result.get("error_description", result.get("error", "inconnu"))
        raise RuntimeError(f"Impossible d'obtenir un token Graph : {error}")

    return result["access_token"]


# ── Résolution de l'URL SharePoint → URL de téléchargement Graph ──────────────

def _build_graph_download_url(sharepoint_url: str) -> str:
    """
    Convertit une URL SharePoint/OneDrive en endpoint Graph API téléchargeable.

    Deux formats possibles :
      1. URL OneDrive personnelle :
         https://<tenant>-my.sharepoint.com/personal/<user>/Documents/...
      2. URL SharePoint d'équipe :
         https://<tenant>.sharepoint.com/sites/<site>/Shared Documents/...

    La stratégie la plus robuste est d'utiliser l'endpoint
    /v1.0/shares/{encodedUrl}/driveItem/content  (fonctionne pour les deux).
    """
    import base64

    # Encode l'URL selon la spec Microsoft (base64url sans padding)
    encoded = base64.urlsafe_b64encode(sharepoint_url.encode()).rstrip(b"=").decode()
    share_token = f"u!{encoded}"
    return f"https://graph.microsoft.com/v1.0/shares/{share_token}/driveItem/content"


async def download_mp4_from_sharepoint(
    sharepoint_url: str,
    destination: Path,
) -> Path:
    """
    Télécharge le fichier .mp4 pointé par `sharepoint_url` vers `destination`.

    Args:
        sharepoint_url: URL complète du fichier sur SharePoint/OneDrive.
        destination:    Chemin local de destination (ex : /tmp/teams_bot/meeting.mp4).

    Returns:
        Le chemin `destination` une fois le fichier écrit.

    Raises:
        RuntimeError: en cas d'erreur réseau ou HTTP.
    """
    token = await get_graph_token()
    graph_url = _build_graph_download_url(sharepoint_url)

    headers = {"Authorization": f"Bearer {token}"}
    destination.parent.mkdir(parents=True, exist_ok=True)

    logger.info("Graph : téléchargement %s → %s", sharepoint_url, destination)

    async with aiohttp.ClientSession() as session:
        async with session.get(graph_url, headers=headers, allow_redirects=True) as resp:
            if resp.status != 200:
                body = await resp.text()
                raise RuntimeError(
                    f"Graph API : HTTP {resp.status} lors du téléchargement → {body}"
                )
            # Écriture en streaming pour éviter de tout charger en RAM
            import aiofiles
            async with aiofiles.open(destination, "wb") as f:
                async for chunk in resp.content.iter_chunked(1024 * 256):  # 256 KB
                    await f.write(chunk)

    logger.info("Graph : fichier téléchargé (%d octets)", destination.stat().st_size)
    return destination


# ── Extraction de l'URL SharePoint depuis une activité Teams ──────────────────

def extract_sharepoint_url_from_activity(activity) -> str | None:
    """
    Parcourt les pièces jointes (attachments) et le corps du message d'une
    activité Teams pour y trouver une URL SharePoint/OneDrive pointant vers
    un fichier .mp4.

    Teams peut poster l'enregistrement sous deux formes :
      a) Une pièce jointe de type "fileDownload" avec contentUrl.
      b) Un lien hypertexte dans le texte HTML du message.

    Returns:
        URL str si trouvée, None sinon.
    """
    # ── a) Pièces jointes structurées ─────────────────────────────────────
    attachments = getattr(activity, "attachments", None) or []
    for att in attachments:
        content_type = getattr(att, "content_type", "") or ""
        content_url = getattr(att, "content_url", "") or ""

        # Pièce jointe OneDrive/SharePoint
        if "sharepoint" in content_url.lower() or "1drv" in content_url.lower():
            if content_url.lower().endswith(".mp4") or ".mp4" in content_url:
                logger.debug("URL mp4 trouvée dans les attachments : %s", content_url)
                return content_url

        # Parfois le contenu est un dict JSON sérialisé
        content = getattr(att, "content", None)
        if isinstance(content, dict):
            download_url = content.get("downloadUrl") or content.get(
                "@microsoft.graph.downloadUrl"
            )
            if download_url:
                return download_url

    # ── b) Recherche dans le texte HTML du message ─────────────────────────
    text: str = getattr(activity, "text", "") or ""
    # Cherche toutes les URLs https contenant sharepoint et .mp4
    pattern = r'https://[^\s"<>]+\.sharepoint\.com[^\s"<>]*\.mp4[^\s"<>]*'
    matches = re.findall(pattern, text, re.IGNORECASE)
    if matches:
        logger.debug("URL mp4 trouvée dans le texte : %s", matches[0])
        return matches[0]

    return None