import { GoogleGenAI } from "@google/genai";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
// We assume this variable is pre-configured, valid, and accessible in the execution context.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAiInsight = async (title: string, overview: string) => {
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