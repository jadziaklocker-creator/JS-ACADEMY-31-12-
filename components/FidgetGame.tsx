
import React, { useState, useRef, useEffect } from 'react';

const COLORS = ['bg-pink-400', 'bg-purple-400', 'bg-blue-400', 'bg-cyan-400', 'bg-emerald-400', 'bg-amber-400'];

export default function FidgetGame({ onComplete, onCancel, parentSound }: { onComplete: (reward: number, time: number, errors: number) => void, onCancel: () => void, parentSound?: string }) {
  const [pops, setPops] = useState(new Array(25).fill(false));
  const [bubbleColors] = useState(() => pops.map(() => COLORS[Math.floor(Math.random() * COLORS.length)]));
  const [isInverted, setIsInverted] = useState(false);
  const [startTime] = useState(Date.now());
  const [sessionPopCount, setSessionPopCount] = useState(0);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  
  const playPopSound = () => {
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3');
    audio.play().catch(() => {});
  };

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const handlePop = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playPopSound();
    playParentVoice();

    const newPops = [...pops];
    newPops[idx] = !newPops[idx];
    setPops(newPops);
    setSessionPopCount(prev => prev + 1);
  };

  useEffect(() => {
    if (pops.every(p => p === true)) {
      const timer = setTimeout(() => {
        setIsInverted(true);
        setPops(new Array(25).fill(false));
        new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3').play().catch(() => {});
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pops]);

  const handleFinish = () => {
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    onComplete(15, timeTaken, 0);
  };

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[10000] bg-gradient-to-br from-pink-100 via-white to-cyan-100 flex flex-col items-center justify-center p-8 animate-pop overflow-hidden"
    >
      {/* Magic Escape Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onCancel(); }} 
        className="absolute top-8 left-8 bg-white text-pink-500 w-16 h-16 rounded-full flex items-center justify-center border-4 border-pink-50 shadow-xl active:scale-90 transition-all text-2xl z-[10010]"
      >
        ❌
      </button>

      <div className="flex-1 w-full flex flex-col items-center justify-center gap-10">
        <div className="text-center space-y-2 mb-4 pointer-events-none">
          <h2 className="text-7xl font-black text-pink-600 uppercase tracking-tighter">Pop-it Fun! 🎈</h2>
          <p className="text-xl font-bold text-pink-300 italic">"Pop them all to flip it over!"</p>
        </div>

        <div className={`relative bg-white p-12 rounded-[5rem] border-[20px] border-white shadow-2xl transition-transform duration-700 ${isInverted ? 'rotate-180' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/5 rounded-[4rem] pointer-events-none z-10"></div>
          
          <div className="grid grid-cols-5 gap-6 relative z-0">
            {pops.map((p, i) => (
              <button
                key={i}
                onClick={(e) => handlePop(i, e)}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-full transition-all duration-300 transform border-8 border-white flex items-center justify-center overflow-hidden ${
                  p ? 'bg-gray-100 scale-90 shadow-inner' : `${bubbleColors[i]} shadow-[0_12px_0_rgba(0,0,0,0.1)] hover:scale-105 active:scale-110 active:shadow-none`
                }`}
              >
                {!p && <div className="absolute top-2 left-4 w-6 h-3 bg-white/40 rounded-full blur-[1px] rotate-[-15deg]" />}
                {p && <div className="text-3xl opacity-20">✨</div>}
              </button>
            ))}
          </div>
        </div>
        
        <button 
          onClick={handleFinish} 
          className="mt-8 bg-green-500 text-white px-20 py-8 rounded-full font-black uppercase text-2xl shadow-[0_10px_0_#15803d] border-4 border-white active:translate-y-2 active:shadow-none transition-all"
        >
          FINISH MAGIC POPS! ✨
        </button>
      </div>

      <div className="mt-10 bg-white/50 backdrop-blur-md px-12 py-4 rounded-full border-2 border-pink-100">
        <p className="text-pink-300 font-black uppercase text-[10px] tracking-[0.4em] text-center">
          "FEEL THE SQUISHY MAGIC!"
        </p>
      </div>
    </div>
  );
}
