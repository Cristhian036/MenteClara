import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

// Interfaz que define los datos requeridos del pendiente para generar consejos
export interface SuggestionRequest {
  title: string;
  category?: string;
  stressLevel?: string;
  stressLabel?: string;
  dueDate?: string;
}

/**
 * Función principal para generar consejos de paz y micro-pasos usando la IA de Gemini.
 * Se conecta con la API de Google Gemini y devuelve una estructura de datos JSON bien formateada.
 */
export async function generateStartSuggestions(data: SuggestionRequest) {
  const { title, category, stressLevel, stressLabel, dueDate } = data;
  if (!title) {
    throw new Error('El título del pendiente es requerido.');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isPlaceholder = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "";

  const getFallback = () => ({
    introduction: `Veo que quieres avanzar en "${title}". No te presiones, a veces dar el primer micro-paso es lo único necesario.`,
    steps: [
      "Pon un cronómetro de 2 minutos.",
      "Escribe garabatos flojos y sin estructura.",
      "Felicítate solo por sentarte hoy."
    ],
    mantra: "La acción precede a la motivación.",
    studyResources: [
      {
        type: "Búsqueda instructiva",
        title: "Técnica Pomodoro de Alivio",
        urlOrQuery: "procrastinar pomodoro de micro pasos",
        whyHelpful: "Para desactivar temporalmente el rechazo de tu cerebro a empezar."
      },
      {
        type: "YouTube Search",
        title: "Cómo vencer la procrastinación Alike",
        urlOrQuery: "procrastinar micro pasos sencillos",
        whyHelpful: "Un video animado de 3 minutos sobre por qué nos cuesta tanto empezar."
      }
    ]
  });

  if (isPlaceholder) {
    return getFallback();
  }

  try {
    // Inicialización del SDK de Google Gemini con la clave de API del servidor
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Prompt con ingeniería de instrucciones (Prompt Engineering) para guiar el comportamiento empático de la IA
    const prompt = `El usuario es un estudiante universitario estresado o abrumado. Quiere comenzar con este pendiente específico:
- Título: "${title}"
- Categoría: "${category || 'General'}"
- Nivel de Carga Mental: "${stressLevel || 'medium'}" (${stressLabel || 'Moderado'})
- Fecha de entrega: "${dueDate || 'No especificada'}"

REGLAS CRÍTICAS DE COMPORTAMIENTO:
1. ABSOLUTAMENTE PROHIBIDO: No resuelvas, programes, escribas, redactes ni realices el trabajo intelectual o académico por el estudiante. No des respuestas, códigos completos, fórmulas ni ensayos de la materia.
2. CAMBIO DE ENFOQUE: Tu único objetivo es motivarlo a romper la inercia de inicio ("la parálisis por análisis") a través de micro-acciones iniciales adaptadas a este pendiente específico.
3. PASOS ULTRA CORTOS Y ACCIONABLES: Cada uno de los 3 pasos de la lista 'steps' debe ser extremadamente corto, concreto y conciso (máximo 10 palabras por paso). Deben ser ridículamente fáciles de completar en menos de 1 minuto sin tensión mental.
4. DEADLINE SENSIBLE: Si la fecha de entrega "${dueDate}" está sumamente cercana (ej. Hoy o mañana), adapta la introducción para calmar la ansiedad. Nada de regaños ni alarmismos.
5. RECURSOS DE ESTUDIO COMPLEMENTARIOS ('studyResources'): Sugiere exactamente 2 recursos que faciliten su aprendizaje sobre la materia/tema de "${title}" de forma amigable sin hacerle el proyecto. Puede ser un libro clásico fácil de entender, un sitio web explicativo popular (como Wikipedia, Khan Academy, MDN, Stanford, etc.), o un término/canal exacto de YouTube para ver explicaciones visuales.

Ejemplos de cómo debes personalizar según el pendiente:
- Si es "Estudiar Cálculo" con entrega inmediata: "Respira hondo antes de mirar la pantalla. Solo abre el cuaderno."
- Si es "Programar Base de Datos": "Abre tu editor, crea un archivo vacío e introduce un comentario amistoso."

Genera sugerencias en tono excesivamente compasivo, de apoyo, con humor empático y cercano (español de Latinoamérica).`;

    // Solicitud a la IA utilizando el modelo gemini-flash-latest y definiendo un esquema JSON estricto
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        // Forzamos al modelo a devolver exclusivamente un objeto JSON estructurado
        responseMimeType: 'application/json',
        // Definimos el esquema de datos esperado para evitar inconsistencias en el frontend
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            introduction: {
              type: Type.STRING,
              description: "Mensaje corto de empatía y validación al estudiante respecto a su agobio, con tono amigable y cercano.",
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Una lista de exactamente 3 micro-pasos de inicio. Máximo 10 palabras por concepto.",
            },
            mantra: {
              type: Type.STRING,
              description: "Un mantra de alivio corto (máximo 7 palabras).",
            },
            studyResources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "Tipo de recurso, ej: 'Libro recomendado', 'Sitio web informativo', 'Canal o búsqueda de YouTube'" },
                  title: { type: Type.STRING, description: "Nombre específico del libro, portal o de la recomendación" },
                  urlOrQuery: { type: Type.STRING, description: "Término exacto para buscarlo en Google/YouTube o la URL oficial" },
                  whyHelpful: { type: Type.STRING, description: "Por qué este recurso ayuda a dominar el concepto de forma clara y sin estrés (breve)." }
                },
                required: ["type", "title", "urlOrQuery", "whyHelpful"]
              },
              description: "Exactamente 2 recursos de estudio complementarios sencillos and motivadores que de verdad sirvan para ese pendiente."
            }
          },
          required: ["introduction", "steps", "mantra", "studyResources"]
        }
      }
    });

    // Extraer el texto de la respuesta, limpiarlo y convertirlo en un objeto de JavaScript
    const jsonText = aiResponse.text?.trim() || '{}';
    return JSON.parse(jsonText);
  } catch (error: any) {
    console.error('Error generating suggestions with Gemini API, using fallback suggestions:', error);
    return getFallback();
  }
}
