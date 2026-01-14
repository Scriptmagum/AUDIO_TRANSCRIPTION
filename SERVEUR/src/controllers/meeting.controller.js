/*
import { transcribeAudio } from "../services/transcription.service.js";
import { summarizeText } from "../services/summarization.service.js";
import { deleteFile } from "../utils/file.utils.js";

export const processMeeting = async (req, res) => {
  try {
    // 1️⃣ Vérification fichier
    if (!req.file) {
      return res.status(400).json({
        error: "Aucun fichier audio envoyé"
      });
    }

    const audioPath = req.file.path;

    // 2️⃣ Transcription IA
    const transcription = await transcribeAudio(audioPath);

    // 3️⃣ Résumé IA
    const summary = await summarizeText(transcription);

    // 4️⃣ Suppression du fichier audio
    await deleteFile(audioPath);


    // 5️⃣ Réponse au frontend
    res.status(200).json({
      transcription,
      summary
    });

  } catch (error) {
    console.error("❌ processMeeting error:", error);

    res.status(500).json({
      error: "Erreur lors du traitement de la réunion"
    });
  }
};
*/