import fs from "fs";
import path from "path";
<<<<<<< HEAD
import OpenAI from "openai";


const execPromise = util.promisify(exec);
=======
import { transcribeAudio } from "../services/transcription.service.js";
import { summarizeText } from "../services/summarization.service.js";
import { generatePdf } from "../services/pdf.service.js";
>>>>>>> origin/backend-transcript

export const transcribeAudio = async (req, res) => {
  try {
<<<<<<< HEAD
    const filePath = req.file.path;
    const hfToken = process.env.HF_TOKEN;

    const whisperxPath = "/home/dalecooper/.local/bin/whisperx";
    const command = `${whisperxPath} "${filePath}" --model small --language fr --diarize --hf_token ${hfToken} --device cuda --compute_type int8 --output_dir "uploads" --output_format json`;

    await execPromise(command);

    let jsonPath = filePath + ".json";
    if (!fs.existsSync(jsonPath)) {
        const dir = path.dirname(filePath);
        const nameWithoutExt = path.parse(filePath).name;
        jsonPath = path.join(dir, nameWithoutExt + ".json");
=======
    if (!req.file?.path) {
      throw new Error("Aucun fichier audio fourni");
    }

    const uuid = req.user.uuid;
    const userDir = path.join("storage", uuid);

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
>>>>>>> origin/backend-transcript
    }

    console.log("UUID:", uuid);

<<<<<<< HEAD
    let dialogueText = "";
    data.segments.forEach(segment => {
        let speaker = segment.speaker || "Inconnu";
        dialogueText += `${speaker}: ${segment.text.trim()}\n`;
    });

    const dialoguePath = filePath + "_DIALOGUE.txt";
    fs.writeFileSync(dialoguePath, dialogueText);
    console.log("Dialogue sauvegardé :", dialoguePath);
=======
    /* ===========================
       1️⃣ TRANSCRIPTION
       =========================== */
    const segments = await transcribeAudio(req.file.path);

    const transcript = segments.map(s => {
      const min = Math.floor(s.start / 60).toString().padStart(2, "0");
      const sec = Math.floor(s.start % 60).toString().padStart(2, "0");
      return `[${min}:${sec}] ${s.speaker}: ${s.text}`;
    }).join("\n");
>>>>>>> origin/backend-transcript

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
<<<<<<< HEAD
      message: "Transcription terminée",
      transcription: dialogueText,
      filename: filePath 
    });

  } catch (error) {
    console.error("Erreur Transcription :", error);
    res.status(500).json({ error: error.message });
  }
};


export const summarizeMeeting = async (req, res) => {
  try {
    const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY}); 
    const { filename } = req.body; 

    if (!filename) {
        return res.status(400).json({ error: "Nom de fichier manquant." });
    }

    const dialoguePath = filename + "_DIALOGUE.txt";

    if (!fs.existsSync(dialoguePath)) {
        return res.status(404).json({ error: "Fichier de dialogue introuvable. Avez-vous fait la transcription ?" });
    }

    console.log("[2/2] Lecture du fichier et envoi à GPT...");
    const dialogueContent = fs.readFileSync(dialoguePath, "utf-8");

    const systemPrompt = `
    Tu es un assistant secrétaire expert. Si un speaker dit son nom, apprend le et garde le pour le compte rendu.
    Résume cette réunion de façon structurée (Markdown) :
    - Synthèse globale (3 phrases)
    - Points clés (Bullet points)
    - Actions à faire (To-Do avec noms)
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: dialogueContent },
      ],
=======
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
>>>>>>> origin/backend-transcript
    });

    const summary = completion.choices[0].message.content;

    fs.writeFileSync(filename + "_RESUME.md", summary);

    res.json({ summary });

  } catch (error) {
    console.error("Erreur Résumé :", error);
    res.status(500).json({ error: error.message });
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
