"""
app.py — Point d'entrée du bot Teams.

Responsabilités :
  - Crée le serveur aiohttp et expose la route POST /api/messages.
  - Initialise le BotFrameworkAdapter et le MeetingAssistantBot.
  - Effectue le login au backend de transcription au démarrage (une seule fois).
  - Répond HTTP 200 immédiatement à chaque activité Teams (contrainte 15 s).
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

from aiohttp import web
from aiohttp.web import Request, Response, json_response
from botbuilder.core import BotFrameworkAdapter, BotFrameworkAdapterSettings
from botbuilder.schema import Activity

import config
from backend_client import BackendClient
from bot import MeetingAssistantBot

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


# ── Initialisation du Bot Framework ──────────────────────────────────────────
settings = BotFrameworkAdapterSettings(
    app_id=config.APP_ID,
    app_password=config.APP_PASSWORD,
)
adapter = BotFrameworkAdapter(settings)

# Gestionnaire d'erreur global de l'adapter
async def on_error(context, error: Exception):
    logger.exception("Erreur non gérée dans l'adapter Bot Framework", exc_info=error)
    try:
        await context.send_activity(
            "Une erreur interne est survenue. Veuillez réessayer."
        )
    except Exception:
        pass

adapter.on_turn_error = on_error

# Instanciation du bot (l'adapter est injecté pour continue_conversation)
bot = MeetingAssistantBot(adapter=adapter)


# ── Route principale ──────────────────────────────────────────────────────────

async def messages(req: Request) -> Response:
    """
    POST /api/messages — Reçoit toutes les activités Teams.

    Le bot DOIT répondre HTTP 200 dans les 15 secondes.
    L'adapter traite l'activité de façon asynchrone (les tâches lourdes
    sont déléguées à asyncio.create_task dans bot.py).
    """
    if "application/json" not in req.content_type:
        return Response(status=415, text="Content-Type doit être application/json")

    body = await req.json()
    activity = Activity().deserialize(body)

    auth_header = req.headers.get("Authorization", "")

    try:
        await adapter.process_activity(activity, auth_header, bot.on_turn)
        return Response(status=200)
    except Exception as exc:
        logger.exception("Erreur lors du traitement de l'activité")
        return Response(status=500, text=str(exc))


# ── Lifecycle de l'application ────────────────────────────────────────────────

async def on_startup(app: web.Application) -> None:
    """
    Appelé au démarrage du serveur.
    Crée les répertoires temporaires et effectue le login au backend.
    """
    # Création du répertoire temporaire
    Path(config.TEMP_DIR).mkdir(parents=True, exist_ok=True)
    logger.info("Répertoire temporaire prêt : %s", config.TEMP_DIR)

    # Login global au backend (une seule fois)
    backend = BackendClient.get_instance()
    try:
        await backend.login()
        logger.info("Authentification backend réussie.")
    except Exception as exc:
        # On log l'erreur mais on ne bloque pas le démarrage :
        # une ré-auth sera tentée au premier appel.
        logger.warning("Authentification backend échouée au démarrage : %s", exc)


async def on_shutdown(app: web.Application) -> None:
    """Fermeture propre des sessions HTTP."""
    backend = BackendClient.get_instance()
    await backend.close()
    logger.info("Sessions HTTP fermées.")


# ── Création de l'app aiohttp ─────────────────────────────────────────────────

def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/api/messages", messages)

    # Route de healthcheck (utile pour Azure App Service / Docker)
    async def health(_: Request) -> Response:
        return json_response({"status": "ok", "bot": "MeetingAssistantBot"})

    app.router.add_get("/health", health)

    app.on_startup.append(on_startup)
    app.on_shutdown.append(on_shutdown)
    return app


# ── Entrée principale ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    application = create_app()
    logger.info("Bot Teams démarré sur %s:%s", config.HOST, config.PORT)
    web.run_app(
        application,
        host=config.HOST,
        port=config.PORT,
    )