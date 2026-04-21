# Bot Teams — Enregistrement MP4 → MP3 → Backend

## Prérequis

### 1. ffmpeg sur le serveur
```bash
# Ubuntu / Debian
sudo apt install ffmpeg

# Docker — ajouter dans le Dockerfile
RUN apt-get update && apt-get install -y ffmpeg
```

### 2. Variables d'environnement
```env
MicrosoftAppId=<ton-app-id-azure>
MicrosoftAppPassword=<ton-app-password-azure>
BACKEND_URL=https://ton-backend.com/api/audio
```

### 3. Dépendances Python
```bash
pip install -r requirements.txt
```

---

## Lancement

```bash
python app.py
```

Le bot écoute sur `http://0.0.0.0:3978/api/messages`.

---

## Structure des fichiers

```
teams_bot/
├── app.py              # Point d'entrée, routing HTTP
├── bot.py              # Handler Teams (onMessage)
├── audio_processor.py  # Download MP4, conversion ffmpeg, envoi backend
└── requirements.txt
```

---

## Ce que fait le bot

1. Quelqu'un poste l'enregistrement de réunion dans un canal Teams (fichier `.mp4`)
2. Le bot détecte la pièce jointe vidéo via `on_message_activity`
3. Il télécharge le MP4 avec le token d'authentification Teams
4. Il convertit en MP3 via ffmpeg (dans un dossier temporaire)
5. Il envoie le MP3 à ton backend via `multipart/form-data`
6. Il confirme dans Teams avec un message

---

## Ce que reçoit ton backend

Requête `POST` sur `BACKEND_URL` avec :

| Champ        | Type   | Description                        |
|--------------|--------|------------------------------------|
| `file`       | binary | Le fichier MP3 (`audio/mpeg`)      |
| `filename`   | string | Nom du fichier (ex: `reunion.mp3`) |
| `meeting_id` | string | ID de la réunion Teams (optionnel) |

---

## Notes importantes

- Le fichier MP4 est téléchargé dans un dossier **temporaire** (`tempfile.TemporaryDirectory`) — il est automatiquement supprimé après traitement. Aucun stockage persistant nécessaire sur le bot.
- Le bot ne réagit qu'aux pièces jointes dont le `content_type` contient `"video"` ou dont le nom se termine par `.mp4`.
- Bitrate MP3 par défaut : **128k**. Modifiable dans `audio_processor.py` → paramètre `bitrate`.
