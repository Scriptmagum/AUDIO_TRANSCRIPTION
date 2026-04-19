import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const summarizeText = async (text, mode, language) => {

  let systemPrompt;
  let userPrompt;

  if (language === "Français") {
    if (mode === "Détente") {
      systemPrompt = "Tu es un assistant décontracté et amical. Fais un résumé léger, amusant et va à l'essentiel sans être trop formel. Tu peux utiliser le tutoiement et un ton fun.";
    } else {
      systemPrompt = "Tu es un assistant expert. Fais un résumé clair, très formel, structuré et professionnel.";
    }

    userPrompt = `Fais un résumé clair, structuré et concis, en suivant ton rôle attribué. Commence le texte par la phrase "je suis en mode" suivie par l'adjectif de ton mode (décontracté ou expert)`

  } else {
    if (mode === "Détente") {
      systemPrompt = "You're a relaxed and friendly assistant. Keep your summary lighthearted, fun, and concise without being overly formal. You can use informal language and a lighthearted tone.";
    } else {
      systemPrompt = "You are an expert assistant. Write a clear, very formal, structured and professional summary.";
    }

    userPrompt = `Write a clear, structured, and concise summary, following your assigned role. Begin the text with the phrase "I'm in mode" followed by an adjective describing your mode (casual or expert).`

  }
  

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt + `:\n\n${text}` }
    ],
    temperature: 0.2
  });

  return response.choices[0].message.content.trim();
};
