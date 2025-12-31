import { GoogleGenAI } from "@google/genai";

// Accessing Vite environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

console.log("[GeminiService] API Key detection:", apiKey ? "Detected" : "Not Found");

const getAI = () => {
  if (!apiKey) {
    console.error("[GeminiService] VITE_GEMINI_API_KEY is missing!");
    throw new Error("API Key not found. Please add VITE_GEMINI_API_KEY to your .env.local");
  }
  return new GoogleGenAI({ apiKey, apiVersion: 'v1' });
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // If it's a 429 (Rate Limit), wait and retry
      if (error.message?.includes("429") || error.status === 429) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`[GeminiService] Rate limit hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await delay(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}



/**
 * Describe a book photo (Vision task)
 */
export const editBookPhoto = async (base64Image: string, editPrompt: string) => {
  const ai = getAI();

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: `Describe this book and answer this request: ${editPrompt}` }
        ]
      }]
    }));

    // Validating response.text exists before returning
    console.log("[GeminiService] Image analysis success:", !!response.text);
    return base64Image;
  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    return null;
  }
};

