
import React, { useState, useRef, useEffect } from 'react';
import Mascot from './Mascot';
import { Task } from '../types';

interface LessonRewardModalProps {
  task: Task;
  existingAudio?: string;
  onClose: () => void;
  onSaveAudio: (base64: string) => void;
  speak: (text: string) => void;
  stopAllSpeech: () => void;
  isSpeaking: boolean;
  mascotImg?: string | null;
  childName: string;
}

export default function LessonRewardModal({ task, existingAudio, onClose, onSaveAudio, speak, stopAllSpeech, isSpeaking, mascotImg, childName }: LessonRewardModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isLocalAudioPlaying, setIsLocalAudioPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PARENT_PASSWORD = '2806';

  const handlePlayReward = () => {
    if (existingAudio) {
      const audio = new Audio(existingAudio);
      audio.onplay = () => setIsLocalAudioPlaying(true);
      audio.onended = () => setIsLocalAudioPlaying(false);
      audio.onerror = () => setIsLocalAudioPlaying(false);
      audio.play().catch(e => {
        console.error("Reward audio failed", e);
        setIsLocalAudioPlaying(false);
      });
    } else {
      speak(`Wonderful job ${childName}! You finished ${task.title}! You are a superstar! Parent hasn't recorded a special message yet, but I think you are purely magical!`);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handlePlayReward();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleParentAction = () => {
    setShowPassword(true);
    setPasswordInput('');
  };

  const verifyPassword = () => {
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
        speak("Magic clip saved! Playing it for you now.");
        setTimeout(() => {
          handlePlayReward();
        }, 1500);
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
          <h2 className="text-white font-black text-5xl md:text-6xl uppercase tracking-tighter mb-2 drop-shadow-lg animate-bounce">Lesson Complete! 💎</h2>
          <p className="text-pink-300 font-black text-xl uppercase tracking-[0.3em]">{task.title}</p>
        </div>

        <div className="relative group">
          <div className={`absolute inset-0 bg-white/20 rounded-full blur-[80px] transition-all duration-1000 ${(isSpeaking || isLocalAudioPlaying) ? 'bg-cyan-400/40 scale-125' : 'bg-white/10'}`}></div>
          <Mascot isSpeaking={isSpeaking || isLocalAudioPlaying} className="scale-110 drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]" customImage={mascotImg} />
        </div>

        <div className="w-full space-y-6">
          <button 
            onClick={handlePlayReward}
            className={`w-full py-10 rounded-[3rem] font-black text-3xl shadow-[0_20px_0_rgba(0,0,0,0.3)] border-[10px] border-white active:translate-y-4 active:shadow-none transition-all flex items-center justify-center gap-6 ${(isSpeaking || isLocalAudioPlaying) ? 'bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse' : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'} text-white`}
          >
            <span className="text-6xl">{(isSpeaking || isLocalAudioPlaying) ? '🔊' : '🎁'}</span>
            <span>{(isSpeaking || isLocalAudioPlaying) ? 'PLAYING REWARD...' : 'REPLAY MAGIC REWARD'}</span>
          </button>

          <div className="flex gap-4">
            <button 
              onClick={handleParentAction}
              className="flex-1 py-6 bg-white/10 backdrop-blur-md text-white/70 rounded-[2rem] font-black uppercase text-sm border-4 border-white/20 hover:bg-white/20 transition-all"
            >
              🔒 Parent Upload
            </button>
            <button 
              onClick={() => { stopAllSpeech(); onClose(); }}
              className="flex-1 py-6 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xl border-4 border-white shadow-lg active:scale-95 transition-all"
            >
              Next Adventure ➡️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
