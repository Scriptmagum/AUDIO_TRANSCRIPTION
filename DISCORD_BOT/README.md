# Bot de Réunion (Meeting Bot)

Un bot Discord qui enregistre les salons vocaux, transcrit l'audio, et publie un résumé dans le salon. L'enregistrement est géré localement par le bot ; la transcription et le résumé sont délégués à un serveur backend séparé qui utilise l'API d'OpenAI.

---

## Comment ça fonctionne

```text
Salon vocal Discord
        |
        | Paquets RTP Opus (par utilisateur)
        v
  décodeur Opus prism  (PCM mono, 48 kHz)
        |
        v
  stdin de ffmpeg      (tous les intervenants fusionnés en un seul flux)
        |
        v
  temp_<guildId>.pcm   (fichier PCM brut sur le disque)
        |
  commande !stop
        |
        v
  conversion ffmpeg    (PCM -> MP3, 128 kbps)
        |
        v
  POST /meeting/process/:lang    (upload multipart vers le backend)
        |
        v
  Backend (OpenAI Whisper + résumé GPT)
        |
        v
  Réponse Discord      (texte du résumé + pièce jointe PDF)
```

Le flux Opus de chaque intervenant est décodé indépendamment et redirigé vers un processus ffmpeg partagé unique. Le résultat est un fichier PCM mono de 48 kHz qui capture tous les participants du salon. Lorsque l'enregistrement s'arrête, ce fichier est converti en MP3 et envoyé au serveur.

---

## Structure du projet

```text
bot.js              Point d'entrée. Configuration du client Discord, gestionnaires d'événements, routage des commandes.
auth.js             Authentification backend (connexion / inscription, gestion des clés API).
backend.js          Requêtes HTTP pour l'envoi au serveur de transcription, formatage de la réponse Discord.
recording.js        Logique pour rejoindre le salon vocal, pipeline audio par utilisateur, logique d'arrêt/départ.
voice-patches.js    Correctifs (Monkey-patches) pour deux bugs connus de @discordjs/voice (voir ci-dessous).
```

---

## Prérequis

- Node.js 18 ou version ultérieure
- ffmpeg disponible via `ffmpeg-static` (installé comme dépendance)
- Une instance active du backend de transcription
- Un token de bot Discord avec les intentions (intents) suivantes activées dans le portail développeur :
  - Server Members Intent (Intention des membres du serveur)
  - Message Content Intent (Intention du contenu des messages)

---

## Installation

```bash
npm install
cp .env.example .env
# Remplir les valeurs dans le fichier .env
node bot.js
```

---

## Variables d'environnement

| Variable | Requis | Défaut | Description |
|---|---|---|---|
| `DISCORD_TOKEN` | Oui | — | Token du bot provenant du portail développeur Discord. |
| `BACKEND_URL` | Non | `http://localhost:3001` | URL de base du serveur de transcription. |
| `MEETING_LANG` | Non | `fr` | Code de langue envoyé à `/meeting/process/:lang`. Les valeurs acceptées dépendent du backend (`fr`, `en`, `de`, `es`). |
| `BOT_EMAIL` | Non | `bot@discord.local` | Email utilisé pour authentifier le bot auprès du backend. |
| `BOT_PASSWORD` | Non | `BotSecret123!` | Mot de passe pour le compte du bot. |
| `BOT_API_KEY` | Non | — | Clé API pour le backend. Générée automatiquement au premier lancement si elle est absente ; la valeur est affichée dans la console et doit être copiée dans le `.env`. |
| `TARGET_VOICE_CHANNEL_ID` | Non | — | ID du salon pour la connexion automatique (auto-join). Si défini, le bot rejoint lorsque le premier humain entre, et quitte (sans sauvegarder) lorsque le salon se vide. |
| `VOICE_DEBUG` | Non | — | Définir sur `1` pour afficher des logs détaillés du WebSocket vocal, y compris les codes de fermeture. |
| `VOICE_DISABLE_NET_PATCHES` | Non | — | Définir sur `1` pour ignorer le correctif anti-rebond (debounce) de `configureNetworking`. Utile lors du débogage de la connectivité vocale. |

---

## Commandes

