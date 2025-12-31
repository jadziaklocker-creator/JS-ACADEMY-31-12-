
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gemini } from '../services/gemini';

interface WordData {
  word: string;
  emoji: string;
  definition: string;
  category: string;
}

const FALLBACK_WORD: WordData = {
  word: "Extraordinary",
  emoji: "✨",
  definition: "Something that is very special and much better than what is normal!",
  category: "Magic"
};

export default function NewWordsGame({ onComplete, onCancel, speak, parentSound }: { onComplete: (r: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string }) {
  const [currentWord, setCurrentWord] = useState<WordData | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showDefinition, setShowDefinition] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [wordsLearned, setWordsLearned] = useState(0);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const fetchNextWord = useCallback(async () => {
    setIsThinking(true);
    setShowDefinition(false);
    try {
      const data = await gemini.generateSingleWord(history);
      setCurrentWord(data);
      setHistory(prev => [...prev.slice(-10), data.word]);
      speak(`A new magic word has arrived! Look!`);
    } catch (e) {
      console.warn("Falling back to standard word...");
      setCurrentWord(FALLBACK_WORD);
    } finally {
      setIsThinking(false);
    }
  }, [history, speak]);

  useEffect(() => {
    fetchNextWord();
  }, []);

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const handleWordClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    if (!currentWord || showDefinition) return;
    
    setShowDefinition(true);
    speak(`${currentWord.word}. It means: ${currentWord.definition}`);
    new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3').play().catch(() => {});
    
    // Auto-close after reading meaning
    setTimeout(() => {
        onComplete(5); // Award points and close
    }, 5000);
  };

  const handleLearnMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWordsLearned(prev => prev + 1);
    fetchNextWord();
  };

  const handleExit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel();
  };

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-indigo-50 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-lg flex justify-between items-center mb-10 z-[2100]">
        <button 
          onClick={handleExit} 
          className="bg-white text-indigo-500 px-10 py-4 rounded-full font-black border-4 border-indigo-100 shadow-xl active:scale-95 transition-all flex items-center gap-2 cursor-pointer pointer-events-auto"
        >
          <span>Back 🏫</span>
        </button>
        <div className="text-right">
            <h2 className="text-indigo-600 font-black text-2xl uppercase tracking-tighter leading-none">Magic Words</h2>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mt-1">Words Learned: {wordsLearned}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-2xl relative">
        
        {isThinking ? (
          <div className="flex flex-col items-center gap-6">
             <div className="w-48 h-48 rounded-full border-[10px] border-white bg-indigo-200 animate-pulse flex items-center justify-center">
                <span className="text-6xl animate-bounce">🫧</span>
             </div>
             <p className="text-2xl font-black text-indigo-400 uppercase tracking-widest animate-pulse">Finding a word...</p>
          </div>
        ) : currentWord && (
          <div className="w-full flex flex-col items-center gap-8">
            <div 
              onClick={handleWordClick}
              className={`w-full p-12 bg-white rounded-[5rem] border-[15px] border-white shadow-2xl flex flex-col items-center gap-6 cursor-pointer transition-all duration-700 ${showDefinition ? 'scale-90 border-indigo-100' : 'hover:scale-105 active:scale-95'}`}
            >
              <div className="text-[9rem] drop-shadow-xl bouncy">{currentWord.emoji}</div>
              <h3 className="text-6xl md:text-7xl font-black text-indigo-600 uppercase tracking-tighter text-center leading-none">
                {currentWord.word}
              </h3>
              {!showDefinition && (
                <div className="bg-indigo-500 text-white px-8 py-3 rounded-full font-black uppercase text-sm animate-pulse mt-4">
                  Tap to see the meaning! ✨
                </div>
              )}
            </div>

            <div className={`transition-all duration-1000 w-full ${showDefinition ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-20 scale-50 pointer-events-none'}`}>
               <div className="bg-white p-10 rounded-[4rem] border-[10px] border-indigo-100 shadow-2xl text-center relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-2 rounded-full font-black uppercase text-xs">
                    Magic Meaning
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-indigo-900 leading-tight">
                    {currentWord.definition}
                  </p>
                  <p className="mt-4 text-xs font-bold text-indigo-300 uppercase">Closing in 5 seconds...</p>
               </div>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-indigo-200 font-black uppercase tracking-[0.2em] text-center pointer-events-none text-xs">
        EVA is teaching you big girl words, Jadzia!
      </p>
    </div>
  );
}
