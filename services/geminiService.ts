import { GoogleGenAI } from "@google/genai";

// Initialize GenAI Client
// NOTE: In a real app, process.env.API_KEY is handled by the build system.
// We assume it is available.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getAiInsight = async (title: string, overview: string) => {
  if (!apiKey) return "AI Config Missing: Please add API_KEY to environment.";

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
    return "AI is currently sleeping. Try again later.";
  }
};