Toutes les commandes sont des messages texte simples précédés de `!`. Le bot ignore les messages provenant d'autres bots.

**`!join`** — Rejoindre le salon vocal dans lequel vous vous trouvez actuellement et lancer l'enregistrement. Vous devez être dans un salon vocal lorsque vous envoyez cette commande.

**`!stop`** — Arrêter l'enregistrement, le convertir en MP3, l'envoyer au backend, et publier le résumé dans le salon textuel. Les fichiers audio temporaires sont supprimés après l'envoi, que celui-ci réussisse ou non.

**`!leave`** — Quitter le salon vocal immédiatement et annuler l'enregistrement en cours sans rien envoyer.

---

## Comportement de connexion automatique (Auto-join)

Si `TARGET_VOICE_CHANNEL_ID` est défini, le bot surveille les événements `VoiceStateUpdate`. Il rejoint le salon cible lorsque le premier membre non-bot y entre, et ne le rejoindra qu'une seule fois par serveur (une deuxième tentative de connexion alors qu'il enregistre déjà est ignorée silencieusement). Au démarrage, si le salon contient déjà des humains, le bot le rejoint immédiatement sans attendre l'arrivée d'un nouveau membre.

L'auto-join ne déclenche pas `!stop` automatiquement lorsque le salon se vide — vous devez exécuter `!stop` ou `!leave` manuellement.

---

## Flux d'authentification

Au démarrage, le bot s'authentifie auprès du backend avec `BOT_EMAIL` et `BOT_PASSWORD` :

1. `POST /auth/signin` — si cela retourne un cookie `Authorization`, l'authentification est terminée.
2. Si la connexion échoue (le compte n'existe pas encore), `POST /auth/signup` est appelé, puis la connexion (`signin`) est réessayée une fois.
3. `POST /user/apikey` — appelé si `BOT_API_KEY` n'est pas défini dans le `.env`. La clé générée est affichée dans la console. **Copiez-la dans le `.env`** avant le prochain redémarrage, sinon une nouvelle clé sera générée à chaque lancement.

Le JWT extrait est stocké en mémoire et attaché à chaque requête backend ultérieure sous forme de cookie. La clé API voyage dans l'en-tête `x-api-key`.

---

## Correctifs vocaux (Voice patches)

Deux correctifs (monkey-patches) sont appliqués à `@discordjs/voice` au démarrage (dans `voice-patches.js`).

**Anti-rebond (debounce) de configureNetworking.** Discord envoie parfois deux paquets `VOICE_SERVER_UPDATE` consécutifs. Chaque appel à `configureNetworking()` ferme le WebSocket actuel et en ouvre un nouveau. Si le second appel arrive alors que le premier WebSocket est encore dans la phase d'identification (entre Hello et Ready), il détruit la connexion active avant qu'elle ne devienne utilisable. Le correctif retarde les appels de 500 ms et ignore un second appel si la clé de session est inchangée et que la connexion est déjà dans l'état "Connecting".

**Journalisation des codes de fermeture.** La fonction `onNetworkingClose` de la bibliothèque ne journalise pas le code de fermeture numérique du WebSocket, ce qui rend difficile le diagnostic des échecs de type "Hello → fermeture, sans jamais atteindre Ready". Le correctif journalise le code avec une description lisible lorsque `VOICE_DEBUG=1`.

Définissez `VOICE_DISABLE_NET_PATCHES=1` pour ignorer le correctif anti-rebond si vous avez besoin d'isoler un problème de connectivité.

---

## Limites connues

- Un seul enregistrement par serveur (guild) à la fois. Les enregistrements simultanés sur plusieurs salons d'un même serveur ne sont pas pris en charge.
- Le résumé publié sur Discord est tronqué à 1500 caractères. Le contenu complet est disponible dans la pièce jointe PDF.
- Les fichiers temporaires PCM et MP3 sont écrits dans le répertoire de travail. Assurez-vous que le processus a les droits d'écriture et qu'il y a suffisamment d'espace disque pour les longs enregistrements.
- Le bot ne quitte pas automatiquement lorsqu'un salon se vide. Ajoutez un gestionnaire d'événement `VoiceStateUpdate` si ce comportement est nécessaire.