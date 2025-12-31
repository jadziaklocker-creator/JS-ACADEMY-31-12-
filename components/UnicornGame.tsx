
import React, { useState, useEffect, useCallback, useRef } from 'react';

type GameMode = 'simple' | 'skip2' | 'skip5' | 'skip10' | 'add';

interface Unicorn {
  id: number;
  x: number;
  y: number;
  value: number;
  clicked: boolean;
}

const UnicornGame = ({ onComplete, onCancel, speak, parentSound }: { onComplete: (reward: number, time: number, errors: number) => void; onCancel: () => void; speak: (t: string) => void; parentSound?: string }) => {
  const [mode, setMode] = useState<GameMode>('simple');
  const [targetValue, setTargetValue] = useState(0);
  const [unicorns, setUnicorns] = useState<Unicorn[]>([]);
  const [gameState, setGameState] = useState<'counting' | 'won'>('counting');
  const [prompt, setPrompt] = useState('');
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [startTime] = useState(Date.now());
  const [hintId, setHintId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startNewLevel = useCallback((selectedMode: GameMode) => {
    setGameState('counting');
    setMode(selectedMode);
    setIncorrectCount(0);
    setHintId(null);
    let numUnicorns = 10;
    let target = 0;
    let newPrompt = '';

    if (selectedMode === 'simple') {
      target = Math.floor(Math.random() * 15) + 5; 
      numUnicorns = target;
      newPrompt = `Find all ${target} unicorns in order!`;
    } else if (selectedMode === 'skip2') {
      target = 20;
      numUnicorns = 10;
      newPrompt = "Count in 2s! 2... 4... 6...";
    } else if (selectedMode === 'skip5') {
      target = 50;
      numUnicorns = 10;
      newPrompt = "Count in 5s! 5... 10... 15...";
    } else if (selectedMode === 'skip10') {
      target = 100;
      numUnicorns = 10;
      newPrompt = "Count in 10s! 10... 20... 30...";
    } else if (selectedMode === 'add') {
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      target = a + b;
      numUnicorns = target;
      newPrompt = `What is ${a} + ${b}? Total: ${target}`;
    }

    setTargetValue(target);
    setPrompt(newPrompt);
    speak(newPrompt);

    const cells = [];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 6; c++) {
        cells.push({ r, c });
      }
    }
    
    const selectedCells = cells.sort(() => Math.random() - 0.5).slice(0, numUnicorns);

    const newUnicorns = selectedCells.map((cell, i) => {
      let val = i + 1;
      if (selectedMode === 'skip2') val = (i + 1) * 2;
      if (selectedMode === 'skip5') val = (i + 1) * 5;
      if (selectedMode === 'skip10') val = (i + 1) * 10;
      return { 
        id: i, 
        x: (cell.c * 16.6) + 8.3, 
        y: (cell.r * 16.6) + 8.3, 
        value: val, 
        clicked: false 
      };
    });
    setUnicorns(newUnicorns.sort((a, b) => a.value - b.value));
  }, [speak]);

  useEffect(() => { 
    startNewLevel('simple'); 
  }, []);

  const playParentVoice = () => {
    if (parentSound && (!audioRef.current || audioRef.current.ended)) {
      audioRef.current = new Audio(parentSound);
      audioRef.current.play().catch(() => {});
    }
  };

  const handleUnicornClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    playParentVoice();

    if (gameState !== 'counting') return;
    const clickedCount = unicorns.filter(u => u.clicked).length;
    const targetUnicorn = unicorns.find(u => u.id === id);
    if (!targetUnicorn || targetUnicorn.clicked) return;

    const nextValue = mode === 'skip2' ? (clickedCount + 1) * 2 :
      mode === 'skip5' ? (clickedCount + 1) * 5 :
        mode === 'skip10' ? (clickedCount + 1) * 10 :
          (clickedCount + 1);

    if (targetUnicorn.value !== nextValue) {
      setIncorrectCount(prev => prev + 1);
      setTotalErrors(prev => prev + 1);
      
      if (incorrectCount + 1 >= 2) {
        const correctUni = unicorns.find(u => u.value === nextValue && !u.clicked);
        if (correctUni) setHintId(correctUni.id);
      }
      
      speak(`Not that one! Find number ${nextValue}!`);
      new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(() => {});
      return;
    }

    setUnicorns(prev => prev.map(u => u.id === id ? { ...u, clicked: true } : u));
    setIncorrectCount(0);
    setHintId(null);
    speak(targetUnicorn.value.toString());
    new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3').play().catch(() => {});
  };

  useEffect(() => {
    if (unicorns.length > 0 && unicorns.every(u => u.clicked)) {
      setGameState('won');
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      speak(`Splendid! You found all ${targetValue} unicorns!`);
      setTimeout(() => onComplete(30, timeTaken, totalErrors), 3000);
    }
  }, [unicorns, targetValue, onComplete, speak, startTime, totalErrors]);

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-pink-50 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 z-[2100]">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-pink-500 px-8 py-3 rounded-full font-black border-4 border-pink-100 shadow-lg active:scale-95 transition-all">Back to School 🏫</button>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            {(['simple', 'skip2', 'skip5', 'skip10', 'add'] as GameMode[]).map(m => (
              <button 
                key={m} 
                onClick={(e) => { e.stopPropagation(); startNewLevel(m); }} 
                className={`px-4 py-2 rounded-full font-black text-[10px] uppercase border-2 ${mode === m ? 'bg-pink-500 text-white border-white' : 'bg-white text-pink-300 border-pink-100'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md px-12 py-5 rounded-[3rem] border-4 border-pink-200 shadow-2xl mb-4 z-[2100] pointer-events-none">
        <h2 className="text-pink-600 font-black text-2xl uppercase tracking-tighter text-center">{prompt}</h2>
      </div>

      <div className="flex-1 w-full bg-white/50 backdrop-blur-sm rounded-[5rem] border-[12px] border-pink-100 shadow-inner relative overflow-hidden z-[2050]">
        {unicorns.map((u) => (
          <div
            key={u.id}
            onClick={(e) => handleUnicornClick(u.id, e)}
            style={{ left: `${u.x}%`, top: `${u.y}%` }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ${u.clicked ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 hover:scale-105 active:scale-90'} ${hintId === u.id ? 'z-[2200]' : ''}`}
          >
            <div className={`flex flex-col items-center relative group`}>
              <div className={`bg-white text-pink-600 px-5 py-2 rounded-2xl font-black text-4xl border-4 shadow-[0_5px_0_#9d174d] z-20 relative transition-transform ${hintId === u.id ? 'border-yellow-400 bg-yellow-50 shadow-[0_8px_0_#b45309] scale-110' : 'border-pink-400'}`}>
                {u.value}
              </div>
              <div className={`text-5xl filter drop-shadow-md -mt-4 z-10 ${hintId === u.id ? 'scale-110' : ''}`}>🦄</div>
            </div>
          </div>
        ))}

        {gameState === 'won' && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-[2300] animate-pop">
            <div className="text-[12rem] mb-10 bouncy">🌈</div>
            <h2 className="text-6xl font-black text-pink-600 uppercase tracking-tighter">Magic Counting Master!</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnicornGame;
