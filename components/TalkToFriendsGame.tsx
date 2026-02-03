
import React, { useState, useRef } from 'react';

interface VocabItem {
  id: string;
  target: string;
  english: string;
  lang: string;
  icon: string;
  color: string;
}

interface TalkToFriendsProps {
  onComplete: (r: number) => void;
  onCancel: () => void;
  speak: (t: string) => void;
  parentSound?: string;
  vocabList: VocabItem[];
  vocabAudioMap: Record<string, string>;
  childName: string;
}

export default function TalkToFriendsGame({ onComplete, onCancel, speak, parentSound, vocabList, vocabAudioMap, childName }: TalkToFriendsProps) {
  const [selected, setSelected] = useState<VocabItem | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const PARENT_PASSWORD = '2806';

  const playRecorded = (id: string) => {
    const audioData = vocabAudioMap[id];
    if (audioData) {
      const audio = new Audio(audioData);
      audio.play().catch(e => console.error("Audio playback failed", e));
      return true;
    }
    return false;
  };

  const handleWordClick = (item: VocabItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(item);
    const wasPlayed = playRecorded(item.id);
    if (!wasPlayed) speak(item.target);
    speak(`${item.target} means ${item.english}.`);
  };

  const verifyPassword = () => {
    if (passwordInput === PARENT_PASSWORD) {
      setShowPassword(false);
      setIsAdminMode(true);
      speak("Admin Mode Active.");
    } else {
      speak("Wrong code!");
      setPasswordInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-cyan-50 flex flex-col items-center p-6 animate-pop overflow-hidden">
      {showPassword && (
        <div className="fixed inset-0 z-[3000] bg-[#03045e]/95 flex items-center justify-center p-6 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white p-12 rounded-[4rem] border-[10px] border-white w-full max-w-md text-center shadow-2xl">
            <h2 className="text-3xl font-black text-[#03045e] uppercase mb-4">Parent Portal</h2>
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              className="w-full p-6 text-center text-4xl font-black border-4 border-gray-100 rounded-3xl mb-8 outline-none" 
              autoFocus 
            />
            <div className="flex gap-4">
              <button onClick={() => setShowPassword(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-full font-black uppercase">Cancel</button>
              <button onClick={verifyPassword} className="flex-1 py-5 bg-cyan-600 text-white rounded-full font-black uppercase">Verify</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl flex justify-between items-center mb-10">
        <button onClick={onCancel} className="bg-white text-cyan-500 px-8 py-3 rounded-full font-black border-4 border-cyan-100 shadow-lg uppercase text-xs">Back 🏫</button>
        <div className="text-center">
            <h2 className="text-cyan-600 font-black text-2xl uppercase">Talk to Friends</h2>
        </div>
        <button onClick={() => isAdminMode ? setIsAdminMode(false) : setShowPassword(true)} className={`px-8 py-3 rounded-full font-black border-4 shadow-lg uppercase text-xs ${isAdminMode ? 'bg-orange-500 text-white' : 'bg-white text-orange-400 border-orange-100'}`}>
          {isAdminMode ? 'Exit Admin' : 'Manage Words'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 w-full max-w-5xl">
        {vocabList.map((item) => (
          <button
            key={item.id}
            onClick={(e) => handleWordClick(item, e)}
            className={`w-full p-6 rounded-[2.5rem] border-4 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 ${item.color || 'bg-blue-400'} border-white relative`}
          >
            <span className="text-5xl mb-2">{item.icon || '✨'}</span>
            <span className="font-black text-white text-sm uppercase text-center">{item.target}</span>
            <span className="text-[8px] font-bold text-white/70 uppercase">{item.lang}</span>
            {vocabAudioMap[item.id] && <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-[10px] text-white border-2 border-white shadow-md animate-bounce">🔊</div>}
          </button>
        ))}

        {isAdminMode && (
          <div className="p-6 rounded-[2.5rem] bg-indigo-50 border-4 border-dashed border-indigo-200 flex flex-col items-center justify-center text-center">
             <p className="text-[10px] font-black text-indigo-400 uppercase leading-tight">Manage all words in the<br/>Main Parent Portal!</p>
          </div>
        )}

        {vocabList.length === 0 && (
          <div className="col-span-full py-20 text-center">
             <p className="text-cyan-300 font-black uppercase text-xl">The Magic Box is Empty!<br/><span className="text-sm opacity-60">Ask Parent to add words in Admin.</span></p>
          </div>
        )}
      </div>

      {selected && (
        <div className="mt-10 p-8 bg-white rounded-[4rem] border-[12px] border-cyan-100 shadow-2xl animate-pop text-center max-w-md w-full">
          <h3 className="text-4xl font-black text-cyan-600 uppercase">{selected.target}</h3>
          <p className="text-2xl font-black text-cyan-900 uppercase mt-4">Means: {selected.english}</p>
          {vocabAudioMap[selected.id] && (
             <button onClick={() => playRecorded(selected.id)} className="mt-6 w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white mx-auto">▶️</button>
          )}
        </div>
      )}

      <button onClick={() => onComplete(25)} className="mt-auto mb-6 py-5 px-16 bg-cyan-600 text-white rounded-full font-black text-2xl shadow-lg border-4 border-white active:scale-95 transition-all uppercase">BAIE DANKIE! 🎉</button>
    </div>
  );
}
