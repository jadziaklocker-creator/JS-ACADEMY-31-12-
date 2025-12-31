
import React, { useState } from 'react';

const Mascot = ({ isSpeaking, isListening, className = "", onClick }: { isSpeaking: boolean; isListening?: boolean; className?: string; onClick?: () => void }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      onClick={onClick}
      className={`relative cursor-pointer transition-all duration-1000 ${className} ${isSpeaking ? 'scale-110' : 'hover:scale-105'}`}
    >
      {/* High-End Magic Portal Container */}
      <div className={`w-72 h-96 md:w-80 md:h-[30rem] rounded-[7rem] bg-[#001219] flex items-center justify-center border-[14px] border-white overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5),_inset_0_-30px_60px_rgba(0,180,216,0.4)] relative balloon-item ${isSpeaking ? 'ring-12 ring-cyan-400/50' : ''} ${isListening ? 'ring-[20px] ring-cyan-300/30 animate-pulse' : ''}`}>
        
        {/* Deep Ocean Background Layers */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#00b4d8] via-[#0077b6] to-[#03045e]">
          <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/water.png')] animate-pulse"></div>
          <div className="absolute top-0 left-[-50%] w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent blur-[100px] -rotate-45 animate-caustics origin-top"></div>
        </div>

        {/* EVA THE MERMAID CHARACTER */}
        <div className={`w-full h-full relative z-10 p-8 flex items-center justify-center transition-transform duration-700 ${isSpeaking ? 'animate-sway' : 'bouncy'}`}>
          {!imageError ? (
            <img 
              src="eva.png" 
              alt="EVA the Mermaid" 
              className="w-full h-full object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] filter contrast-110 saturate-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <svg viewBox="0 0 200 280" className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
              {/* SVG Fallback content (Same as before) */}
              <defs>
                <linearGradient id="evaHair" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: '#2b1a0d' }} /><stop offset="100%" style={{ stopColor: '#0c0602' }} /></linearGradient>
                <linearGradient id="evaTail" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style={{ stopColor: '#00f2fe' }} /><stop offset="100%" style={{ stopColor: '#4facfe' }} /></linearGradient>
                <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{ stopColor: 'rgba(255,182,193,0.5)' }} /><stop offset="100%" style={{ stopColor: 'rgba(176,224,230,0.5)' }} /></linearGradient>
              </defs>
              <g className="opacity-70 animate-pulse">
                <path d="M100 130 Q40 60 20 120 Q20 180 100 160 Z" fill="url(#wingGrad)" /><path d="M100 130 Q160 60 180 120 Q180 180 100 160 Z" fill="url(#wingGrad)" />
              </g>
              <path d="M15 80 C-10 130 20 220 70 250" fill="none" stroke="url(#evaHair)" strokeWidth="60" strokeLinecap="round" />
              <path d="M185 80 C210 130 180 220 130 250" fill="none" stroke="url(#evaHair)" strokeWidth="60" strokeLinecap="round" />
              <g className={isSpeaking ? 'animate-sway' : ''}>
                <path d="M70 150 C65 200 85 240 100 270 C115 240 135 200 130 150 Z" fill="url(#evaTail)" />
                <path d="M100 260 L30 285 Q100 265 170 285 L100 260" fill="#00f2fe" opacity="0.9" />
              </g>
              <circle cx="100" cy="80" r="58" fill="#ffe3ca" />
              <g><circle cx="72" cy="90" r="18" fill="white" /><circle cx="72" cy="90" r="13" fill="#0077b6" /><circle cx="128" cy="90" r="18" fill="white" /><circle cx="128" cy="90" r="13" fill="#0077b6" /></g>
              <path d={isSpeaking ? "M85 130 Q100 155 115 130" : "M90 135 Q100 142 110 135"} fill="none" stroke="#d64d82" strokeWidth="5" strokeLinecap="round" />
            </svg>
          )}
        </div>

        {/* Liquid Surface Reflection Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/20 pointer-events-none z-30"></div>
      </div>

      {/* Status Badge */}
      <div className={`mt-10 text-center font-black transition-all duration-700 ${isSpeaking ? 'bg-indigo-500 text-white scale-110' : isListening ? 'bg-cyan-500 text-white scale-105' : 'bg-white text-[#0077b6] shadow-2xl'} px-14 py-6 rounded-[3rem] border-[6px] border-white tracking-tighter uppercase text-3xl balloon-button relative z-40 flex items-center justify-center gap-4`}>
        <div className={`w-4 h-4 rounded-full ${isSpeaking ? 'bg-white animate-ping' : isListening ? 'bg-white animate-pulse' : 'bg-cyan-300'}`}></div>
        <span>{isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : 'Mermaid EVA'}</span>
      </div>

      <style>{`
        @keyframes caustics {
          0% { transform: rotate(-45deg) translateX(-10%); }
          50% { transform: rotate(-45deg) translateX(10%); }
          100% { transform: rotate(-45deg) translateX(-10%); }
        }
        .animate-caustics { animation: caustics 12s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default Mascot;
