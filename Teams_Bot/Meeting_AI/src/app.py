"""
app.py — Point d'entrée du bot Teams.

Responsabilités :
  - Crée le serveur aiohttp et expose la route POST /api/messages.
  - Initialise le BotFrameworkAdapter et le MeetingAssistantBot.
  - Effectue le login au backend de transcription au démarrage (une seule fois).
  - Répond HTTP 200 immédiatement à chaque activité Teams (contrainte 15 s).
"""

from __future__ import annotations

import asyncio
import logging
import os
import uuid
from pathlib import Path

from aiohttp import web
from aiohttp.web import Request, Response, json_response
from botbuilder.core import BotFrameworkAdapter, BotFrameworkAdapterSettings, TurnContext
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
            "❌ Une erreur interne est survenue. Veuillez réessayer."
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
        logger.info("✅ Authentification backend réussie.")
    except Exception as exc:
        # On log l'erreur mais on ne bloque pas le démarrage :
        # une ré-auth sera tentée au premier appel.
        logger.warning("⚠️  Authentification backend échouée au démarrage : %s", exc)


async def on_shutdown(app: web.Application) -> None:
    """Fermeture propre des sessions HTTP."""
    backend = BackendClient.get_instance()
    await backend.close()
    logger.info("Sessions HTTP fermées.")


# ── Route de test (développement uniquement) ──────────────────────────────────

async def test_recording(req: Request) -> Response:
    """
    POST /test/recording — Simule exactement ce que Teams envoie quand un
    enregistrement est posté dans un channel.

    Corps JSON attendu (tous les champs sont optionnels) :
    {
        "sharepoint_url": "https://...",   // URL d'un vrai fichier SharePoint/OneDrive
        "local_mp4": "/chemin/local.mp4",  // OU un chemin local (bypass Graph API)
        "conversation_id": "test-conv-1"   // Identifiant de conversation (optionnel)
    }

    Si aucune URL n'est fournie, une URL SharePoint fictive est utilisée
    (le pipeline échouera au téléchargement, mais tout le reste est testé).
    """
    body = await req.json() if req.content_type == "application/json" else {}

    sharepoint_url: str = body.get(
        "sharepoint_url",
        "https://contoso.sharepoint.com/sites/test/Documents/recording_test.mp4",
    )
    local_mp4: str | None = body.get("local_mp4")
    conversation_id: str = body.get("conversation_id", f"test-{uuid.uuid4().hex[:8]}")

    # ── Construction d'une activité Teams réaliste ────────────────────────
    from botbuilder.schema import Activity, ActivityTypes, ConversationAccount, ChannelAccount, Attachment

    # Simule le format d'attachement que Teams génère pour un enregistrement
    fake_attachment = Attachment(
        content_type="application/vnd.microsoft.teams.file.download.info",
        content_url=sharepoint_url,
        name="recording.mp4",
        content={
            "downloadUrl": sharepoint_url,
            "uniqueId": uuid.uuid4().hex,
            "fileType": "mp4",
        },
    )

    activity = Activity(
        type=ActivityTypes.message,
        id=uuid.uuid4().hex,
        timestamp=None,
        channel_id="msteams",
        from_property=ChannelAccount(id="test-user-id", name="Test User"),
        conversation=ConversationAccount(
            id=conversation_id,
            name="Test Channel",
            is_group=True,
        ),
        recipient=ChannelAccount(id=config.APP_ID, name="MeetingAssistantBot"),
        text=f"Enregistrement de la réunion disponible : {sharepoint_url}",
        attachments=[fake_attachment],
        service_url="http://localhost:3978",
    )

    # ── Si un chemin local est fourni, court-circuite Graph API ───────────
    if local_mp4:
        mp4_path = Path(local_mp4)
        if not mp4_path.exists():
            return json_response(
                {"error": f"Fichier local introuvable : {local_mp4}"}, status=400
            )
        # Patch temporaire : copie le fichier dans TEMP_DIR et lance le
        # pipeline directement depuis audio_processor (sans Graph API)
        import shutil
        from botbuilder.schema import ConversationReference
        from audio_processor import convert_mp4_to_mp3
        from backend_client import BackendClient
        import tempfile

        tmp_dir = Path(tempfile.mkdtemp(dir=config.TEMP_DIR, prefix="test_"))
        dest_mp4 = tmp_dir / "recording.mp4"
        dest_mp3 = tmp_dir / "recording.mp3"
        shutil.copy2(mp4_path, dest_mp4)

        conv_ref = TurnContext.get_conversation_reference(activity)

        async def _run_local_pipeline():
            try:
                await bot._notify(conv_ref, "⏳ [TEST] Conversion audio…")
                await convert_mp4_to_mp3(dest_mp4, dest_mp3)
                await bot._notify(conv_ref, "🤖 [TEST] Envoi au backend…")
                backend = BackendClient.get_instance()
                result = await backend.upload_audio_to_backend(dest_mp3)
                card = bot._build_result_card(result["summary"], result["pdf_url"])
                await bot._notify_with_card(conv_ref, card)
            except Exception as exc:
                logger.exception("[TEST] Erreur pipeline local")
                await bot._notify(conv_ref, f"❌ [TEST] Erreur : {exc}")
            finally:
                shutil.rmtree(tmp_dir, ignore_errors=True)

        asyncio.create_task(_run_local_pipeline())
        return json_response({
            "status": "started",
            "mode": "local_mp4",
            "file": str(mp4_path),
            "conversation_id": conversation_id,
        })

    # ── Sinon, passe par le pipeline complet (Graph API + backend) ────────
    auth_header = req.headers.get("Authorization", "")
    try:
        await adapter.process_activity(activity, auth_header, bot.on_turn)
        return json_response({
            "status": "started",
            "mode": "full_pipeline",
            "sharepoint_url": sharepoint_url,
            "conversation_id": conversation_id,
        })
    except Exception as exc:
        logger.exception("[TEST] Erreur process_activity")
        return json_response({"error": str(exc)}, status=500)



def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/api/messages", messages)

    # Route de healthcheck (utile pour Azure App Service / Docker)
    async def health(_: Request) -> Response:
        return json_response({"status": "ok", "bot": "MeetingAssistantBot"})

    app.router.add_get("/health", health)

    # ── Route de test (DÉSACTIVÉE en production) ──────────────────────────
    # Active uniquement si la variable d'env BOT_ENV=development
    if os.environ.get("BOT_ENV", "production").lower() == "development":
        app.router.add_post("/test/recording", test_recording)
        logger.warning(
            "⚠️  Route de test /test/recording activée (BOT_ENV=development). "
            "Ne jamais exposer en production."
        )

    app.on_startup.append(on_startup)
    app.on_shutdown.append(on_shutdown)
    return app


# ── Entrée principale ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    application = create_app()
    logger.info("🚀 Bot Teams démarré sur %s:%s", config.HOST, config.PORT)
    web.run_app(
        application,
        host=config.HOST,
        port=config.PORT,
    )