const fs = require("fs");
const OpenAI = require("openai");
const dotenv = require("dotenv");
dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const transcribeAudio = async (filePath) => {
  const transcriptionResponse = await openai.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "gpt-4o-transcribe-diarize",
    response_format: "diarized_json",
    chunking_strategy: "auto"
  });

  return transcriptionResponse.segments || [];
};

module.exports = { transcribeAudio };
