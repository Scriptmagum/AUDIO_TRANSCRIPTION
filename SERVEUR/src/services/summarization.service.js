import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const languagePrompts = {
  fr: {
    system: "Tu es un expert en résumé de réunions professionnelles. Tu crées des résumés structurés, clairs et utiles.",
    user: `Fais un résumé PROFESSIONNEL de cette transcription de réunion en suivant cette structure exacte:

**RÉSUMÉ EXÉCUTIF**
Un paragraphe synthétique des points clés

**PARTICIPANTS**
Liste les participants identifiés (ignore les lettres comme A, B, C)

**POINTS CLÉS DISCUTÉS**
- Liste les sujets/thèmes principaux abordés
- Sois concis et factuel

**DÉCISIONS PRISES**
- Liste les décisions ou conclusions importantes

**ACTIONS À FAIRE**
- Liste les actions avec responsables si identifiés
- Sinon marque "À assigner"

**NOTES IMPORTANTES**
- Ajoute toute information pertinente non couverte

IMPORTANT: 
- Ne pas inclure les lettres (A, B, C) comme noms
- Ignorer les éléments non-pertinents
- Sois concis et professionnel
- Utilise exactement le format ci-dessus

Voici la transcription à résumer:`
  },
  en: {
    system: "You are an expert in professional meeting summarization. You create structured, clear and useful summaries.",
    user: `Create a PROFESSIONAL summary of this meeting transcript following this exact structure:

**EXECUTIVE SUMMARY**
One paragraph synthesizing the key points

**PARTICIPANTS**
List identified participants (ignore letters like A, B, C)

**KEY TOPICS DISCUSSED**
- List main subjects/themes covered
- Be concise and factual

**DECISIONS MADE**
- List important decisions or conclusions

**ACTION ITEMS**
- List actions with assigned owners if identified
- Otherwise mark "To be assigned"

**IMPORTANT NOTES**
- Add any relevant information not covered above

IMPORTANT:
- Do not include letters (A, B, C) as names
- Ignore non-relevant elements
- Be concise and professional
- Use exactly the format above

Here is the transcript to summarize:`
  },
  de: {
    system: "Sie sind ein Experte für die Zusammenfassung von Geschäftstreffen. Sie erstellen strukturierte, klare und nützliche Zusammenfassungen.",
    user: `Erstellen Sie eine PROFESSIONELLE Zusammenfassung dieses Meeting-Transkripts nach dieser genauen Struktur:

**ZUSAMMENFASSUNG FÜR DIE GESCHÄFTSLEITUNG**
Ein Absatz, der die Hauptpunkte zusammenfasst

**TEILNEHMER**
Identifizieren Sie die Teilnehmer (ignorieren Sie Buchstaben wie A, B, C)

**BESPROCHENE HAUPTTHEMEN**
- Aufzählung der wichtigsten besprochenen Themen/Themen
- Seien Sie prägnant und sachlich

**GETROFFENE ENTSCHEIDUNGEN**
- Aufzählung wichtiger Entscheidungen oder Schlussfolgerungen

**MASSNAHMENPUNKTE**
- Aufzählung von Maßnahmen mit Verantwortlichen, falls identifiziert
- Andernfalls markieren "Zuzuweisen"

**WICHTIGE NOTIZEN**
- Alle relevanten Informationen, die oben nicht behandelt werden

WICHTIG:
- Buchstaben (A, B, C) nicht als Namen verwenden
- Nicht relevante Elemente ignorieren
- Seien Sie prägnant und professionell
- Verwenden Sie exakt das obige Format

Hier ist das zu zusammenfassende Transkript:`
  },
  es: {
    system: "Eres un experto en resumir reuniones profesionales. Creas resúmenes estructurados, claros y útiles.",
    user: `Crea un resumen PROFESIONAL de esta transcripción de reunión siguiendo esta estructura exacta:

**RESUMEN EJECUTIVO**
Un párrafo que sintetiza los puntos clave

**PARTICIPANTES**
Enumera los participantes identificados (ignora letras como A, B, C)

**TEMAS CLAVE DISCUTIDOS**
- Enumera los temas/materias principales tratados
- Sé conciso y fáctico

**DECISIONES TOMADAS**
- Enumera decisiones o conclusiones importantes

**ELEMENTOS DE ACCIÓN**
- Enumera acciones con responsables asignados si se identifican
- Si no, marca "Por asignar"

**NOTAS IMPORTANTES**
- Agrega información relevante no cubierta

IMPORTANTE:
- No incluyas letras (A, B, C) como nombres
- Ignora elementos no relevantes
- Sé conciso y profesional
- Usa exactamente el formato anterior

Aquí está la transcripción a resumir:`
  }
};

/**
 * Summarize text in the specified language
 * @param {string} text - The text to summarize
 * @param {string} lang - Language code (fr, en, de, es). Defaults to 'fr' if not provided
 * @returns {Promise<string>} The summarized text
 */
export const summarizeText = async (text, lang = "fr") => {
  const prompts = languagePrompts[lang] || languagePrompts.fr;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompts.system },
      { role: "user", content: `${prompts.user}\n\n${text}` }
    ],
    temperature: 0.2
  });

  return response.choices[0].message.content.trim();
};
