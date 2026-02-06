
import { GoogleGenAI, Type, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = (name: string, grade: string, context: string = "") => `You are EVA, a magical, bubbly guide for 5-year-old ${name}.
Current School Grade: ${grade} (South African Curriculum - CAPS).
Persona: Friendly, articulate female voice.
Language: ALWAYS use South African English (colour, maths). 
Lingo: Enthusiastic and encouraging.
Faith: ${name} is a born-again believer. Use terminology like "Wonderful", "Academy", "Surprise", "Secret". 
STRICT INSTRUCTION: Never use words like "Spells", "Casting", "Hexes", "Witchcraft", or "Wizards". 
GROWTH CONTEXT: ${context}
INSTRUCTION: Check the Growth Context to see what ${name} has already mastered. 
1. If she has mastered a topic, do NOT repeat it unless asked for a "Recap".
2. If she is struggling, prioritize "Recap" and "Reinforcement" for that topic.
3. If it's a new milestone from the report, create a "New Discovery" lesson.`;

async function callWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMsg = error?.message || "";
      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('quota')) {
        throw new Error("QUOTA_EXCEEDED");
      }
      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const gemini = {
  async getChatResponse(message: string, childName: string, grade: string, context?: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', // Switched to Flash to resolve quota issues
        contents: context ? `Context: ${context}\n${childName} says: ${message}` : message,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION(childName, grade, context),
          temperature: 0.7
        }
      });
      return response.text;
    });
  },

  async generateLesson(subject: string, category: string, childName: string, grade: string, context: string = "") {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Academy lesson for 5yo ${childName} in ${grade}: "${subject}" (${category}). 
        Use the Growth Context to decide if this should be a 'Recap' or 'New Discovery'. 
        3 steps, 1 challenge. Each step MUST have a visualHint (one emoji).`,
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
              },
              youtubeUrl: { type: Type.STRING }
            },
            required: ["subject", "parts", "bigGirlChallenge", "youtubeUrl"]
          },
          systemInstruction: SYSTEM_INSTRUCTION(childName, grade, context)
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateLessonFromPrompt(prompt: string, childName: string, grade: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Task for ${childName} (${grade}) from prompt: "${prompt}". Assign a CAPS category. Default 100 pts.`,
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
          systemInstruction: `You are Mermaid EVA. Output a CAPS task for an Academy.`
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateDailyCurriculum(day: string, history: string[] = [], childName: string, grade: string, reportContext: string = "") {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Create 7 Academy tasks for ${day} for ${childName} (${grade}). Report Context: ${reportContext}. Avoid repetition of mastered skills found in the report. No repeat of these specific session titles: [${history.join(', ')}].`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                category: { type: Type.STRING },
                points: { type: Type.NUMBER },
                timeSlot: { type: Type.STRING }
              },
              required: ["title", "category", "points", "timeSlot"]
            }
          },
          systemInstruction: SYSTEM_INSTRUCTION(childName, grade, reportContext)
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateWeeklyCurriculum(history: string[] = [], childName: string, grade: string, reportContext: string = "") {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Full week CAPS curriculum for ${childName} Academy (${grade}). 3 tasks per day. Report Context: ${reportContext}. Focus on report goals. No repeat of titles: [${history.join(', ')}].`,
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
          systemInstruction: SYSTEM_INSTRUCTION(childName, grade, reportContext)
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
          systemInstruction: "Joyful language learning helper."
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
          systemInstruction: "You are EVA. Provide a fun Academy discovery word."
        }
      });
      return JSON.parse(response.text);
    });
  }
};
