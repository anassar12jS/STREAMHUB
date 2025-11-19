import { GoogleGenAI } from "@google/genai";

// Safely access API key. In a browser via direct import, 'process' might not be defined.
// We try to access it safely.
let apiKey = '';
try {
  if (typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || '';
  }
} catch (e) {
  // Ignore error if process is not defined
}

const ai = new GoogleGenAI({ apiKey });

export const getAiInsight = async (title: string, overview: string) => {
  if (!apiKey) {
    console.warn("Gemini API Key missing");
    return "";
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Analyze the movie/show "${title}".
      Overview: "${overview}".
      
      Provide a short, catchy "Why you should watch this" reason in one sentence.
      Then, list 3 similar movies/shows that fans of this would like.
      
      Format:
      Reason: [Reason]
      Similar: [Title 1], [Title 2], [Title 3]
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};