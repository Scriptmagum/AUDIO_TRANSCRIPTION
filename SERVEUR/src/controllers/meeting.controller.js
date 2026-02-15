import fs from "fs";
import path from "path";
import { transcribeAudio } from "../services/transcription.service.js";
import { summarizeText } from "../services/summarization.service.js";
import { generatePdf } from "../services/pdf.service.js";

export const processMeeting = async (req, res) => {
  try {
    if (!req.file?.path) {
      throw new Error("Aucun fichier audio fourni");
    }

    const uuid = req.user.uuid;
    const userDir = path.join("storage", uuid);

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    console.log("UUID:", uuid);

    /* ===========================
       1️⃣ TRANSCRIPTION
       =========================== */
    const segments = await transcribeAudio(req.file.path);

    const transcript = segments.map(s => {
      const min = Math.floor(s.start / 60).toString().padStart(2, "0");
      const sec = Math.floor(s.start % 60).toString().padStart(2, "0");
      return `[${min}:${sec}] ${s.speaker}: ${s.text}`;
    }).join("\n");

    const transcriptPath = path.join(userDir, "transcript.txt");
    fs.writeFileSync(transcriptPath, transcript, "utf-8");

    /* ===========================
       2️⃣ RÉSUMÉ
       =========================== */
    const summary = await summarizeText(transcript);

    /* ===========================
       3️⃣ GÉNÉRATION PDF
       =========================== */
    const pdfPath = path.join(userDir, "resume.pdf");

    await generatePdf(
      pdfPath,
      "Résumé de la réunion",
      summary
    );

    /* ===========================
       4️⃣ RÉPONSE
       =========================== */
    res.json({
      message: "Traitement terminé",
      uuid,
      files: {
        transcript: "transcript.txt",
        pdf: "resume.pdf"
      }
    });

  } catch (error) {
    console.error("processMeeting error:", error);
    res.status(400).json({
      error: "Erreur traitement",
      details: error.message
    });
  }
};


export const getMeetingResult = async (req, res) => {
  try {
    const uuid = req.user.uuid;
    const userDir = path.join("storage", uuid);

    const transcriptPath = path.join(userDir, "transcript.txt");
    const pdfPath = path.join(userDir, "resume.pdf");

    if (!fs.existsSync(transcriptPath) || !fs.existsSync(pdfPath)) {
      return res.status(404).json({
        error: "Résultats non disponibles"
      });
    }

    const transcript = fs.readFileSync(transcriptPath, "utf-8");

    res.json({
      uuid,
      transcript,
      pdf_url: `/meeting/result/pdf`
    });

  } catch (err) {
    console.error("getMeetingResult:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const sendPdf = (req, res) => {
  const uuid = req.user.uuid;
  const pdfPath = path.join("storage", uuid, "resume.pdf");

  if (!fs.existsSync(pdfPath)) {
    return res.status(404).json({ error: "PDF introuvable" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=resume.pdf");

  fs.createReadStream(pdfPath).pipe(res);
};