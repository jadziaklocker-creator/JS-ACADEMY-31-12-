
import React, { useState, useEffect, useCallback, useRef } from 'react';

const LETTERS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

const COLORS = ['bg-pink-400', 'bg-cyan-400', 'bg-purple-400', 'bg-amber-400', 'bg-blue-400'];

export default function BubblePopGame({ onComplete, onCancel, speak, parentSound }: { onComplete: (reward: number, time: number, errors: number) => void; onCancel: () => void; speak: (t: string) => void; parentSound?: string }) {
  const [targetLetter, setTargetLetter] = useState('');
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [round, setRound] = useState(1);
  const [bubbleColor, setBubbleColor] = useState(COLORS[0]);
  const [isWon, setIsWon] = useState(false);
  const [startTime] = useState(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const pickNewTarget = useCallback(() => {
    const allChars = LETTERS.flat();
    const next = allChars[Math.floor(Math.random() * allChars.length)];
    setTargetLetter(next);
    setBubbleColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    speak(`Find the letter ${next} on the magic keyboard!`);
  }, [speak]);

  useEffect(() => {
    pickNewTarget();
  }, [pickNewTarget]);

  const playParentVoice = () => {
    if (parentSound && (!audioRef.current || audioRef.current.ended)) {
      audioRef.current = new Audio(parentSound);
      audioRef.current.play().catch(() => {});
    }
  };

  const handleKeyClick = (char: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    
    if (isWon) return;

    if (char === targetLetter) {
      setScore(s => s + 5);
      new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3').play().catch(() => {});
      speak(`Well done! That's ${char}!`);
      
      if (round < 10) {
        setRound(r => r + 1);
        pickNewTarget();
      } else {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        setIsWon(true);
        speak("You are an ABC Master!");
        setTimeout(() => onComplete(score + 10, timeTaken, errors), 2000);
      }
    } else {
      setErrors(prev => prev + 1);
      speak(`That is ${char}. Try to find ${targetLetter}!`);
      new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(() => {});
    }
  };

  useEffect(() => {
    const handlePhysicalKey = (e: KeyboardEvent) => {
      const char = e.key.toUpperCase();
      if (LETTERS.flat().includes(char)) {
        playParentVoice();
        const mockEvent = { stopPropagation: () => {} } as React.MouseEvent;
        handleKeyClick(char, mockEvent);
      }
    };
    window.addEventListener('keydown', handlePhysicalKey);
    return () => window.removeEventListener('keydown', handlePhysicalKey);
  }, [targetLetter, isWon, round, parentSound]);

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-blue-900 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-4xl flex justify-between items-center mb-6 z-[2100]">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-blue-900 px-6 py-2 rounded-full font-black border-4 border-white shadow-lg active:scale-95">Back to School 🏫</button>
        <div className="flex gap-4 items-center">
          <div className="bg-white px-10 py-2 rounded-full font-black text-blue-600 border-4 border-blue-400">
            Round {round} / 10
          </div>
          <div className="bg-blue-400 text-white px-6 py-2 rounded-full font-black text-2xl border-4 border-white">
            R{score}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-12 w-full relative z-[2050]">
        <div className={`w-48 h-48 rounded-full border-8 border-white shadow-[0_20px_0_rgba(0,0,0,0.2)] flex items-center justify-center animate-bounce transition-all ${bubbleColor}`}>
          <span className="text-[10rem] font-black text-white drop-shadow-lg">{targetLetter}</span>
        </div>

        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[4rem] border-8 border-white/20 shadow-2xl space-y-4">
          {LETTERS.map((row, i) => (
            <div key={i} className="flex justify-center gap-3">
              {row.map(char => (
                <button
                  key={char}
                  onClick={(e) => handleKeyClick(char, e)}
                  className={`w-14 h-16 md:w-20 md:h-24 rounded-2xl flex items-center justify-center text-3xl md:text-5xl font-black transition-all transform active:scale-90 shadow-lg ${
                    char === targetLetter 
                    ? 'bg-yellow-400 text-white border-4 border-white animate-pulse' 
                    : 'bg-white text-blue-900 border-4 border-blue-50 hover:bg-blue-50'
                  }`}
                >
                  {char}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {isWon && (
        <div className="absolute inset-0 bg-blue-900/90 flex flex-col items-center justify-center z-[2300] animate-pop">
           <span className="text-[12rem] mb-6 bouncy">🎓</span>
           <h2 className="text-6xl font-black text-white uppercase tracking-tighter">ABC GENIUS!</h2>
        </div>
      )}
    </div>
  );
}
