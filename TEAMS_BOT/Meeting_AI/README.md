# Meeting Assistant Bot — Teams

Bot Microsoft Teams qui intercepte automatiquement les enregistrements de réunion, les transcrit et génère un résumé en PDF, le tout posté directement dans le channel.

---

## Fonctionnement général

```
Enregistrement Teams (SharePoint/OneDrive)
        │
        ▼
  [graph_api.py]  ←── Authentification MSAL (client credentials)
  Téléchargement .mp4
        │
        ▼
  [audio_processor.py]
  Conversion .mp4 → .mp3 (ffmpeg, mono 16 kHz)
        │
        ▼
  [backend_client.py]
  Upload multipart vers le backend de transcription
        │
        ▼
  [bot.py]
  Adaptive Card envoyée dans le channel Teams
  (résumé + bouton "Télécharger le PDF")
```

Le bot répond **immédiatement** au message Teams (contrainte 15 s du Bot Framework), puis traite l'enregistrement en tâche de fond via `asyncio.create_task`.

---

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `app.py` | Point d'entrée : serveur aiohttp, route `/api/messages`, lifecycle startup/shutdown |
| `bot.py` | Logique du bot : détection d'enregistrement, pipeline asynchrone, Adaptive Card |
| `graph_api.py` | Auth MSAL + téléchargement de fichiers SharePoint/OneDrive via Microsoft Graph |
| `audio_processor.py` | Conversion .mp4 → .mp3 non-bloquante via ffmpeg |
| `backend_client.py` | Singleton HTTP pour le backend de transcription (login, upload audio) |
| `config.py` | Centralisation des variables d'environnement (avec validation au démarrage) |

---

## Prérequis

- Python 3.11+
- `ffmpeg` installé et dans le `PATH`
- Un tenant Azure AD avec une App Registration


### Dépendances Python

```bash
pip install -r requiremnts.txt
```

---

## Configuration

Créez un fichier `.env` à la racine du projet :

```env
# Bot Framework
MicrosoftAppId=<GUID de votre App Registration bot>
MicrosoftAppPassword=<Secret du bot>

# Azure AD / Microsoft Graph
AZURE_TENANT_ID=<GUID de votre tenant Azure AD>
GRAPH_CLIENT_ID=<GUID de l'App Registration Graph>
GRAPH_CLIENT_SECRET=<Secret de l'app Graph>

# Backend de transcription
BACKEND_URL=https://api.mon-backend.com
BACKEND_EMAIL=user@example.com
BACKEND_PASSWORD=motdepasse
BACKEND_API_KEY=ma-cle-api

# Optionnel
PORT=3978
HOST=0.0.0.0
TEMP_DIR=/tmp/teams_bot
BOT_ENV=production        # Mettre "development" pour activer la route de test
GRAPH_SKIP_AUTH=false     # Mettre "true" pour bypasser Azure AD en local
```

### Permissions Azure AD requises

L'App Registration Graph doit avoir les permissions **Application** (pas déléguées) suivantes, avec **consentement administrateur** accordé :

- `Files.Read.All`
- `Sites.Read.All` *(optionnel, pour SharePoint d'équipe)*

---

## Lancement

```bash
F5 dans "Meeting_AI"
```

Le serveur démarre sur `http://0.0.0.0:3978`. Exposez l'endpoint `/api/messages` via un tunnel (ngrok en dev, Azure App Service en prod).

### Healthcheck

```
GET /health
→ { "status": "ok", "bot": "MeetingAssistantBot" }
```

---

## Route de test (développement)

Activée uniquement si `BOT_ENV=development`.

```
POST /test/recording
Content-Type: application/json
```

**Avec un fichier SharePoint (pipeline complet) :**
```json
{
  "sharepoint_url": "https://contoso.sharepoint.com/.../recording.mp4"
}
```

**Avec un fichier local (bypass Graph API) :**
```json
{
  "local_mp4": "/chemin/vers/fichier.mp4",
  "conversation_id": "test-conv-1"
}
```

> ⚠️ Ne jamais exposer cette route en production.

---

## Détails techniques

### Détection de l'enregistrement

`graph_api.extract_sharepoint_url_from_activity()` inspecte deux sources dans le message Teams entrant :
1. Les **pièces jointes structurées** (`attachments`) de type `fileDownload`
2. Le **corps HTML** du message (regex sur les URLs `.sharepoint.com/*.mp4`)

### Authentification Graph (MSAL)

- Flux **Client Credentials** (application, sans utilisateur)
- Token mis en cache automatiquement par MSAL et renouvelé à l'expiration
- Variable `GRAPH_SKIP_AUTH=true` pour les tests locaux sans tenant Azure réel

### Conversion audio

ffmpeg est appelé de façon **non-bloquante** via `asyncio.create_subprocess_exec`. Paramètres de sortie optimisés pour la transcription vocale : **mono, 16 kHz, 128 kbps**.

### Ré-authentification automatique du backend

Si le backend répond HTTP 401 lors de l'upload, `BackendClient` relance automatiquement le login et retente l'envoi une fois.

---

## Variables d'environnement — référence complète

| Variable | Obligatoire | Description |
|---|---|---|
| `MicrosoftAppId` | ✅ | App ID du Bot Framework |
| `MicrosoftAppPassword` | ✅ | Secret du bot |
| `AZURE_TENANT_ID` | ✅ | GUID du tenant Azure AD |
| `GRAPH_CLIENT_ID` | ✅ | Client ID de l'app Graph |
| `GRAPH_CLIENT_SECRET` | ✅ | Secret de l'app Graph |
| `BACKEND_URL` | ✅ | URL de base du backend |
| `BACKEND_EMAIL` | ✅ | Email de login backend |
| `BACKEND_PASSWORD` | ✅ | Mot de passe backend |
| `BACKEND_API_KEY` | ✅ | Header `x-api-key` backend |
| `PORT` | ❌ | Port du serveur (défaut : `3978`) |
| `HOST` | ❌ | Adresse d'écoute (défaut : `0.0.0.0`) |
| `TEMP_DIR` | ❌ | Répertoire temporaire (défaut : `/tmp/teams_bot`) |
| `BOT_ENV` | ❌ | `development` active la route de test |
| `GRAPH_SKIP_AUTH` | ❌ | `true` pour bypasser MSAL en local |