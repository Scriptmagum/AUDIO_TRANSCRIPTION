# Meeting AI — Transcription et Synthèse de Réunions par l'IA

> Enregistrez une réunion, obtenez un résumé. Fonctionne avec Discord et Microsoft Teams.

Un système multi-composants qui capture l'audio des réunions, le transcrit à l'aide d'**OpenAI Whisper**, génère un résumé structuré avec **GPT**, et fournit le résultat — y compris un rapport PDF — directement sur votre plateforme de communication.

Réalisé dans le cadre d'un projet de 4ème année d'école d'ingénieurs (SAGI, 2025-2026) par Corentin Lucas, Florian Warin, et Ridiwane Mama Touré.

---

## Comment ça marche

    Source audio (Salon vocal Discord ou enregistrement Teams)
            │
            ▼
     Conversion audio  →  MP3 mono (ffmpeg)
            │
            ▼
     POST /meeting/process/{lang}  →  Backend (Express)
            │
            ├──► OpenAI Whisper  →  transcription
            ├──► OpenAI GPT      →  résumé structuré
            └──► Générateur PDF   →  stocké dans MongoDB
            │
            ▼
     Résultat envoyé à l'utilisateur
     (Message Discord + pièce jointe PDF  /  Carte adaptative Teams)

---

## Structure du dépôt

    meeting-ai/
    ├── backend/          API REST Express — pipeline de transcription, auth, génération PDF
    ├── discord-bot/      Bot Node.js — enregistrement vocal, commandes !join / !stop / !leave
    ├── teams-bot/        Bot Python — intercepte les enregistrements Teams via l'API Microsoft Graph
    └── frontend/         Vite + Tailwind CSS — interface web connectée au backend

---

## Composants

### Backend — Express + MongoDB
La couche de traitement partagée, consommée par tous les clients. Gère l'authentification, les appels à l'API OpenAI, la génération de PDF et le stockage des résultats.

**API (OpenAPI 3.0, documentée via Swagger sur `/api-docs`) :**

| Méthode | Route | Description |
|---|---|---|
| POST | `/auth/signup` | Inscrire un nouvel utilisateur |
| POST | `/auth/signin` | S'authentifier et recevoir un cookie JWT |
| POST | `/auth/signout` | Mettre fin à la session |
| POST | `/meeting/process/{lang}` | Uploader un fichier audio, recevoir la transcription + le résumé |
| GET | `/meeting/result` | Récupérer la dernière transcription et l'URL du PDF |
| GET | `/meeting/result/pdf` | Télécharger le PDF généré |
| POST | `/user/apikey` | Générer une clé API |

Voir `backend/README.md` pour les instructions d'installation.

---

### Bot Discord — Node.js
Rejoint un salon vocal, enregistre tous les participants dans un seul flux audio mixé, et publie le résumé lorsqu'on le lui demande.

**Commandes :**

| Commande | Description |
|---|---|
| `!join` | Rejoindre votre salon vocal actuel et démarrer l'enregistrement |
| `!stop` | Arrêter l'enregistrement, traiter l'audio, publier le résumé |
| `!leave` | Quitter immédiatement sans sauvegarder |

**Variables d'environnement clés :**

| Variable | Requis | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Token du bot depuis le portail développeur Discord |
| `BACKEND_URL` | ❌ | URL de base du backend (défaut : `http://localhost:3001`) |
| `MEETING_LANG` | ❌ | Code langue : `fr`, `en`, `de`, `es` (défaut : `fr`) |
| `TARGET_VOICE_CHANNEL_ID` | ❌ | ID du salon pour l'auto-join au premier participant humain |

Voir `discord-bot/README.md` pour la référence complète des variables et les détails du pipeline audio.

---

### Bot Teams — Python
Intercepte les enregistrements de réunions automatiquement uploadés sur SharePoint/OneDrive après la fin d'une réunion Teams, les traite via le backend partagé, et publie le résultat sous forme de Carte Adaptative (Adaptive Card) dans le canal.

**Statut :** Pipeline audio entièrement fonctionnel. Déploiement bloqué en attente de l'enregistrement de l'application Azure AD (nécessite le consentement de l'administrateur sur `Files.Read.All`).

**Variables d'environnement clés :**

| Variable | Requis | Description |
|---|---|---|
| `MicrosoftAppId` | ✅ | ID d'application Bot Framework |
| `MicrosoftAppPassword` | ✅ | Secret Bot Framework |
| `AZURE_TENANT_ID` | ✅ | GUID du locataire (tenant) Azure AD |
| `GRAPH_CLIENT_ID` | ✅ | ID client de l'application Microsoft Graph |
| `GRAPH_CLIENT_SECRET` | ✅ | Secret de l'application Microsoft Graph |
| `BACKEND_URL` | ✅ | URL de base du backend |

Voir `teams-bot/README.md` pour la procédure de configuration complète et les autorisations Azure requises.

---

### Frontend — Vite + Tailwind CSS
Interface web permettant d'uploader des fichiers audio et de récupérer les résultats de transcription et les PDF. Communique avec le backend via la même API REST utilisée par les bots.

Voir `frontend/README.md` pour les instructions d'installation et de build.

---

## Prérequis

- **Node.js 18+** — Bot Discord et backend
- **Python 3.11+** — Bot Teams
- **ffmpeg** — requis par tous les composants (intégré automatiquement pour le bot Discord via `ffmpeg-static` ; doit être installé séparément pour le bot Teams)
- **MongoDB** — instance en cours d'exécution accessible par le backend
- **Clé API OpenAI** — pour la transcription Whisper et la synthèse GPT

---

## Langues prises en charge

La langue de transcription est configurable par client. Langues testées : **Français, Anglais, Allemand, Espagnol**.

---

## Limites connues

- Le bot Discord prend en charge un seul enregistrement actif par serveur à la fois.
- Le résumé sur Discord est tronqué à 1500 caractères (limite de l'API Discord) ; le contenu complet se trouve dans le fichier PDF en pièce jointe.
- Le bot ne quitte pas automatiquement un salon vocal lorsqu'il se vide — utilisez `!stop` ou `!leave`.
- La diarisation des locuteurs (attribution de la parole à chaque intervenant) n'est pas encore implémentée.
- Le bot Teams ne peut pas être déployé sans finaliser l'enregistrement de l'application Azure AD avec le consentement de l'administrateur.

---

## Statut du projet

| Composant | Statut |
|---|---|
| Backend | ✅ Entièrement fonctionnel |
| Bot Discord | ✅ Entièrement fonctionnel — testé en conditions réelles |
| Frontend Web | ✅ Terminé |
| Bot Teams | ⚠️ Pipeline fonctionnel — déploiement bloqué par l'enregistrement Azure |

---

## Équipe

| Nom | Responsabilités |
|---|---|
| Corentin Lucas | Bot Discord, Bot Teams |
| Florian Warin | Frontend Web, Bot Teams |
| Ridiwane Mama Touré | Backend, Base de données |

Superviseur : David Langin — SAGI 4A, 2025–2026