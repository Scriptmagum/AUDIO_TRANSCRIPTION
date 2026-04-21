import asyncio
import aiohttp
import aiofiles
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


async def download_mp4(url: str, token: str, output_path: str) -> None:
    """
    Télécharge le fichier MP4 depuis Teams.
    Le token Bearer est requis — Teams refuse les téléchargements non authentifiés.
    """
    headers = {"Authorization": f"Bearer {token}"}

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            response.raise_for_status()
            async with aiofiles.open(output_path, "wb") as f:
                async for chunk in response.content.iter_chunked(1024 * 64):
                    await f.write(chunk)

    logger.info(f"MP4 téléchargé : {output_path} ({Path(output_path).stat().st_size} bytes)")


async def convert_mp4_to_mp3(mp4_path: str, mp3_path: str, bitrate: str = "128k") -> None:
    """
    Convertit un fichier MP4 en MP3 via ffmpeg.
    ffmpeg doit être installé sur le serveur (apt install ffmpeg ou inclus dans le Dockerfile).

    Options ffmpeg :
      -vn         : ignore la piste vidéo
      -acodec mp3 : encode en MP3
      -ab         : bitrate audio (128k par défaut)
      -ar 44100   : fréquence d'échantillonnage standard
    """
    cmd = [
        "ffmpeg",
        "-i", mp4_path,
        "-vn",
        "-acodec", "mp3",
        "-ab", bitrate,
        "-ar", "44100",
        "-y",          # écrase le fichier de sortie si existant
        mp3_path
    ]

    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    stdout, stderr = await process.communicate()

    if process.returncode != 0:
        error_msg = stderr.decode("utf-8", errors="replace")
        raise RuntimeError(f"ffmpeg a échoué (code {process.returncode}) : {error_msg}")

    logger.info(f"Conversion réussie : {mp3_path} ({Path(mp3_path).stat().st_size} bytes)")


async def send_mp3_to_backend(
    mp3_path: str,
    filename: str,
    backend_url: str,
    meeting_id: str | None = None,
) -> dict:
    """
    Envoie le fichier MP3 au backend via multipart/form-data.

    Le backend recevra :
      - file     : le fichier MP3 (champ 'file')
      - filename : le nom du fichier
      - meeting_id : l'ID de la réunion Teams (optionnel)
    """
    async with aiofiles.open(mp3_path, "rb") as f:
        mp3_bytes = await f.read()

    data = aiohttp.FormData()
    data.add_field(
        "file",
        mp3_bytes,
        filename=filename,
        content_type="audio/mpeg"
    )

    if meeting_id:
        data.add_field("meeting_id", meeting_id)

    data.add_field("filename", filename)

    async with aiohttp.ClientSession() as session:
        async with session.post(backend_url, data=data) as response:
            response.raise_for_status()
            result = await response.json()
            logger.info(f"MP3 envoyé au backend. Statut HTTP : {response.status}")
            return result
