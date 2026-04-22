"""
audio_processor.py — Conversion asynchrone de .mp4 en .mp3 via ffmpeg.

La conversion est entièrement non-bloquante grâce à asyncio.create_subprocess_exec.
Le fichier .mp3 résultant est optimisé pour la transcription (mono, 16 kHz, 128 kbps).
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Paramètres de conversion audio (optimisés pour la transcription vocale)
_FFMPEG_AUDIO_CODEC = "libmp3lame"
_FFMPEG_BITRATE = "128k"
_FFMPEG_SAMPLE_RATE = "16000"   # 16 kHz — suffisant pour la parole
_FFMPEG_CHANNELS = "1"          # mono


async def convert_mp4_to_mp3(mp4_path: Path, mp3_path: Path) -> Path:
    """
    Convertit un fichier .mp4 en .mp3 de façon non-bloquante.

    Args:
        mp4_path: Chemin vers le fichier vidéo source.
        mp3_path: Chemin de destination pour le fichier audio.

    Returns:
        Le chemin `mp3_path` une fois la conversion terminée.

    Raises:
        RuntimeError: si ffmpeg n'est pas installé ou si la conversion échoue.
        FileNotFoundError: si `mp4_path` n'existe pas.
    """
    if not mp4_path.exists():
        raise FileNotFoundError(f"Fichier source introuvable : {mp4_path}")

    mp3_path.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg",
        "-y",                        # Overwrite sans confirmation
        "-i", str(mp4_path),         # Fichier d'entrée
        "-vn",                       # Supprime la piste vidéo
        "-acodec", _FFMPEG_AUDIO_CODEC,
        "-ab", _FFMPEG_BITRATE,
        "-ar", _FFMPEG_SAMPLE_RATE,
        "-ac", _FFMPEG_CHANNELS,
        str(mp3_path),               # Fichier de sortie
    ]

    logger.info("ffmpeg : démarrage conversion %s → %s", mp4_path.name, mp3_path.name)
    logger.debug("ffmpeg commande : %s", " ".join(cmd))

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()
    except FileNotFoundError as exc:
        raise RuntimeError(
            "ffmpeg est introuvable. Assurez-vous qu'il est installé et dans le PATH."
        ) from exc

    if proc.returncode != 0:
        stderr_text = stderr.decode(errors="replace").strip()
        logger.error("ffmpeg a échoué (code %d) :\n%s", proc.returncode, stderr_text)
        raise RuntimeError(
            f"Conversion ffmpeg échouée (code {proc.returncode}) : {stderr_text[-500:]}"
        )

    size_mb = mp3_path.stat().st_size / (1024 * 1024)
    logger.info(
        "ffmpeg : conversion terminée → %s (%.2f MB)", mp3_path.name, size_mb
    )
    return mp3_path