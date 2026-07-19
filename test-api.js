import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Clave detectada:", apiKey ? `${apiKey.substring(0, 8)}...` : "Ninguna");

  try {
    const ai = new GoogleGenAI({ apiKey });
    console.log("Probando GoogleGenAI SDK con 'gemini-flash-latest'...");

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: 'Di OK si funciona.',
    });
    console.log("ÉXITO SDK:", response.text?.trim());
  } catch (error) {
    console.error("ERROR SDK:", error.message || error);
  }
}

test();
