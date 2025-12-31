
import React, { useState, useRef } from 'react';

const COLORS = ['bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-amber-400'];

export default function FidgetGame({ onComplete, onCancel, parentSound }: { onComplete: (reward: number, time: number, errors: number) => void, onCancel: () => void, parentSound?: string }) {
  const [pops, setPops] = useState(new Array(25).fill(false));
  const [bubbleColors] = useState(() => pops.map(() => COLORS[Math.floor(Math.random() * COLORS.length)]));
  const [startTime] = useState(Date.now());
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  
  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const handlePop = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3');
    audio.play().catch(() => {});

    if (pops[idx]) return;
    const newPops = [...pops];
    newPops[idx] = true;
    setPops(newPops);
    
    if (newPops.every(p => p)) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      setTimeout(() => onComplete(10, timeTaken, 0), 1500);
    }
  };

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-pink-100 flex flex-col items-center p-6 animate-pop"
    >
      <div className="w-full max-w-lg flex justify-between items-center mb-10">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-pink-500 px-8 py-3 rounded-full font-black border-4 border-pink-100 shadow-lg active:scale-95 transition-all uppercase text-xs">Back to School 🏫</button>
        <h2 className="text-pink-600 font-black text-2xl uppercase pointer-events-none">Magic Pop-It</h2>
      </div>

      <div className="bg-white p-8 rounded-[4rem] border-8 border-white shadow-2xl grid grid-cols-5 gap-4">
        {pops.map((p, i) => (
          <button
            key={i}
            onClick={(e) => handlePop(i, e)}
            className={`w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 transform border-4 border-white ${
              p ? 'bg-gray-100 scale-90 shadow-inner' : `${bubbleColors[i]} shadow-lg hover:scale-105 active:scale-125`
            }`}
          >
            {!p && <div className="w-4 h-4 bg-white/30 rounded-full ml-2 mt-1 blur-[1px]" />}
          </button>
        ))}
      </div>
      
      <p className="mt-10 font-black text-pink-400 uppercase tracking-widest text-xl animate-pulse pointer-events-none">
        {pops.filter(p => p).length} / 25 POPPED!
      </p>
    </div>
  );
}
