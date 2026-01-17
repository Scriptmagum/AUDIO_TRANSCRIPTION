import fs from "fs";
import { exec } from "child_process";
import util from "util";
import path from "path";

const execPromise = util.promisify(exec);

export const processMeeting = async (req, res) => {
  try {
    const filePath = req.file.path;

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
        throw new Error("La clé HF_TOKEN est introuvable dans le fichier .env !");
    }

    const whisperXPath = "/home/dalecooper/.local/bin/whisperx"

    console.log("Transcription en cours...");

    const command = `${whisperXPath} "${filePath}" --model small --language fr --diarize --hf_token ${hfToken} --device cuda --compute_type float16 --output_dir "uploads" --output_format json`;

    await execPromise(command);

    let jsonPath = filePath + ".json"; 
    if (!fs.existsSync(jsonPath)) {
        const dir = path.dirname(filePath);
        const nameWithoutExt = path.parse(filePath).name;
        jsonPath = path.join(dir, nameWithoutExt + ".json");
    }
    if (!fs.existsSync(jsonPath)){
      throw new Error("Fichier json pas généré");
    }   

    const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

    let dialog = "";
    data.segments.forEach(segment=>{
      let speakerName = segment.speaker || "Inconnu";
      
      const minutes = Math.floor(segment.start / 60);
      const seconds = Math.floor(segment.start % 60).toString().padStart(2, '0');
      const timeStamp = `${minutes}:${seconds}`;

      dialog += `[${timeStamp}] ${speakerName} : ${segment.text.trim()}\n`;
    })
    
    console.log("\n" + "=".repeat(60));
    console.log("RÉSULTAT DE LA TRANSCRIPTION");
    console.log("=".repeat(60));
    console.log(dialog);
    console.log("=".repeat(60));
    console.log("Fin de la transcription.\n");

    res.json({
        message: "Traitement terminé",
        transcription: dialog,
        raw_data: data
    });
  } catch (error) {
    console.error("Erreur lors de la transcription : ", error);
    res.status(400).json({
      error: "Erreur lors de la transcription",
      details: error.message
    });
  }
};