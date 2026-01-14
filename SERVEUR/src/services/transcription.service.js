import { pipeline } from "@xenova/transformers";

await async function transcrireFichier(){

const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');

console.log("Début transcription")

const result = await transcriber("", {  //mettre chevin vers là où on store le fichier audio
    language : french,
    chunk_lenght_s : 30,
    stride_lenght_s : 5
});

console.log(result.text);

}

transcrireFichier();