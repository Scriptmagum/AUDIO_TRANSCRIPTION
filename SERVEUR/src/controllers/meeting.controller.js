import fs from "fs";
import { exec } from "child_process";
import util from "util";
import path from "path";
import OpenAI from "openai";


const execPromise = util.promisify(exec);

export const transcribeAudio = async (req, res) => {
  try {
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
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    let dialogueText = "";
    data.segments.forEach(segment => {
        let speaker = segment.speaker || "Inconnu";
        dialogueText += `${speaker}: ${segment.text.trim()}\n`;
    });

    const dialoguePath = filePath + "_DIALOGUE.txt";
    fs.writeFileSync(dialoguePath, dialogueText);
    console.log("Dialogue sauvegardé :", dialoguePath);

    res.json({
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
    Tu es un assistant secrétaire expert. 
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
    });

    const summary = completion.choices[0].message.content;

    fs.writeFileSync(filename + "_RESUME.md", summary);

    res.json({ summary });

  } catch (error) {
    console.error("❌ Erreur Résumé :", error);
    res.status(500).json({ error: error.message });
  }
};