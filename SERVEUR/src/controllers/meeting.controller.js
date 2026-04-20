const fs = require("fs");
const { transcribeAudio } = require("../services/transcription.service.js");
const { summarizeText } = require("../services/summarization.service.js");
const { generatePdf } = require("../services/pdf.service.js");
const Transcription = require("../models/Transcription.js");

const processMeeting = async (req, res) => {
  let transcriptionDoc;

  try {
    if (!req.file?.path) {
      throw new Error("Aucun fichier audio fourni");
    }

    const { lang } = req.params;
    const validLanguages = ["fr", "en", "de", "es"];

    if (!validLanguages.includes(lang)) {
      throw new Error(`Langue non supportée. Langues acceptées: ${validLanguages.join(", ")}`);
    }

    const userId = req.user.userId;
    const filename = req.file.originalname || "audio-file";

    console.log("UserId:", userId);
    console.log("Langue:", lang);

    transcriptionDoc = new Transcription({
      userId,
      filename,
      status: "pending"
    });
    await transcriptionDoc.save();

    const segments = await transcribeAudio(req.file.path);
    const transcript = segments.map(s => {
      const min = Math.floor(s.start / 60).toString().padStart(2, "0");
      const sec = Math.floor(s.start % 60).toString().padStart(2, "0");
      return `[${min}:${sec}] ${s.speaker}: ${s.text}`;
    }).join("\n");

    const summary = await summarizeText(transcript, lang);

    transcriptionDoc.result = transcript;
    transcriptionDoc.summary = summary;
    transcriptionDoc.status = "done";
    await transcriptionDoc.save();

    fs.unlink(req.file.path, err => {
      if (err) console.error("Impossible de supprimer le fichier audio temporaire :", err);
    });

    res.json({
      message: "Traitement terminé",
      transcriptionId: transcriptionDoc._id,
      uuid: transcriptionDoc._id,
      transcript: transcriptionDoc.result,
      summary: transcriptionDoc.summary,
      pdf_url: "/meeting/result/pdf"
    });
  } catch (error) {
    console.error("processMeeting error:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupErr) {
        console.error("cleanup error:", cleanupErr);
      }
    }

    if (transcriptionDoc) {
      transcriptionDoc.status = "error";
      await transcriptionDoc.save().catch(saveErr => console.error("Erreur lors de la mise à jour du document transcription :", saveErr));
    }

    res.status(400).json({
      error: "Erreur traitement",
      details: error.message
    });
  }
};

const getLatestTranscription = async (userId) => {
  return Transcription.findOne({ userId, status: "done" }).sort({ createdAt: -1 }).lean();
};

const getMeetingResult = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transcription = await getLatestTranscription(userId);

    if (!transcription) {
      return res.status(404).json({
        error: "Résultats non disponibles"
      });
    }

    res.json({
      uuid: transcription._id,
      transcript: transcription.result,
      summary: transcription.summary,
      pdf_url: "/meeting/result/pdf"
    });
  } catch (err) {
    console.error("getMeetingResult:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

const sendPdf = async (req, res) => {
  try {
    const userId = req.user.userId;
    const transcription = await getLatestTranscription(userId);

    if (!transcription) {
      return res.status(404).json({ error: "PDF introuvable" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=resume.pdf");

    await generatePdf(res, "MEETING AI", transcription.summary || transcription.result || "");
  } catch (err) {
    console.error("sendPdf:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      res.end();
    }
  }
<<<<<<< HEAD

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=resume.pdf");

  fs.createReadStream(pdfPath).pipe(res);
};
=======
};

module.exports = {
  processMeeting,
  getMeetingResult,
  sendPdf
};
>>>>>>> origin/backend-transcript
