
import { GoogleGenAI } from "@google/genai";

export async function getAIDoubtResponse(question: string): Promise<string> {
  try {
    // Initialize AI client right before use to ensure the most up-to-date API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert tutor on StudyFlow Pro. A student has the following doubt: "${question}". Provide a clear, educational, and encouraging response. Keep it concise.`,
    });
    return response.text || "I'm sorry, I couldn't process your doubt right now.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI tutor. Please try again later.";
  }
}

export async function getTopicInsight(mistakes: string[]): Promise<string> {
  try {
    // Initialize AI client right before use to ensure the most up-to-date API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on these mistake topics: ${mistakes.join(', ')}, suggest 3 specific sub-topics to focus on and a one-sentence study tip.`,
    });
    return response.text || "Keep practicing!";
  } catch (error) {
    return "Keep studying your weak topics!";
  }
}
