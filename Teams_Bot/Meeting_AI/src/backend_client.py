"""
backend_client.py — Singleton asynchrone pour interagir avec le backend de transcription.

Responsabilités :
  - Login unique au démarrage (POST /auth/signin) et persistance du cookie JWT.
  - Ré-authentification automatique si le cookie expire (HTTP 401).
  - upload_audio_to_backend() : envoi multipart/form-data du fichier audio.
"""

from __future__ import annotations

import logging
from pathlib import Path

import aiofiles
import aiohttp

import config

logger = logging.getLogger(__name__)


class BackendClient:
    """
    Singleton thread-safe (asyncio) pour le backend de transcription.
    Utilisation :
        client = BackendClient.get_instance()
        await client.login()
        result = await client.upload_audio_to_backend(path)
    """

    _instance: "BackendClient | None" = None

    # ── Constructeur ──────────────────────────────────────────────────────────

    def __init__(self) -> None:
        self._cookie_jar: aiohttp.CookieJar = aiohttp.CookieJar()
        self._session: aiohttp.ClientSession | None = None
        self._logged_in: bool = False

    # ── Singleton ─────────────────────────────────────────────────────────────

    @classmethod
    def get_instance(cls) -> "BackendClient":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── Session ───────────────────────────────────────────────────────────────

    def _get_session(self) -> aiohttp.ClientSession:
        """Retourne (et crée si besoin) une session aiohttp partagée."""
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                cookie_jar=self._cookie_jar,
                headers={"x-api-key": config.BACKEND_API_KEY},
            )
        return self._session

    async def close(self) -> None:
        """Ferme proprement la session HTTP (appelé à l'arrêt de l'app)."""
        if self._session and not self._session.closed:
            await self._session.close()

    # ── Authentification ──────────────────────────────────────────────────────
    async def ensure_api_key(self) -> None:
        """Vérifie si la clé API existe, sinon demande au backend d'en générer une."""
        # On vérifie si la clé est déjà configurée
        api_key = getattr(config, "BACKEND_API_KEY", None)
        if api_key:
            # On s'assure qu'elle est bien dans les headers de la session
            self._get_session().headers.update({"x-api-key": api_key})
            return

        logger.info("Aucune API key trouvée, génération en cours via le backend...")
        await self._ensure_logged_in()
        
        session = self._get_session()
        url = f"{config.BACKEND_URL}/user/apikey"
        
        async with session.post(url) as resp:
            if resp.status not in (200, 201):
                raise RuntimeError(f"Échec de la génération de l'API Key (HTTP {resp.status})")
            
            data = await resp.json()
            new_key = data.get("apiKey")
            
            if not new_key:
                raise ValueError("Le backend n'a pas renvoyé le champ 'apiKey'.")

            # Affichage bien visible pour l'opérateur
            print("\n" + "="*60)
            print("ACTION REQUISE] NOUVELLE API KEY GÉNÉRÉE 🚨")
            print("Copie-colle la ligne ci-dessous dans ton fichier .env :")
            print(f"BACKEND_API_KEY={new_key}")
            print("="*60 + "\n")

            # On met à jour la session en cours avec la nouvelle clé
            session.headers.update({"x-api-key": new_key})
            
            # On met à jour la config en mémoire pour éviter de regénérer en boucle
            config.BACKEND_API_KEY = new_key

    async def ensure_api_key(self) -> None:
        """Vérifie si la clé API existe, sinon demande au backend d'en générer une."""
        # On vérifie si la clé est déjà configurée
        api_key = getattr(config, "BACKEND_API_KEY", None)
        if api_key:
            # On s'assure qu'elle est bien dans les headers de la session
                    self._get_session().headers.update({"x-api-key": api_key})
                    return

        logger.info("Aucune API key trouvée, génération en cours via le backend...")
        await self._ensure_logged_in()
        
        session = self._get_session()
        url = f"{config.BACKEND_URL}/user/apikey"
        
        async with session.post(url) as resp:
            if resp.status not in (200, 201):
                raise RuntimeError(f"Échec de la génération de l'API Key (HTTP {resp.status})")
            
            data = await resp.json()
            new_key = data.get("apiKey")
            
            if not new_key:
                raise ValueError("Le backend n'a pas renvoyé le champ 'apiKey'.")

            # Affichage bien visible pour l'opérateur
            print("\n" + "="*60)
            print("🚨 [ACTION REQUISE] NOUVELLE API KEY GÉNÉRÉE 🚨")
            print("Copie-colle la ligne ci-dessous dans ton fichier .env :")
            print(f"BACKEND_API_KEY={new_key}")
            print("="*60 + "\n")

            # On met à jour la session en cours avec la nouvelle clé
            session.headers.update({"x-api-key": new_key})
            
            # On met à jour la config en mémoire pour éviter de regénérer en boucle
            config.BACKEND_API_KEY = new_key

    async def login(self) -> None:
        """
        POST /auth/signin → récupère le cookie JWT.
        Idempotent : si déjà connecté, ne refait pas de requête.
        """
        if self._logged_in:
            return

        session = self._get_session()
        url = f"{config.BACKEND_URL}/auth/signin"
        payload = {
            "email": config.BACKEND_EMAIL,
            "password": config.BACKEND_PASSWORD,
        }

        logger.info("Backend : tentative de login sur %s", url)
        try:
            async with session.post(url, json=payload) as resp:
                if resp.status not in (200, 201):
                    body = await resp.text()
                    raise RuntimeError(
                        f"Login backend échoué (HTTP {resp.status}) : {body}"
                    )
                # Le cookie JWT est automatiquement stocké dans le cookie_jar
                self._logged_in = True
                logger.info("Backend : login réussi.")
        except aiohttp.ClientError as exc:
            raise RuntimeError(f"Erreur réseau lors du login backend : {exc}") from exc

    async def _ensure_logged_in(self) -> None:
        """Garantit que la session est active ; ré-authentifie si nécessaire."""
        if not self._logged_in:
            await self.login()

    # ── Upload audio ──────────────────────────────────────────────────────────

    async def upload_audio_to_backend(self, audio_path: Path) -> dict:
        """
        Envoie le fichier audio au backend et retourne le JSON de réponse.

        Args:
            audio_path: Chemin local vers le fichier .mp3.

        Returns:
            dict avec les clés "summary" (str) et "pdf_url" (str).

        Raises:
            RuntimeError: si le backend renvoie une erreur ou que le JSON est invalide.
        """
        await self._ensure_logged_in()

        session = self._get_session()
        url = f"{config.BACKEND_URL}/meeting/process/fr"

        logger.info("Backend : upload audio → %s", url)
        try:
            async with aiofiles.open(audio_path, "rb") as f:
                audio_bytes = await f.read()

            form = aiohttp.FormData()
            form.add_field(
                "file",
                audio_bytes,
                filename=audio_path.name,
                content_type="audio/mpeg",
            )

            async with session.post(url, data=form) as resp:
                # Tentative de ré-auth si le token a expiré
                if resp.status == 401:
                    logger.warning("Backend : token expiré, ré-authentification…")
                    self._logged_in = False
                    await self.login()
                    # Relecture du fichier nécessaire car le stream est consommé
                    async with aiofiles.open(audio_path, "rb") as f:
                        audio_bytes = await f.read()
                    form2 = aiohttp.FormData()
                    form2.add_field(
                        "file",
                        audio_bytes,
                        filename=audio_path.name,
                        content_type="audio/mpeg",
                    )
                    async with session.post(url, data=form2) as resp2:
                        return await self._parse_response(resp2)

                return await self._parse_response(resp)

        except aiohttp.ClientError as exc:
            raise RuntimeError(f"Erreur réseau lors de l'upload audio : {exc}") from exc

    @staticmethod
    async def _parse_response(resp: aiohttp.ClientResponse) -> dict:
        """Valide le statut HTTP et désérialise le JSON."""
        if resp.status not in (200, 201):
            body = await resp.text()
            raise RuntimeError(
                f"Backend a renvoyé HTTP {resp.status} : {body}"
            )
        data = await resp.json()
        if "summary" not in data or "pdf_url" not in data:
            raise RuntimeError(
                f"Réponse backend inattendue (clés manquantes) : {data}"
            )
        return data