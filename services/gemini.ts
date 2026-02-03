
import { GoogleGenAI, Type, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = (name: string, grade: string) => `You are EVA, a magical, bubbly guide for 5-year-old ${name}.
Current School Grade: ${grade} (South African Curriculum - CAPS).
Persona: Friendly, articulate female voice (similar to Microsoft Zira style).
Language: ALWAYS use South African English (colour, maths). 
Lingo: Enthusiastic and encouraging ("Awesome", "Terrific").
Spelling: South African.
Faith: ${name} is a born-again believer. Use terminology like "Wonderful", "Academy", "Surprise". Avoid "Spells" or "Casting".`;

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
  async getChatResponse(message: string, childName: string, grade: string, context?: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: context ? `Context: ${context}\n${childName} says: ${message}` : message,
        config: { 
          systemInstruction: SYSTEM_INSTRUCTION(childName, grade),
          temperature: 0.7,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text;
    });
  },

  async generateLesson(subject: string, category: string, childName: string, grade: string) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Academy lesson for 5yo ${childName} in ${grade}: "${subject}" (${category}). 3 steps, 1 challenge. Ensure it aligns with SA CAPS standards for ${grade}. Use emojis. For visualHints, use short text or single emojis that describe the concept visually.`,
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
          systemInstruction: `You are Mermaid EVA. Brief, joyful lessons for ${childName} (${grade}) in South Africa.`,
          thinkingConfig: { thinkingBudget: 0 }
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
        contents: `Task for ${childName} (${grade}) from prompt: "${prompt}". Assign a South African CAPS category and points. Defaults: 100 points, timeSlot 08:30.`,
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
          systemInstruction: `You are Mermaid EVA. Output a CAPS-aligned task for ${childName} (${grade}).`,
          thinkingConfig: { thinkingBudget: 0 }
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
        contents: `Create EXACTLY 7 tasks for ${day} for ${childName} (5yo, ${grade}).
        
        KNOWLEDGE FROM PREVIOUS REPORTS: ${reportContext}
        
        CRITICAL NOVELTY RULE: Do NOT repeat anything from: [${history.join(', ')}].
        
        MANDATORY TASKS:
        1. Word of the Day (Advanced vocabulary focus)
        2. Letter of the Day (Phonics focus)
        3. Number of the Day (Counting/Maths focus)
        PLUS 4 more tasks from South African CAPS Foundation Phase standards for ${grade}.
        DISTRIBUTE TIMES across the day.`,
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
          systemInstruction: `Expert South African Foundation Phase educator for ${grade}. Never repeat yourself. Use the provided growth reports to identify weak areas or mastered concepts.`,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateWeeklyCurriculum(history: string[] = [], childName: string, grade: string, reportContext: string = "") {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Full week South African CAPS curriculum (Mon-Fri) for ${childName} (${grade}). 
        
        KNOWLEDGE FROM PREVIOUS REPORTS: ${reportContext}
        
        CRITICAL NOVELTY RULE: Do NOT repeat anything from: [${history.join(', ')}].
        
        RULES:
        1. EXACTLY 3 tasks per day.
        2. Content must align with ${grade} South African standards.
        3. Subjects: Literacy, Numeracy, Life Skills, Afrikaans, isiZulu, Bible Study. 
        4. Use South African terminology.`,
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
          systemInstruction: `Expert South African Foundation Phase educator. Use the Growth Report context to plan for ${grade} effectively.`,
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
