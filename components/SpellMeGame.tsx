
import React, { useState, useEffect, useRef } from 'react';

const CHALLENGES = [
  { word: 'CAT', emoji: '🐱', hint: 'Meow! I love milk.' },
  { word: 'DOG', emoji: '🐶', hint: 'Woof! I am your best friend.' },
  { word: 'SUN', emoji: '☀️', hint: 'I shine bright in the sky!' },
  { word: 'BED', emoji: '🛏️', hint: 'Time to sleep!' },
  { word: 'FISH', emoji: '🐟', hint: 'I swim in the ocean!' },
];

export default function SpellMeGame({ onComplete, onCancel, speak, parentSound }: { onComplete: (reward: number, time: number, errors: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [startTime] = useState(Date.now());
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  
  const challenge = CHALLENGES[currentIdx];

  useEffect(() => {
    const letters = challenge.word.split('');
    const extra = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').filter(l => !letters.includes(l)).sort(() => Math.random() - 0.5).slice(0, 5);
    setOptions([...letters, ...extra].sort(() => Math.random() - 0.5));
    setIncorrectCount(0);
    speak(`Spell the word: ${challenge.word}. ${challenge.hint}`);
  }, [currentIdx, speak, challenge.word, challenge.hint]);

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const handleLetterClick = (letter: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();

    const nextCharIndex = input.length;
    const expectedChar = challenge.word[nextCharIndex];

    if (letter === expectedChar) {
      const nextInput = input + letter;
      setInput(nextInput);
      setIncorrectCount(0);
      speak(letter);
      new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3').play().catch(() => {});
      
      if (nextInput === challenge.word) {
        speak(`Correct! ${challenge.word}! Well done!`);
        setTimeout(() => {
          if (currentIdx < CHALLENGES.length - 1) {
            setCurrentIdx(currentIdx + 1);
            setInput('');
          } else {
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);
            onComplete(40, timeTaken, totalErrors);
          }
        }, 2000);
      }
    } else {
      setTotalErrors(prev => prev + 1);
      const newInc = incorrectCount + 1;
      setIncorrectCount(newInc);
      
      if (newInc >= 3) {
        speak(`Let me help you! The next letter is ${expectedChar}.`);
        setInput(input + expectedChar);
        setIncorrectCount(0);
        
        const nextInput = input + expectedChar;
        if (nextInput === challenge.word) {
            setTimeout(() => {
                if (currentIdx < CHALLENGES.length - 1) {
                  setCurrentIdx(currentIdx + 1);
                  setInput('');
                } else {
                  const timeTaken = Math.floor((Date.now() - startTime) / 1000);
                  onComplete(40, timeTaken, totalErrors);
                }
              }, 2000);
        }
      } else {
        speak(`Oops! Try again for ${challenge.word}!`);
        new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(() => {});
      }
    }
  };

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-emerald-50 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-lg flex justify-between items-center mb-8">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-emerald-500 px-8 py-3 rounded-full font-black border-4 border-emerald-100 shadow-lg active:scale-95 transition-all uppercase text-xs">Back to School 🏫</button>
        <h2 className="text-emerald-600 font-black text-2xl uppercase">Spell Me</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-2xl">
        <div className="w-64 h-64 bg-white rounded-[4rem] border-[15px] border-white shadow-2xl flex items-center justify-center text-[10rem] bouncy pointer-events-none">
          {challenge.emoji}
        </div>

        <div className="flex gap-4">
          {challenge.word.split('').map((_, i) => (
            <div key={i} className={`w-20 h-24 rounded-2xl border-b-[10px] border-emerald-200 flex items-center justify-center text-5xl font-black transition-all ${input[i] ? 'bg-emerald-500 text-white border-white scale-110 shadow-lg' : 'bg-white text-emerald-200'}`}>
              {input[i] || ''}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {options.map((letter, i) => (
            <button
              key={i}
              onClick={(e) => handleLetterClick(letter, e)}
              className="w-16 h-16 bg-white rounded-2xl border-4 border-emerald-100 text-3xl font-black text-emerald-600 shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-10 bg-white/50 p-6 rounded-[2rem] text-center border-4 border-emerald-100 max-w-sm pointer-events-none">
        <p className="text-emerald-900 font-black uppercase text-xs mb-1">Mermaid Tip:</p>
        <p className="text-emerald-600 font-bold italic">"{challenge.hint}"</p>
      </div>
    </div>
  );
}
