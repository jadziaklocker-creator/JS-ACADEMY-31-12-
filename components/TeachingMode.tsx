
import React, { useState, useEffect } from 'react';
import { Lesson, Grade } from '../types';

interface TeachingModeProps {
  lesson: Lesson & { taskId: string };
  onComplete: (grade: Grade) => void;
  onCancel: () => void;
  speak: (text: string) => void;
  stopAllSpeech: () => void;
}

export default function TeachingMode({ lesson, onComplete, onCancel, speak, stopAllSpeech }: TeachingModeProps) {
  const [currentPart, setCurrentPart] = useState(0);
  const [showChallenge, setShowChallenge] = useState(false);
  const part = lesson.parts[currentPart];

  useEffect(() => {
    if (!showChallenge && part) {
      speak(`${part.title}. ${part.content}. Now, ${part.action}`);
    } else if (showChallenge) {
      speak(`Wonderful persistence! Here is your Big Girl Challenge. ${lesson.bigGirlChallenge.title}. ${lesson.bigGirlChallenge.content}. You've got this, Jadzia! Never give up!`);
    }
  }, [currentPart, part, speak, showChallenge]);

  const handleNext = () => {
    if (currentPart < lesson.parts.length - 1) {
      setCurrentPart(currentPart + 1);
    } else {
      setShowChallenge(true);
      speak(`Wonderful wonders learned! Now for the big challenge!`);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-gradient-to-b from-[#00b4d8] to-[#03045e] flex flex-col items-center p-6 overflow-hidden">
      {/* Scrollable Container */}
      <div className="w-full h-full max-w-5xl flex flex-col items-center overflow-y-auto no-scrollbar pb-20">
        
        {/* Top Progress Bar */}
        <div className="w-full flex justify-between items-center mb-10 shrink-0">
          <button 
            onClick={onCancel} 
            className="bg-white/20 backdrop-blur-md text-white px-10 py-4 rounded-full font-black border-4 border-white/30 shadow-lg active:scale-95 transition-all uppercase text-xs"
          >
            Quit Lesson 🛑
          </button>
          <div className="bg-white/20 backdrop-blur-md px-10 py-4 rounded-full border-4 border-white/30">
            <div className="flex gap-3">
              {lesson.parts.map((_, i) => (
                <div key={i} className={`h-4 rounded-full transition-all duration-700 ${i <= currentPart ? 'w-16 bg-cyan-400' : 'w-4 bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Visual Aid Area */}
        <div className="w-full aspect-[16/9] md:aspect-video bg-white rounded-[5rem] border-[15px] border-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex items-center justify-center animate-pop relative overflow-hidden group shrink-0 mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50 opacity-50"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-10 p-10">
            <span className="text-[15rem] leading-none drop-shadow-2xl animate-bounce-slow select-none filter contrast-125">
              {showChallenge ? "🏆" : (part?.visualHint || "🐚")}
            </span>
            <div className="bg-cyan-500 text-white px-16 py-4 rounded-full font-black uppercase text-3xl shadow-xl tracking-tighter">
              {showChallenge ? "Final Mastery" : part?.title}
            </div>
          </div>
        </div>

        {/* Instruction Container */}
        <div className="bg-white p-12 md:p-16 rounded-[5rem] border-[12px] border-white shadow-2xl animate-pop w-full relative shrink-0">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-16 py-4 rounded-full font-black uppercase text-sm shadow-xl whitespace-nowrap">
            Academy Narration 🔊
          </div>
          
          <div className="space-y-10 text-center">
            {showChallenge ? (
              <>
                <h3 className="text-5xl font-black text-purple-900 uppercase tracking-tighter leading-none">{lesson.bigGirlChallenge.title}</h3>
                <p className="text-3xl font-black text-purple-600 leading-tight">
                  {lesson.bigGirlChallenge.content}
                </p>
                <div className="h-2 w-20 bg-purple-100 mx-auto rounded-full"></div>
                <p className="text-lg font-black text-indigo-400 uppercase italic tracking-widest">"You've got this, Jadzia! Never give up!"</p>
              </>
            ) : (
              <>
                <p className="text-4xl font-black text-purple-900 leading-tight">
                  {part?.content}
                </p>
                
                <div className="p-10 bg-cyan-50 rounded-[4rem] border-4 border-white shadow-inner">
                  <p className="text-xs font-black uppercase text-cyan-500 mb-4 tracking-[0.3em]">Your Surprise Action:</p>
                  <p className="text-3xl font-black text-cyan-700 italic">
                    ✨ {part?.action} ✨
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-8 mt-16">
            {!showChallenge ? (
              <button 
                  onClick={() => { stopAllSpeech(); handleNext(); }} 
                  className="w-full py-10 bg-gradient-to-r from-cyan-400 to-blue-600 text-white rounded-[3rem] font-black text-4xl shadow-[0_15px_0_#1e3a8a] hover:scale-[1.02] active:scale-95 transition-all uppercase border-8 border-white"
              >
                  {currentPart === lesson.parts.length - 1 ? "Start Challenge! 💎" : "I'm Ready! ➡️"}
              </button>
            ) : (
              <button 
                  onClick={() => { stopAllSpeech(); onComplete('Diamond'); }} 
                  className="w-full py-10 bg-gradient-to-r from-green-400 to-emerald-600 text-white rounded-[3rem] font-black text-4xl shadow-[0_15px_0_#064e3b] hover:scale-[1.02] active:scale-95 transition-all uppercase border-8 border-white"
              >
                  Lesson Finished! 🎉
              </button>
            )}
          </div>
        </div>
        
        {/* Encouragement Footer */}
        <div className="mt-16 bg-white/10 backdrop-blur-md px-16 py-6 rounded-full border-4 border-white/20 shrink-0 mb-20">
          <p className="text-white font-black uppercase text-sm tracking-widest animate-pulse">
             "Wonderful things take practice. You are doing amazing!"
          </p>
        </div>
      </div>
    </div>
  );
}
