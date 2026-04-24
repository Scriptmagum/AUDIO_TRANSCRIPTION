"""
bot.py — Classe principale du bot Teams (Meeting Assistant).

Flux de traitement :
  1. on_message_activity() détecte un message contenant une URL d'enregistrement.
  2. Répond IMMÉDIATEMENT avec "Traitement en cours…" (respect du timeout 15s).
  3. Lance _process_recording() en tâche de fond (asyncio.create_task).
  4. _process_recording() :
       a. Télécharge le .mp4 via Graph API.
       b. Convertit en .mp3 via ffmpeg.
       c. Envoie au backend de transcription.
       d. Répond dans le channel via adapter.continue_conversation() avec une Adaptive Card.
"""

from __future__ import annotations

import asyncio
import logging
import shutil
import tempfile
import uuid
from pathlib import Path

from botbuilder.core import ActivityHandler, TurnContext, CardFactory
from botbuilder.schema import Activity, ActivityTypes, Attachment

import config
from audio_processor import convert_mp4_to_mp3
from backend_client import BackendClient
from graph_api import download_mp4_from_sharepoint, extract_sharepoint_url_from_activity

logger = logging.getLogger(__name__)


class MeetingAssistantBot(ActivityHandler):
    """
    Bot Teams qui intercepte les enregistrements de réunion et les traite
    de façon asynchrone (téléchargement + transcription + résumé).
    """

    def __init__(self, adapter) -> None:
        """
        Args:
            adapter: Instance de BotFrameworkAdapter (injectée depuis app.py)
                     nécessaire pour continue_conversation().
        """
        super().__init__()
        self._adapter = adapter

    # ── Gestion des messages entrants ─────────────────────────────────────────

    async def on_message_activity(self, turn_context: TurnContext) -> None:
        """Point d'entrée principal : appelé pour chaque message reçu."""
        activity = turn_context.activity

        # Tente d'extraire une URL SharePoint/OneDrive vers un .mp4
        sharepoint_url = extract_sharepoint_url_from_activity(activity)

        if not sharepoint_url:
            # Message ordinaire — réponse d'aide basique
            await turn_context.send_activity(
                "Je suis votre assistant de réunion. "
                "Partagez l'enregistrement d'une réunion Teams pour obtenir "
                "une transcription et un résumé automatique."
            )
            return

        # ── Sauvegarde de la ConversationReference ────────────────────────
        conversation_reference = TurnContext.get_conversation_reference(activity)

        # ── Réponse immédiate (obligatoire < 15 s) ────────────────────────
        await turn_context.send_activity(
            "**Enregistrement détecté !** Je traite votre réunion…\n\n"
            "Cette opération peut prendre plusieurs minutes. "
            "Je vous enverrai le résumé dès qu'il sera prêt."
        )

        # ── Lancement de la tâche de fond ─────────────────────────────────
        asyncio.create_task(
            self._process_recording(sharepoint_url, conversation_reference),
            name=f"process-recording-{uuid.uuid4().hex[:8]}",
        )

    # ── Tâche de fond ─────────────────────────────────────────────────────────

    async def _process_recording(
        self,
        sharepoint_url: str,
        conversation_reference,
    ) -> None:
        """
        Exécute le pipeline complet en arrière-plan :
          téléchargement → conversion → transcription → notification.

        Toutes les exceptions sont capturées et remontées à l'utilisateur
        via continue_conversation().
        """
        # Répertoire temporaire isolé pour cette exécution
        tmp_dir = Path(tempfile.mkdtemp(dir=config.TEMP_DIR, prefix="meeting_"))
        mp4_path = tmp_dir / "recording.mp4"
        mp3_path = tmp_dir / "recording.mp3"

        try:
            # ── Étape 1 : Téléchargement du .mp4 ─────────────────────────
            logger.info("[BG] Téléchargement de l'enregistrement…")
            await self._notify(
                conversation_reference,
                "Téléchargement de l'enregistrement en cours…",
            )
            await download_mp4_from_sharepoint(sharepoint_url, mp4_path)

            # ── Étape 2 : Conversion en .mp3 ──────────────────────────────
            logger.info("[BG] Conversion audio…")
            await self._notify(
                conversation_reference,
                "Conversion audio en cours…",
            )
            await convert_mp4_to_mp3(mp4_path, mp3_path)

            # ── Étape 3 : Envoi au backend de transcription ───────────────
            logger.info("[BG] Envoi au backend de transcription…")
            await self._notify(
                conversation_reference,
                "Transcription et résumé en cours (quelques minutes)…",
            )
            backend = BackendClient.get_instance()
            result = await backend.upload_audio_to_backend(mp3_path)

            # ── Étape 4 : Envoi de la carte de résultat ───────────────────
            logger.info("[BG] Traitement terminé. Envoi du résumé.")
            card = self._build_result_card(
                summary=result["summary"],
                pdf_url=result["pdf_url"],
            )
            await self._notify_with_card(conversation_reference, card)

        except Exception as exc:
            logger.exception("[BG] Erreur durant le traitement de l'enregistrement")
            await self._notify(
                conversation_reference,
                f"**Une erreur est survenue durant le traitement :**\n\n`{exc}`\n\n"
                "Veuillez réessayer ou contacter votre administrateur.",
            )

        finally:
            # Nettoyage des fichiers temporaires dans tous les cas
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
                logger.debug("[BG] Répertoire temporaire supprimé : %s", tmp_dir)
            except Exception:
                pass

    # ── Helpers de notification ────────────────────────────────────────────────

    async def _notify(self, reference, message: str):
        """Envoie un message asynchrone dans la conversation via la référence."""
        async def callback(context):
            await context.send_activity(message)

        import config
        # On donne un faux ID de secours si l'ID est vide en local
        bot_id = getattr(config, "APP_ID", None) or "local-test-id"

        try:
            await self._adapter.continue_conversation(reference, callback, bot_id)
        except Exception as e:
            # Si on teste via PowerShell (pas de vraie conversation), 
            # on intercepte l'erreur et on affiche le message dans le terminal !
            print(f"💬 [MESSAGE BOT] : {message}")

    async def _notify_with_card(self, reference, card):
        import config
        bot_id = getattr(config, "APP_ID", None)

        # --- MODE TEST LOCAL ---
        if not bot_id:
            print("\n" + "🌟"*25)
            print("🎉 VICTOIRE ! LE PIPELINE COMPLET FONCTIONNE !")
            print("Voici la carte générée par l'IA renvoyée par le backend :")
            print(card)
            print("🌟"*25 + "\n")
            return  # On coupe ici pour empêcher le crash d'authentification Microsoft
        # -----------------------

        # --- MODE PRODUCTION (Vrai Teams) ---
        from botbuilder.core import MessageFactory
        async def callback(context):
            message = MessageFactory.attachment(card)
            await context.send_activity(message)

        await self._adapter.continue_conversation(reference, callback, bot_id)

    # ── Construction de l'Adaptive Card ───────────────────────────────────────

    @staticmethod
    def _build_result_card(summary: str, pdf_url: str) -> Attachment:
        """
        Génère une Adaptive Card Teams affichant :
          - Le texte du résumé de la réunion.
          - Un bouton « Télécharger le PDF » pointant vers pdf_url.
        """
        # Construit l'URL absolue si pdf_url est un chemin relatif
        full_pdf_url = (
            pdf_url
            if pdf_url.startswith("http")
            else f"{config.BACKEND_URL}{pdf_url}"
        )

        # Tronque le résumé si trop long pour l'Adaptive Card (limite ~15 000 chars)
        display_summary = summary if len(summary) <= 10_000 else summary[:10_000] + "…"

        card_content = {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.4",
            "body": [
                {
                    "type": "TextBlock",
                    "text": "📋 Résumé de la réunion",
                    "weight": "Bolder",
                    "size": "Large",
                    "color": "Accent",
                    "wrap": True,
                },
                {
                    "type": "TextBlock",
                    "text": "Votre réunion a été transcrite et résumée avec succès.",
                    "size": "Small",
                    "isSubtle": True,
                    "wrap": True,
                },
                {
                    "type": "Container",
                    "style": "emphasis",
                    "bleed": False,
                    "items": [
                        {
                            "type": "TextBlock",
                            "text": display_summary,
                            "wrap": True,
                            "size": "Default",
                        }
                    ],
                },
            ],
            "actions": [
                {
                    "type": "Action.OpenUrl",
                    "title": "Télécharger le compte-rendu PDF",
                    "url": full_pdf_url,
                    "style": "positive",
                }
            ],
        }

        return CardFactory.adaptive_card(card_content)