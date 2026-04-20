<<<<<<< HEAD
import multer from "multer";
import path from "path";
import fs from "fs"; 
=======
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // <--- 1. On ajoute ça
>>>>>>> origin/backend-transcript

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/"; 

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

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Seuls les fichiers audio sont autorisés"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

module.exports = { upload };