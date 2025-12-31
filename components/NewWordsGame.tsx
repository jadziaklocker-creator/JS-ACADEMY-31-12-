
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gemini } from '../services/gemini';

interface WordData {
  word: string;
  emoji: string;
  definition: string;
  category: string;
}

const HISTORY_STORAGE_KEY = 'jadzia_learned_words_history_v2';

export default function NewWordsGame({ onComplete, onCancel, speak, parentSound }: { onComplete: (r: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string }) {
  const [currentWord, setCurrentWord] = useState<WordData | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [showDefinition, setShowDefinition] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const fetchNextWord = useCallback(async (currentHistory: string[]) => {
    setIsThinking(true);
    setShowDefinition(false);
    try {
      const data = await gemini.generateSingleWord(currentHistory);
      setCurrentWord(data);
      const newHistory = [...currentHistory, data.word];
      setHistory(newHistory);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      speak(`A new magic word has arrived! Look!`);
    } catch (e) {
      speak("The magic book is a bit shy right now. Let's try once more!");
      onCancel();
    } finally {
      setIsThinking(false);
    }
  }, [speak, onCancel]);

  // Guaranteed fetch on mount (game open)
  useEffect(() => {
    fetchNextWord(history);
  }, []);

  const handleWordClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord || showDefinition) return;
    setShowDefinition(true);
    speak(`${currentWord.word}. It means: ${currentWord.definition}`);
    
    // Auto-close after Jadzia has time to listen
    setTimeout(() => {
        onComplete(10);
    }, 6000);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-indigo-50 flex flex-col items-center p-6 animate-pop overflow-hidden">
      <div className="w-full max-w-lg flex justify-between items-center mb-10">
        <button onClick={onCancel} className="bg-white text-indigo-500 px-10 py-4 rounded-full font-black border-4 border-indigo-100 shadow-xl active:scale-95 transition-all text-xs">Back 🏫</button>
        <div className="text-right">
            <h2 className="text-indigo-600 font-black text-2xl uppercase">Magic Words</h2>
            <p className="text-[10px] font-black text-indigo-300 uppercase">Words Learned: {history.length}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-2xl relative">
        {isThinking ? (
          <div className="flex flex-col items-center gap-6">
             <div className="w-48 h-48 rounded-full border-[10px] border-white bg-indigo-200 animate-pulse flex items-center justify-center">
                <span className="text-6xl animate-bounce">🫧</span>
             </div>
             <p className="text-2xl font-black text-indigo-400 uppercase tracking-widest animate-pulse">Finding a brand new word...</p>
          </div>
        ) : currentWord && (
          <div className="w-full flex flex-col items-center gap-8">
            <div 
              onClick={handleWordClick}
              className={`w-full p-12 bg-white rounded-[5rem] border-[15px] border-white shadow-2xl flex flex-col items-center gap-6 cursor-pointer transition-all duration-700 ${showDefinition ? 'scale-90 border-indigo-100' : 'hover:scale-105 active:scale-95'}`}
            >
              <div className="text-[9rem] drop-shadow-xl animate-bounce-slow">{currentWord.emoji}</div>
              <h3 className="text-6xl md:text-7xl font-black text-indigo-600 uppercase text-center leading-none">
                {currentWord.word}
              </h3>
              {!showDefinition && (
                <div className="bg-indigo-500 text-white px-8 py-3 rounded-full font-black uppercase text-sm animate-pulse mt-4">
                  Tap for the magic meaning! ✨
                </div>
              )}
            </div>

            <div className={`transition-all duration-1000 w-full ${showDefinition ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-50 pointer-events-none'}`}>
               <div className="bg-white p-10 rounded-[4rem] border-[10px] border-indigo-100 shadow-2xl text-center relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-2 rounded-full font-black uppercase text-xs">Meaning</div>
                  <p className="text-2xl md:text-3xl font-black text-indigo-900 leading-tight">{currentWord.definition}</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
