"""
config.py — Centralise toutes les variables d'environnement du bot Teams.
Utilise python-dotenv pour charger un fichier .env local si présent.
"""

import os
from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    """Lève une erreur explicite si une variable obligatoire est absente."""
    value = os.environ.get(key)
    if not value:
        raise EnvironmentError(
            f"Variable d'environnement obligatoire manquante : {key}"
        )
    return value


# ── Bot Framework (Azure Bot Registration) ───────────────────────────────────
APP_ID: str = os.environ.get("MicrosoftAppId", "")
APP_PASSWORD: str = os.environ.get("MicrosoftAppPassword", "")

# ── Microsoft Graph / MSAL ────────────────────────────────────────────────────
# Tenant Azure AD du client (ex : "contoso.onmicrosoft.com" ou GUID)
TENANT_ID: str = _require("AZURE_TENANT_ID")
# App Registration dédiée à l'accès Graph (peut être la même que le bot)
GRAPH_CLIENT_ID: str = _require("GRAPH_CLIENT_ID")
GRAPH_CLIENT_SECRET: str = _require("GRAPH_CLIENT_SECRET")
GRAPH_SCOPES: list[str] = ["https://graph.microsoft.com/.default"]

# ── Backend de transcription ──────────────────────────────────────────────────
BACKEND_URL: str = _require("BACKEND_URL")          # ex : "https://api.mon-backend.com"
BACKEND_EMAIL: str = _require("BACKEND_EMAIL")
BACKEND_PASSWORD: str = _require("BACKEND_PASSWORD")
BACKEND_API_KEY: str = _require("BACKEND_API_KEY")  # header x-api-key

# ── Serveur aiohttp ───────────────────────────────────────────────────────────
PORT: int = int(os.environ.get("PORT", "3978"))
HOST: str = os.environ.get("HOST", "0.0.0.0")

# ── Chemins temporaires ───────────────────────────────────────────────────────
TEMP_DIR: str = os.environ.get("TEMP_DIR", "/tmp/teams_bot")