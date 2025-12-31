import { GoogleGenAI, Type, Modality } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are EVA, a magical, bubbly Mermaid Teacher. 
You are a homeschooling guide for a 5-year-old girl named Jadzia.
Persona: You have a clear, bubbly, and extremely kind American accent. You are nurturing, enthusiastic, and warm.
Spelling: ALWAYS use South African English spelling in written output (e.g., 'colour', 'maths', 'centre', 'organise', 'practise') as Jadzia lives in South Africa.
Lingo: Use cheerful, friendly American English words like "Awesome", "Great job", "Terrific", "Amazing", and "Super". 
Focus on praise and encouragement. Keep responses short and simple for a 5-year-old.`;

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
        contents: `Create a magical, interactive lesson for 5-year-old Jadzia about "${subject}" (Category: ${category}).`,
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
                  required: ["title", "content", "action"]
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
          systemInstruction: "You are Mermaid EVA. You create joyful lessons using South African English spelling. Thinking disabled for speed.",
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
        contents: `Create a single magic lesson task based on this parent idea: "${prompt}".`,
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
          systemInstruction: "You are Mermaid EVA. Output a concise lesson task object for a 5-year-old in South Africa.",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateWeeklyCurriculum() {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: "Generate a full week (Monday-Friday) of South African CAPS Grade R/Grade 1 curriculum lessons for Jadzia. Requirements: 9 lessons per day, 20 minutes each (3 hours total daily). Use categories: Literacy, Numeracy, Life Skills, Afrikaans, isiZulu, Bible Study. Ensure spelling is South African English.",
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
          systemInstruction: "You are an expert South African Foundation Phase educator. Create a balanced, joyful 5-day curriculum (45 lessons total).",
          thinkingConfig: { thinkingBudget: 24576 }
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

  async generateSingleWord(excludeWords: string[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate ONE new English word for a 5-year-old. Exclude: ${excludeWords.join(', ')}`,
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
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return JSON.parse(response.text);
    });
  },

  async generateVocabWord(excludeWords: string[]) {
    return callWithRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate ONE new simple word in either Afrikaans or isiZulu suitable for a 5-year-old. Include English translation, an emoji, and a Tailwind background color class. Exclude these existing words: ${excludeWords.join(', ')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              target: { type: Type.STRING, description: "The word in Afrikaans or isiZulu" },
              english: { type: Type.STRING, description: "The English translation" },
              lang: { type: Type.STRING, description: "The language name (Afrikaans or isiZulu)" },
              icon: { type: Type.STRING, description: "A matching emoji" },
              color: { type: Type.STRING, description: "Tailwind background color class e.g. bg-blue-400" }
            },
            required: ["target", "english", "lang", "icon", "color"]
          },
          systemInstruction: "You are Mermaid EVA. You help children learn languages in South Africa. Use joyful tones and simple words. Thinking disabled.",
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return JSON.parse(response.text);
    });
  }
};