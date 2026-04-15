# AUDIO_TRANSCRIPTION

API transcription audio

### step

1- **installation mongo_db linux**:
  
```bash
sudo apt update

wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update && sudo apt install -y mongodb-org

sudo systemctl start mongod

sudo systemctl enable mongod

sudo systemctl status mongod
```
2- **installer dependances**:

  `npm install`
  
3- **demarrer le serveur**:

`npm run dev`
  
  
NB: **interface api swagger**:

  `http://localhost:3001/api-docs`
  