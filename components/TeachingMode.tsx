
import React, { useState, useEffect } from 'react';
import { Lesson, Grade } from '../types';

interface TeachingModeProps {
  lesson: Lesson;
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
      speak(`Wonderful persistence! Here is your Big Girl Challenge. ${lesson.bigGirlChallenge.title}. ${lesson.bigGirlChallenge.content}`);
    }
  }, [currentPart, part, speak, showChallenge]);

  const handleNext = () => {
    if (currentPart < lesson.parts.length - 1) {
      setCurrentPart(currentPart + 1);
    } else {
      onComplete('Diamond');
    }
  };

  return (
    <div className="fixed inset-0 z-[6000] bg-gradient-to-b from-[#00b4d8] to-[#03045e] flex flex-col items-center p-6 overflow-y-auto no-scrollbar">
      {/* Top Controls */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 shrink-0">
        <button 
          onClick={onCancel} 
          className="bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-full font-black border-4 border-white/30 shadow-lg active:scale-95 transition-all uppercase text-sm"
        >
          Quit Lesson 🛑
        </button>
        <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full border-4 border-white/30">
          <div className="text-white font-black text-xs uppercase tracking-widest text-center">Learning Journey</div>
          <div className="flex gap-2 mt-1">
            {lesson.parts.map((_, i) => (
              <div key={i} className={`h-3 rounded-full transition-all duration-700 ${i <= currentPart ? 'w-10 bg-cyan-400' : 'w-4 bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-3xl">
        {/* Magic Subject Card (Simple Visual Aid) */}
        <div className="w-full aspect-video bg-white rounded-[5rem] border-[15px] border-white shadow-[0_40px_80px_rgba(0,0,0,0.4)] flex items-center justify-center animate-pop relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50 opacity-50"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="text-[14rem] md:text-[16rem] leading-none drop-shadow-2xl animate-bounce-slow select-none filter contrast-125">
              {showChallenge ? "🏆" : (part.visualHint || "✨")}
            </span>
            <div className="bg-cyan-500 text-white px-10 py-3 rounded-full font-black uppercase text-xl shadow-xl tracking-tighter">
              {showChallenge ? "Final Mastery" : part.title}
            </div>
          </div>
          
          {/* Subtle decoration */}
          <div className="absolute top-10 right-10 text-6xl opacity-10">🐚</div>
          <div className="absolute bottom-10 left-10 text-6xl opacity-10">🌊</div>
        </div>

        {/* Narrator Instruction Box */}
        <div className="bg-white p-12 rounded-[4rem] border-[10px] border-white shadow-2xl animate-pop w-full relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-12 py-3 rounded-full font-black uppercase text-sm shadow-xl whitespace-nowrap">
            Academy Lesson 🔊
          </div>
          
          <div className="space-y-8 text-center">
            {showChallenge ? (
              <>
                <h3 className="text-4xl font-black text-purple-900 uppercase tracking-tighter">{lesson.bigGirlChallenge.title}</h3>
                <p className="text-2xl font-black text-purple-600 leading-tight">
                  {lesson.bigGirlChallenge.content}
                </p>
                <p className="text-sm font-black text-indigo-400 uppercase italic">"You've got this, Jadzia! Never give up on your magic!"</p>
              </>
            ) : (
              <>
                <p className="text-3xl font-black text-purple-900 leading-tight">
                  {part.content}
                </p>
                
                <div className="p-8 bg-cyan-50 rounded-[3rem] border-4 border-white shadow-inner">
                  <p className="text-xs font-black uppercase text-cyan-500 mb-2 tracking-[0.2em]">Your Magic Task:</p>
                  <p className="text-2xl font-black text-cyan-700 italic">
                    ✨ {part.action} ✨
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-6 mt-12">
            {!showChallenge && currentPart === lesson.parts.length - 1 && (
                <button 
                    onClick={() => { stopAllSpeech(); setShowChallenge(true); }}
                    className="w-full py-6 bg-gradient-to-r from-purple-500 to-indigo-700 text-white rounded-[2.5rem] font-black text-2xl shadow-[0_10px_0_#4c1d95] hover:scale-105 active:scale-95 transition-all uppercase border-4 border-white"
                >
                    Diamond Challenge! 💎
                </button>
            )}

            <button 
                onClick={() => { stopAllSpeech(); showChallenge ? onComplete('Diamond') : handleNext(); }} 
                className="w-full py-8 bg-gradient-to-r from-cyan-400 to-blue-600 text-white rounded-[2.5rem] font-black text-3xl shadow-[0_12px_0_#1e3a8a] hover:scale-105 active:scale-95 transition-all uppercase border-4 border-white"
            >
                {showChallenge ? "Lesson Mastered! 🎉" : (currentPart === lesson.parts.length - 1 ? "Magic Learned! 🎉" : "I'm Ready! ➡️")}
            </button>
          </div>
        </div>
      </div>
      
      {/* Persistance Reminder Footer */}
      <div className="mt-10 bg-white/10 backdrop-blur-md px-10 py-4 rounded-full border-2 border-white/20">
        <p className="text-white font-black uppercase text-[10px] tracking-widest animate-pulse">
           "Magic takes practice. Keep going, Jadzia!"
        </p>
      </div>
    </div>
  );
}
