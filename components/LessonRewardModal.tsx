
import React, { useState, useRef } from 'react';
import Mascot from './Mascot';
import { Task } from '../types';

interface LessonRewardModalProps {
  task: Task;
  existingAudio?: string;
  onClose: () => void;
  onSaveAudio: (base64: string) => void;
  speak: (text: string) => void;
  stopAllSpeech: () => void;
}

export default function LessonRewardModal({ task, existingAudio, onClose, onSaveAudio, speak, stopAllSpeech }: LessonRewardModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PARENT_PASSWORD = '2806';

  const handlePlayReward = () => {
    if (existingAudio) {
      const audio = new Audio(existingAudio);
      audio.play().catch(e => console.error("Reward audio failed", e));
    } else {
      speak("Wonderful job Jadzia! Parent hasn't recorded a magic message for this one yet, but I think you are amazing!");
    }
  };

  const handleParentAction = () => {
    setShowPassword(true);
    setPasswordInput('');
  };

  const verifyPassword = () => {
    // Fixed: Change parentCodeInput to passwordInput which is defined in state
    if (passwordInput === PARENT_PASSWORD) {
      setShowPassword(false);
      fileInputRef.current?.click();
    } else {
      speak("Wrong magic code, parent!");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onSaveAudio(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-pop">
      <input 
        type="file" 
        accept="audio/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={onFileChange} 
      />

      {showPassword && (
        <div className="fixed inset-0 z-[8000] bg-black/90 flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[4rem] w-full max-w-md text-center border-[10px] border-white shadow-2xl">
            <h3 className="text-3xl font-black text-purple-900 uppercase mb-4">Parent Portal</h3>
            <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest">Enter code to upload praise</p>
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              className="w-full p-6 bg-purple-50 rounded-3xl text-center text-4xl font-black outline-none border-4 border-purple-100 mb-8 text-purple-900"
              autoFocus
            />
            <div className="flex gap-4">
              <button onClick={() => setShowPassword(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-full font-black uppercase">Cancel</button>
              <button onClick={verifyPassword} className="flex-1 py-5 bg-purple-900 text-white rounded-full font-black uppercase">Verify</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="absolute text-2xl animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: 0.3
            }}
          >
            ✨
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-10">
        <div className="text-center">
          <h2 className="text-white font-black text-5xl md:text-6xl uppercase tracking-tighter mb-2 drop-shadow-lg">Lesson Complete!</h2>
          <p className="text-pink-300 font-black text-xl uppercase tracking-[0.3em]">{task.title}</p>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-[80px] animate-pulse group-hover:bg-cyan-400/30 transition-all"></div>
          <Mascot isSpeaking={false} className="scale-110 drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]" />
        </div>

        <div className="w-full space-y-6">
          <button 
            onClick={handlePlayReward}
            className="w-full py-10 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-white rounded-[3rem] font-black text-3xl shadow-[0_20px_0_rgba(0,0,0,0.3)] border-[10px] border-white active:translate-y-4 active:shadow-none transition-all flex items-center justify-center gap-6"
          >
            <span className="text-6xl">🎁</span>
            <span>PLAY MY MAGIC REWARD!</span>
          </button>

          <div className="flex gap-4">
            <button 
              onClick={handleParentAction}
              className="flex-1 py-6 bg-white/10 backdrop-blur-md text-white/70 rounded-[2rem] font-black uppercase text-sm border-4 border-white/20 hover:bg-white/20 transition-all"
            >
              🔒 Parent Access
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xl border-4 border-white shadow-lg active:scale-95 transition-all"
            >
              Back to School 🗺️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
