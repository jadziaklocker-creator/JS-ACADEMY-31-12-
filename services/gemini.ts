
import { GoogleGenAI, Type, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are EVA, a magical, bubbly guide for 5-year-old Jadzia.
Persona: Friendly, articulate female voice (similar to Microsoft Zira style).
Language: ALWAYS use South African English (colour, maths). 
Lingo: Enthusiastic and encouraging ("Awesome", "Terrific").
Spelling: South African.
Faith: Jadzia is a born-again believer. Use terminology like "Wonderful", "Academy", "Surprise". Avoid "Spells" or "Casting".`;

async function callWithRetry(fn: () => Promise<any>, maxRetries = 2): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      if (error?.message?.includes('429')) throw error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const gemini = {
  async getChatResponse(message: string, context?: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: context ? `Context: ${context}\nJadzia says: ${message}` : message,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text;
    });
  },

  async generateLesson(subject: string, category: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Academy lesson for 5yo: "${subject}" (${category}). 3 steps, 1 challenge. South African spelling. Use emojis.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              parts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    action: { type: Type.STRING },
                    visualHint: { type: Type.STRING }
                  },
                  required: ["title", "content", "action", "visualHint"]
                }
              },
              bigGirlChallenge: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            required: ["subject", "parts", "bigGirlChallenge"]
          },
          systemInstruction: "You are Mermaid EVA. Brief, joyful lessons for a 5-year-old in South Africa.",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateLessonFromPrompt(prompt: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Task from prompt: "${prompt}". Assign a South African CAPS category and points. Use 100 points as default. Set timeSlot to 08:30.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              points: { type: Type.NUMBER },
              timeSlot: { type: Type.STRING }
            },
            required: ["title", "category", "points", "timeSlot"]
          },
          systemInstruction: "You are Mermaid EVA. Output a task object for a 5-year-old.",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateWeeklyCurriculum(alreadyCompleted: string[] = []) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Full week Grade R/1 CAPS curriculum (Mon-Fri). 
        CRITICAL RULES:
        1. EXACTLY 3 tasks per day at: 08:30, 13:00, 18:30.
        2. EXCLUDE these completed topics: ${alreadyCompleted.join(', ')}.
        3. Subjects: Literacy, Numeracy, Life Skills, Afrikaans, isiZulu, Bible Study. 
        4. South African terminology.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING },
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                points: { type: Type.NUMBER },
                timeSlot: { type: Type.STRING }
              },
              required: ["day", "title", "category", "points", "timeSlot"]
            }
          },
          systemInstruction: "Expert South African Foundation educator. Build non-repetitive schedules.",
          thinkingConfig: { thinkingBudget: 32768 }
        }
      });
      return JSON.parse(response.text);
    });
  },

  async textToSpeech(text: string): Promise<string> {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say cheerfully: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) throw new Error("No audio generated");
      return base64Audio;
    });
  },

  async generateVocabWord(excludeWords: string[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `One Afrikaans/isiZulu word for a 5-year-old. Exclude: ${excludeWords.join(', ')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              target: { type: Type.STRING },
              english: { type: Type.STRING },
              lang: { type: Type.STRING },
              icon: { type: Type.STRING },
              color: { type: Type.STRING }
            },
            required: ["target", "english", "lang", "icon", "color"]
          },
          systemInstruction: "Joyful language learning helper.",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateSingleWord(excludeWords: string[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `One English word for a 5-year-old. Exclude: ${excludeWords.join(', ')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              emoji: { type: Type.STRING },
              definition: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["word", "emoji", "definition", "category"]
          },
          systemInstruction: "You are EVA. Provide a fun word with SA spelling.",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return JSON.parse(response.text);
    });
  }
};
