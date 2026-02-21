import multer from "multer";
import path from "path";
import fs from "fs"; // <--- 1. On ajoute ça

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/"; // Le dossier cible

    // 2. On vérifie si le dossier existe, sinon on le crée
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

// ... le reste ne change pas ...
const allowedVideoMimes = ["video/webm"];

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/") || allowedVideoMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers audio (ou WebM contenant de l'audio) sont autorisés"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 
  }
});