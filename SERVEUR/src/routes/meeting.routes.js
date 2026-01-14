import express from "express";
import { upload } from "../middlewares/upload.middleware.js";
/*
import {
  processMeeting
} from "../controllers/meeting.controller.js";
*/
const router = express.Router();



// l'unique route dont le front a besoin
router.post(
  "/audio",
  upload.single("file"),
  (req, res) => {
    // Si le fichier est arrivé jusque-là, c'est gagné
    console.log("✅ Fichier audio bien reçu sur le serveur !");
    
    // IMPORTANT : On doit renvoyer une réponse au frontend pour fermer la connexion
    res.status(200).json({ 
        message: "Audio reçu avec succès", 
        filename: req.file ? req.file.filename : "Erreur fichier"
    });
  }
);


/* Pour des besoins de test ou d'usage avancé, on expose aussi les routes
   de transcription seule et de résumé seul */
   /*
router.post(
  "/transcribe",
  upload.single("audio"),
  transcribeOnly
);

router.post("/summarize", summarizeOnly);
*/
export default router;
