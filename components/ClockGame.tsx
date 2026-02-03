
import React, { useState, useEffect, useCallback, useRef } from 'react';

export default function ClockGame({ onComplete, onCancel, speak, parentSound, childName }: { onComplete: (reward: number, time: number, errors: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string, childName: string }) {
  const [targetHour, setTargetHour] = useState(12);
  const [targetMinute, setTargetMinute] = useState(0);
  const [currentHour, setCurrentHour] = useState(12);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [round, setRound] = useState(1);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [startTime] = useState(Date.now());
  const [gameState, setGameState] = useState<'playing' | 'won'>('playing');
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const generateNewTime = useCallback(() => {
    const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const minutes = [0, 30]; 
    const h = hours[Math.floor(Math.random() * hours.length)];
    const m = minutes[Math.floor(Math.random() * minutes.length)];
    setTargetHour(h);
    setTargetMinute(m);
    setIncorrectCount(0);
    
    const timeStr = m === 0 ? `${h} o'clock` : `half past ${h}`;
    speak(`Match the clock to ${timeStr}!`);
  }, [speak]);

  useEffect(() => {
    generateNewTime();
  }, [generateNewTime]);

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    
    if (currentHour === targetHour && currentMinute === targetMinute) {
      new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3').play().catch(() => {});
      setIncorrectCount(0);
      if (round < 5) {
        setRound(r => r + 1);
        generateNewTime();
        speak("Brilliant! Spot on!");
      } else {
        setGameState('won');
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        speak(`You are a Time Master, ${childName}!`);
        setTimeout(() => onComplete(30, timeTaken, totalErrors), 3000);
      }
    } else {
      setTotalErrors(prev => prev + 1);
      const newCount = incorrectCount + 1;
      setIncorrectCount(newCount);
      
      if (newCount >= 3) {
        const timeStr = targetMinute === 0 ? `${targetHour} o'clock` : `half past ${targetHour}`;
        speak(`Let me help you! Look, this is how we show ${timeStr}. Now click Check!`);
        setCurrentHour(targetHour);
        setCurrentMinute(targetMinute);
        setIncorrectCount(0);
      } else {
        speak("Not quite! Look at the hands carefully.");
        new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(() => {});
      }
    }
  };

  const hourRotation = (currentHour % 12) * 30 + (currentMinute / 60) * 30;
  const minuteRotation = currentMinute * 6;

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-yellow-50 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-lg flex justify-between items-center mb-6 z-20">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-yellow-600 px-8 py-3 rounded-full font-black border-4 border-yellow-100 shadow-lg active:scale-95 transition-all uppercase text-xs">Back to School 🏫</button>
        <div className="bg-white px-6 py-2 rounded-full font-black text-yellow-500 border-4 border-yellow-200">Round {round}/5</div>
      </div>

      <div className="bg-white/90 backdrop-blur-md px-12 py-5 rounded-[3rem] border-4 border-yellow-200 shadow-2xl mb-8 z-20 pointer-events-none">
        <h2 className="text-yellow-700 font-black text-2xl uppercase text-center">
          Match the Magic Clock: <span className="bg-yellow-100 px-4 py-1 rounded-xl ml-2">{targetHour}:{targetMinute === 0 ? '00' : '30'}</span>
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-2xl relative">
        <div className="w-80 h-80 md:w-96 md:h-96 rounded-full bg-white border-[15px] border-yellow-400 shadow-2xl relative flex items-center justify-center pointer-events-none">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
            <div 
              key={n} 
              className="absolute font-black text-3xl text-yellow-900"
              style={{
                transform: `rotate(${n * 30}deg) translateY(-140px) rotate(-${n * 30}deg)`
              }}
            >
              {n}
            </div>
          ))}
          <div 
            className="absolute bottom-1/2 left-1/2 w-3 h-36 bg-blue-500 rounded-full origin-bottom -translate-x-1/2 transition-transform duration-500 shadow-md"
            style={{ transform: `translateX(-50%) rotate(${minuteRotation}deg)` }}
          />
          <div 
            className="absolute bottom-1/2 left-1/2 w-5 h-24 bg-rose-500 rounded-full origin-bottom -translate-x-1/2 transition-transform duration-500 shadow-md"
            style={{ transform: `translateX(-50%) rotate(${hourRotation}deg)` }}
          />
          <div className="w-8 h-8 bg-yellow-600 rounded-full z-10 border-4 border-white shadow-md" />
        </div>

        <div className="bg-white p-8 rounded-[4rem] border-8 border-yellow-100 shadow-xl w-full flex flex-col gap-6" onClick={(e) => e.stopPropagation()}>
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                 <p className="text-xs font-black text-rose-500 uppercase tracking-widest text-center">Short Hand (Hour)</p>
                 <div className="flex justify-center gap-2">
                    <button onClick={() => { playParentVoice(); setCurrentHour(h => h === 1 ? 12 : h - 1); }} className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl font-black text-2xl shadow-md border-2 border-white active:scale-90 transition-all">-</button>
                    <button onClick={() => { playParentVoice(); setCurrentHour(h => h === 12 ? 1 : h + 1); }} className="w-14 h-14 bg-rose-500 text-white rounded-2xl font-black text-2xl shadow-md border-2 border-white active:scale-90 transition-all">+</button>
                 </div>
              </div>
              <div className="space-y-3">
                 <p className="text-xs font-black text-blue-500 uppercase tracking-widest text-center">Long Hand (Minute)</p>
                 <div className="flex justify-center gap-2">
                    <button onClick={() => { playParentVoice(); setCurrentMinute(m => m === 0 ? 30 : 0); }} className="w-full h-14 bg-blue-500 text-white rounded-2xl font-black text-xl shadow-md border-2 border-white active:scale-90 transition-all">Flip ↔️</button>
                 </div>
              </div>
           </div>
           
           <button 
            onClick={handleCheck}
            className="w-full py-5 bg-green-500 text-white rounded-full font-black text-2xl shadow-lg border-4 border-white active:scale-95 transition-transform uppercase"
           >
             {incorrectCount >= 2 ? "Need Help? 🧜‍♀️" : "Check the Time! 🔔"}
           </button>
        </div>
      </div>

      {gameState === 'won' && (
        <div className="absolute inset-0 bg-yellow-400/90 flex flex-col items-center justify-center z-50 animate-pop pointer-events-none">
           <span className="text-[12rem] mb-6 bouncy">🏆</span>
           <h2 className="text-6xl font-black text-white uppercase tracking-tighter">Clock Master!</h2>
        </div>
      )}
    </div>
  );
}
