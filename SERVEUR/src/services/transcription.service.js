import { pipeline } from "@xenova/transformers";
import wavefile from 'wavefile';
import fs from 'fs';

async function transcrireFichier(){

    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');

    console.log("Début transcription")

    let buffer = fs.readFileSync('./audiofile.wav');

    let wav = new wavefile.WaveFile(buffer);

    wav.toBitDepth('32f');
    wav.toSampleRate(16000);

    let audioData = wav.getSamples();

    if (Array.isArray(audioData)) {
        if (audioData.length > 1) {
            const monoData = audioData[0];
            audioData = monoData; 
        }
    }

    const result = await transcriber(audioData, {
        language: 'french',
        chunk_length_s: 30,
        stride_length_s: 5
    });

    console.log(result.text);

}

transcrireFichier();