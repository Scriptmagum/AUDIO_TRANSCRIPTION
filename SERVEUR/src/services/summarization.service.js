import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const summarizeText = async (text) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Tu es un assistant qui résume des réunions professionnelles." },
      { role: "user", content: `Fais un résumé clair, structuré et concis :\n\n${text}` }
    ],
    temperature: 0.2
  });

  return response.choices[0].message.content.trim();
};
