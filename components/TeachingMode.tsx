
import React, { useState, useEffect } from 'react';
import { Lesson, Grade } from '../types';

interface TeachingModeProps {
  lesson: Lesson & { taskId: string };
  onComplete: (grade: Grade) => void;
  onCancel: () => void;
  speak: (text: string) => void;
  stopAllSpeech: () => void;
  childName: string;
}

export default function TeachingMode({ lesson, onComplete, onCancel, speak, stopAllSpeech, childName }: TeachingModeProps) {
  const [currentPart, setCurrentPart] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);
  const [isSparkling, setIsSparkling] = useState(false);
  const part = lesson.parts[currentPart];

  const handleSpeak = () => {
    setIsSparkling(true);
    if (!showChallenge && part) {
      speak(`${part.title}. ${part.content}. Now, ${part.action}`);
    } else if (showChallenge) {
      speak(`Super persistence! Here is your Big Girl Challenge. ${lesson.bigGirlChallenge.title}. ${lesson.bigGirlChallenge.content}. Go for it, ${childName}!`);
    }
    setTimeout(() => setIsSparkling(false), 2000);
  };

  useEffect(() => {
    handleSpeak();
  }, [currentPart, part, showChallenge, childName]);

  const handleNext = () => {
    if (showChallenge) {
      onComplete('Diamond');
      return;
    }

    if (currentPart < lesson.parts.length - 1) {
      setCurrentPart(currentPart + 1);
    } else {
      setShowChallenge(true);
      speak(`Wonderful magic learned! Now for the big challenge!`);
    }
  };

  const handleWatchVideo = () => {
    if (lesson.youtubeUrl) {
      window.open(lesson.youtubeUrl, '_blank');
    }
  };

  const hintText = showChallenge ? "🏆" : (part?.visualHint || "🐚");

  return (
    <div className="fixed inset-0 z-[99999] bg-white flex flex-col items-center p-8 overflow-hidden animate-pop">
      {/* Header Controls */}
      <div className="w-full flex justify-between items-center z-[100001]">
        <button 
          onClick={onCancel} 
          className="bg-white text-indigo-800 w-20 h-20 rounded-full flex items-center justify-center border-4 border-indigo-200 shadow-xl active:scale-90 transition-all text-4xl hover:bg-indigo-50"
        >
          ❌
        </button>

        {lesson.youtubeUrl && (
          <button 
            onClick={handleWatchVideo}
            className="bg-red-700 text-white px-10 py-5 rounded-full font-black uppercase text-xl border-4 border-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 animate-pulse"
          >
            <span>WATCH VIDEO</span>
            <span className="text-4xl">📺</span>
          </button>
        )}
      </div>

      <div className="flex-1 w-full max-w-6xl flex flex-col items-center">
        {/* Progress Tracker */}
        <div className="flex justify-center gap-4 mt-8 mb-4">
          {lesson.parts.map((_, i) => (
            <div key={i} className={`h-5 rounded-full transition-all duration-500 ${i <= currentPart ? 'w-24 bg-indigo-700 shadow-lg' : 'w-8 bg-indigo-100'}`} />
          ))}
          <div className={`h-5 w-8 rounded-full ${showChallenge ? 'bg-yellow-500 shadow-md' : 'bg-indigo-100'}`} />
        </div>

        {/* Visual Symbol Portal (Flex-grow ensures it takes center space) */}
        <div className="flex-1 w-full flex items-center justify-center">
          <div 
            onClick={handleSpeak}
            className={`w-full max-w-[85vh] aspect-square bg-white rounded-[10rem] border-[30px] border-indigo-100 shadow-[0_40px_80px_rgba(0,0,0,0.1)] flex items-center justify-center relative transition-all duration-500 cursor-pointer ${isSparkling ? 'scale-110 ring-[30px] ring-indigo-500/20' : 'hover:scale-[1.02]'}`}
          >
            <div className={`transition-all duration-500 leading-none font-black text-indigo-950 text-[35vh] drop-shadow-2xl ${isSparkling ? 'animate-pounce' : 'bouncy'}`}>
              {hintText}
            </div>
          </div>
        </div>

        {/* Action Tray (Anchored at bottom, separate from portal) */}
        <div className="w-full max-w-5xl mt-8">
            <div className="bg-indigo-950 p-10 rounded-[4rem] border-8 border-white shadow-2xl text-center mb-8 transform transition-transform duration-500 hover:scale-[1.01]">
               <p className="text-indigo-300 font-black uppercase text-sm tracking-[0.4em] mb-4">Magic Lesson Action</p>
               <h3 className="text-4xl md:text-5xl font-black text-white leading-tight">
                 ✨ {showChallenge ? lesson.bigGirlChallenge.content : part?.action} ✨
               </h3>
            </div>

            <button 
              onClick={handleNext} 
              className="w-full py-12 bg-indigo-700 text-white rounded-[4rem] font-black text-6xl shadow-[0_25px_0_#1e1b4b] hover:scale-[1.02] active:translate-y-4 active:shadow-none transition-all uppercase border-8 border-white tracking-tighter"
            >
              {showChallenge ? "CLAIM DIAMOND! 💎" : (currentPart === lesson.parts.length - 1 ? "BIG CHALLENGE! ➡️" : "I DID IT! ✅")}
            </button>
        </div>
      </div>

      <style>{`
        @keyframes pounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15) translateY(-30px); }
        }
        .animate-pounce { animation: pounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
}
