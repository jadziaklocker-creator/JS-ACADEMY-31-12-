
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
      speak(`Wonderful persistence! Here is your Big Girl Challenge. ${lesson.bigGirlChallenge.title}. ${lesson.bigGirlChallenge.content}. You've got this, ${childName}! Never give up!`);
    }
    setTimeout(() => setIsSparkling(false), 2000);
  };

  useEffect(() => {
    handleSpeak();
  }, [currentPart, part, showChallenge, childName]);

  const handleNext = () => {
    if (currentPart < lesson.parts.length - 1) {
      setCurrentPart(currentPart + 1);
    } else {
      setShowChallenge(true);
      speak(`Wonderful wonders learned! Now for the big challenge!`);
    }
  };

  const hintText = showChallenge ? "🏆" : (part?.visualHint || "🐚");
  const isHintLongText = hintText.length > 2;

  return (
    <div className="fixed inset-0 z-[10000] bg-gradient-to-b from-[#03045e] via-[#023e8a] to-[#0077b6] flex flex-col items-center p-6 overflow-hidden">
      {/* Dynamic Magic Particles */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        {[...Array(15)].map((_, i) => (
          <div 
            key={i} 
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 8 + 2}px`,
              height: `${Math.random() * 8 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 1}s`
            }}
          />
        ))}
      </div>

      <div className="w-full h-full max-w-7xl flex flex-col items-center overflow-hidden">
        
        {/* Upper HUD */}
        <div className="w-full flex justify-between items-center mb-6 shrink-0 z-20">
          <button 
            onClick={onCancel} 
            className="bg-white/10 backdrop-blur-xl text-white px-10 py-4 rounded-full font-black border-4 border-white/20 shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest hover:bg-white/20"
          >
            Quit Academy 🛑
          </button>
          
          <div className="bg-white/10 backdrop-blur-xl px-12 py-5 rounded-full border-4 border-white/20 shadow-2xl flex items-center gap-6">
            <span className="text-white font-black uppercase text-xs tracking-widest mr-2">Lesson Progress</span>
            <div className="flex gap-4">
              {lesson.parts.map((_, i) => (
                <div key={i} className={`h-5 rounded-full transition-all duration-700 shadow-inner ${i <= currentPart ? 'w-20 bg-cyan-400 border-2 border-white/50' : 'w-5 bg-white/20 border-2 border-transparent'}`} />
              ))}
              <div className={`h-5 w-5 rounded-full border-2 transition-all duration-700 ${showChallenge ? 'bg-yellow-400 border-white scale-125 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-white/20 border-transparent'}`}>🏆</div>
            </div>
          </div>
        </div>

        {/* MAIN STAGE */}
        <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-2 gap-10 min-h-0 mb-8 z-10 items-stretch">
          
          {/* Visual Aid Stage - MAGIC MIRROR (FIXED STABILITY) */}
          <div className="relative group perspective-1000 flex flex-col h-full min-h-[400px]">
            <div 
              onClick={handleSpeak}
              className={`flex-1 bg-white rounded-[5rem] border-[20px] border-white shadow-[0_60px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center animate-pop relative overflow-hidden transition-all duration-500 cursor-pointer ${isSparkling ? 'ring-[20px] ring-cyan-400/50' : 'hover:scale-[1.01]'}`}
            >
              {/* Magic Glass Layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/40 via-white/10 to-blue-200/40 z-0"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0%,transparent_70%)] opacity-30 animate-pulse pointer-events-none"></div>

              <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-10 text-center">
                {/* Responsive Content Display */}
                <div className={`transition-transform duration-500 leading-none drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] select-none font-black text-indigo-950 flex items-center justify-center uppercase tracking-tighter ${isHintLongText ? 'text-8xl md:text-9xl' : 'text-[18rem] md:text-[22rem]'} ${isSparkling ? 'scale-110 animate-pounce' : 'animate-bounce-slow'}`}>
                  {hintText}
                </div>
                
                <div className="absolute bottom-12 bg-indigo-600 text-white px-14 py-4 rounded-full font-black uppercase text-2xl shadow-2xl tracking-tighter border-4 border-white transform translate-y-4">
                  {showChallenge ? "Mastery Treasure" : part?.title}
                </div>
              </div>

              {/* Interaction Label */}
              <div className="absolute top-10 flex items-center gap-3 bg-indigo-50/80 px-8 py-3 rounded-full font-black text-indigo-700 text-xs uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity border-2 border-indigo-100">
                <span>Magic Click to Listen</span>
                <span className="animate-bounce">🔊</span>
              </div>
            </div>
          </div>

          {/* Narrative Info Stage */}
          <div className="flex flex-col gap-8 h-full min-h-0">
             {/* Academy Narration Card */}
             <div className="flex-1 bg-white p-14 md:p-16 rounded-[5rem] border-[14px] border-white shadow-2xl animate-pop relative overflow-hidden flex flex-col">
                <div className="absolute -top-0 right-14 bg-indigo-600 text-white px-12 py-4 rounded-b-[2.5rem] font-black uppercase text-[12px] shadow-lg tracking-[0.25em] z-20 border-x-4 border-b-4 border-white">
                  Academy Voice 🔊
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar pr-2 mt-8">
                   <div className="space-y-10 py-6">
                    {showChallenge ? (
                      <div className="space-y-8 text-center">
                        <h3 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter leading-tight">{lesson.bigGirlChallenge.title}</h3>
                        <p className="text-4xl font-black text-indigo-700 leading-snug">
                          {lesson.bigGirlChallenge.content}
                        </p>
                        <div className="h-4 w-32 bg-indigo-50 rounded-full mx-auto"></div>
                        <p className="text-2xl font-black text-cyan-600 uppercase italic tracking-[0.2em] animate-pulse leading-none">
                          "You've got this, {childName}! Be Brave!"
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-10 text-center">
                        <p className="text-4xl md:text-5xl font-black text-indigo-950 leading-tight tracking-tight">
                          {part?.content}
                        </p>
                        
                        <div className="p-12 bg-gradient-to-br from-cyan-50 to-indigo-50 rounded-[4.5rem] border-4 border-indigo-100 shadow-inner group-hover:scale-[1.01] transition-transform">
                          <p className="text-[12px] font-black uppercase text-indigo-400 mb-6 tracking-[0.4em] opacity-80">Magic Action Required:</p>
                          <p className="text-4xl md:text-5xl font-black text-indigo-900 italic leading-snug">
                            ✨ {part?.action} ✨
                          </p>
                        </div>
                      </div>
                    )}
                   </div>
                </div>
             </div>

             {/* Action Buttons */}
             <div className="shrink-0 flex gap-6">
                {!showChallenge ? (
                  <button 
                      onClick={() => { stopAllSpeech(); handleNext(); }} 
                      className="flex-1 py-12 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white rounded-[3.5rem] font-black text-4xl shadow-[0_20px_0_#1e3a8a] hover:scale-[1.02] active:scale-95 active:translate-y-4 active:shadow-none transition-all uppercase border-8 border-white tracking-widest flex items-center justify-center gap-8"
                  >
                      <span>{currentPart === lesson.parts.length - 1 ? "Big Challenge!" : "Step Done!"}</span>
                      <span className="text-6xl">{currentPart === lesson.parts.length - 1 ? "💎" : "✨"}</span>
                  </button>
                ) : (
                  <button 
                      onClick={() => { stopAllSpeech(); onComplete('Diamond'); }} 
                      className="flex-1 py-12 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 text-white rounded-[3.5rem] font-black text-4xl shadow-[0_20px_0_#064e3b] hover:scale-[1.02] active:scale-95 active:translate-y-4 active:shadow-none transition-all uppercase border-8 border-white tracking-widest flex items-center justify-center gap-8"
                  >
                      <span>Claim Reward!</span>
                      <span className="text-7xl">🎁</span>
                  </button>
                )}
             </div>
          </div>
        </div>
        
        {/* Footer Reminder */}
        <div className="mb-12 bg-white/10 backdrop-blur-md px-16 py-5 rounded-full border-2 border-white/20 shrink-0">
          <p className="text-white font-black uppercase text-[11px] tracking-[0.4em] animate-pulse text-center opacity-80">
             "You are a superstar learner, {childName}!"
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        .animate-pounce { animation: pounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
