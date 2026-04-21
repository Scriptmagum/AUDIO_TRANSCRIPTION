import os
import tempfile
import logging
from botbuilder.core import ActivityHandler, TurnContext
from botbuilder.schema import Activity, ActivityTypes
from audio_processor import download_mp4, convert_mp4_to_mp3, send_mp3_to_backend

logger = logging.getLogger(__name__)

BACKEND_URL = os.environ.get("BACKEND_URL", "https://ton-backend.com/api/audio")


class TeamsRecordingBot(ActivityHandler):

    async def on_message_activity(self, turn_context: TurnContext):
        activity: Activity = turn_context.activity

        # Vérifie si le message contient des pièces jointes
        if not activity.attachments:
            return

        for attachment in activity.attachments:
            # Filtre uniquement les fichiers MP4 (enregistrements Teams)
            content_type = attachment.content_type or ""
            name = attachment.name or ""

            is_video = "video" in content_type or name.lower().endswith(".mp4")
            if not is_video:
                continue

            await turn_context.send_activity("Enregistrement détecté, conversion en MP3 en cours...")

            try:
                # Récupère le token d'authentification pour télécharger le fichier
                token = await self._get_auth_token(turn_context)

                with tempfile.TemporaryDirectory() as tmp_dir:
                    mp4_path = os.path.join(tmp_dir, "recording.mp4")
                    mp3_path = os.path.join(tmp_dir, "recording.mp3")

                    # 1. Télécharge le MP4 depuis Teams
                    await download_mp4(
                        url=attachment.content_url,
                        token=token,
                        output_path=mp4_path
                    )

                    # 2. Convertit en MP3 via ffmpeg
                    await convert_mp4_to_mp3(mp4_path, mp3_path)

                    # 3. Envoie le MP3 au backend
                    filename = name.replace(".mp4", ".mp3")
                    response = await send_mp3_to_backend(
                        mp3_path=mp3_path,
                        filename=filename,
                        backend_url=BACKEND_URL,
                        meeting_id=activity.channel_data.get("meeting", {}).get("id") if activity.channel_data else None,
                    )

                    await turn_context.send_activity(
                        f"MP3 envoyé avec succès. Réponse backend : {response.get('status', 'ok')}"
                    )

            except Exception as e:
                logger.error(f"Erreur traitement enregistrement : {e}", exc_info=True)
                await turn_context.send_activity(
                    f"Erreur lors du traitement de l'enregistrement : {str(e)}"
                )

    async def _get_auth_token(self, turn_context: TurnContext) -> str:
        """Récupère le token OBO (On-Behalf-Of) pour télécharger les fichiers Teams."""
        token_response = await turn_context.adapter.get_user_token(
            turn_context, "teams"
        )
        if token_response:
            return token_response.token

        # Fallback : utilise le token du connecteur
        connector_client = await turn_context.adapter.create_connector_client(
            turn_context.activity.service_url
        )
        return connector_client.config.credentials.get_access_token()
