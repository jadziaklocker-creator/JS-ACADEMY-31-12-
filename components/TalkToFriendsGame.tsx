
import React, { useState, useRef, useEffect } from 'react';
import { gemini } from '../services/gemini';

interface VocabItem {
  target: string;
  english: string;
  lang: string;
  icon: string;
  color: string;
}

const STORAGE_KEY_WORDS = 'jadzia_talk_friends_words';
const STORAGE_KEY_AUDIO = 'jadzia_talk_friends_audio';

const FALLBACK_VOCAB: VocabItem[] = [
  { target: 'Hallo', english: 'Hello', lang: 'Afrikaans', icon: '👋', color: 'bg-orange-400' },
  { target: 'Sawubona', english: 'Hello', lang: 'isiZulu', icon: '🙏', color: 'bg-emerald-400' },
  { target: 'Dankie', english: 'Thank you', lang: 'Afrikaans', icon: '❤️', color: 'bg-blue-400' },
  { target: 'Ngiyabonga', english: 'Thank you', lang: 'isiZulu', icon: '✨', color: 'bg-pink-400' },
];

export default function TalkToFriendsGame({ onComplete, onCancel, speak, parentSound }: { onComplete: (r: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string }) {
  const [selected, setSelected] = useState<VocabItem | null>(null);
  const [vocabList, setVocabList] = useState<VocabItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_WORDS);
    return saved ? JSON.parse(saved) : FALLBACK_VOCAB;
  });
  const [recordedAudioMap, setRecordedAudioMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIO);
    return saved ? JSON.parse(saved) : {};
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const PARENT_PASSWORD = '2806';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WORDS, JSON.stringify(vocabList));
  }, [vocabList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_AUDIO, JSON.stringify(recordedAudioMap));
  }, [recordedAudioMap]);

  useEffect(() => {
    const addNewWord = async () => {
      if (vocabList.length > 20) return;
      setIsLoading(true);
      try {
        const existingTargets = vocabList.map(v => v.target);
        const newWord = await gemini.generateVocabWord(existingTargets);
        setVocabList(prev => {
          if (prev.find(p => p.target.toLowerCase() === newWord.target.toLowerCase())) return prev;
          return [...prev, newWord];
        });
      } catch (err) {
        console.error("Failed to add new word:", err);
      } finally {
        setIsLoading(false);
      }
    };
    addNewWord();
  }, []);

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const playRecorded = (word: string) => {
    const audioData = recordedAudioMap[word];
    if (audioData) {
      const audio = new Audio(audioData);
      audio.play().catch(e => console.error("Audio playback failed", e));
      return true;
    }
    return false;
  };

  const handleHover = (item: VocabItem) => {
    const wasPlayed = playRecorded(item.target);
    if (!wasPlayed) {
      speak(item.target);
    }
  };

  const handleWordClick = (item: VocabItem, e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    setSelected(item);
    speak(`${item.target} means ${item.english}.`);
    new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3').play().catch(() => {});
  };

  const handleUploadRequest = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPassword(true);
    setPasswordInput('');
  };

  const verifyPassword = () => {
    if (passwordInput === PARENT_PASSWORD) {
      setShowPassword(false);
      fileInputRef.current?.click();
    } else {
      speak("Wrong code, parent!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selected) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setRecordedAudioMap(prev => ({ ...prev, [selected.target]: base64String }));
        speak("Magic clip uploaded!");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-cyan-50 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <input 
        type="file" 
        accept="audio/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
      />

      {showPassword && (
        <div className="fixed inset-0 z-[3000] bg-[#03045e]/95 flex items-center justify-center p-6 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white p-12 rounded-[4rem] border-[10px] border-white w-full max-w-md text-center shadow-2xl">
            <h2 className="text-3xl font-black text-[#03045e] uppercase mb-4">Parent Lock</h2>
            <p className="text-sm font-bold text-blue-300 mb-8 uppercase">Enter 2806 to upload clip</p>
            <input 
              type="password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && verifyPassword()}
              placeholder="****" 
              className="w-full p-6 text-center text-4xl font-black border-4 border-gray-100 rounded-3xl mb-8 outline-none text-purple-900" 
              autoFocus 
            />
            <div className="flex gap-4">
              <button onClick={() => setShowPassword(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 rounded-full font-black uppercase">Cancel</button>
              <button onClick={verifyPassword} className="flex-1 py-5 bg-purple-600 text-white rounded-full font-black uppercase">Verify</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-cyan-500 px-8 py-3 rounded-full font-black border-4 border-cyan-100 shadow-lg active:scale-95 transition-all">Back to School 🏫</button>
        <div className="flex flex-col items-center pointer-events-none">
            <h2 className="text-cyan-600 font-black text-2xl uppercase tracking-widest leading-none">Talk to Friends</h2>
            {isLoading && <span className="text-[10px] font-black text-cyan-400 animate-pulse mt-1">NEW WORD LOADING...</span>}
        </div>
        <div className="w-20"></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-5xl overflow-y-auto no-scrollbar pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full">
          {vocabList.map((item, idx) => (
            <button
              key={`${item.target}-${idx}`}
              onMouseEnter={() => handleHover(item)}
              onClick={(e) => handleWordClick(item, e)}
              className={`p-6 rounded-[2.5rem] border-4 flex flex-col items-center justify-center shadow-xl transition-all hover:scale-105 active:scale-95 ${item.color || 'bg-blue-400'} ${selected?.target === item.target ? 'ring-8 ring-white' : 'border-white'}`}
            >
              <div className="relative">
                <span className="text-5xl mb-2 drop-shadow-md">{item.icon || '✨'}</span>
                {recordedAudioMap[item.target] && <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-[12px] text-white shadow-md border-2 border-white animate-bounce">⭐</div>}
              </div>
              <span className="font-black text-white text-sm uppercase text-center break-words w-full">{item.target}</span>
              <span className="text-[9px] font-bold text-white/70 mt-1 uppercase">{item.lang}</span>
            </button>
          ))}
        </div>

        {selected && (
          <div className="p-8 bg-white rounded-[4rem] border-[12px] border-cyan-100 shadow-2xl animate-pop text-center max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-4xl font-black text-cyan-600 mb-2 uppercase">{selected.target}</h3>
            <p className="text-sm font-bold text-cyan-300 uppercase mb-4">{selected.lang} word</p>
            
            <div className="bg-cyan-50 p-4 rounded-3xl border-4 border-white shadow-inner mb-6">
               <p className="text-xs font-black text-cyan-400 uppercase mb-1">Means in English:</p>
               <p className="text-2xl font-black text-cyan-900 uppercase tracking-tighter">{selected.english}</p>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black text-purple-600 uppercase tracking-widest">Parent Audio Clip</p>
              <div className="flex justify-center items-center gap-6">
                <button 
                  onClick={handleUploadRequest}
                  className="w-20 h-20 bg-blue-500 text-white rounded-full flex flex-col items-center justify-center shadow-lg active:scale-90 border-4 border-white"
                >
                  <span className="text-3xl">📁</span>
                  <span className="text-[8px] font-black uppercase">Upload</span>
                </button>
                
                {recordedAudioMap[selected.target] && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); playRecorded(selected.target); }}
                    className="w-20 h-20 bg-green-500 text-white rounded-full flex flex-col items-center justify-center shadow-lg active:scale-90 border-4 border-white"
                  >
                    <span className="text-3xl">▶️</span>
                    <span className="text-[8px] font-black uppercase">Listen</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onComplete(25); }}
        className="mt-6 py-5 px-16 bg-cyan-600 text-white rounded-full font-black text-2xl shadow-lg border-4 border-white active:scale-95 transition-all uppercase shrink-0"
      >
        BAIE DANKIE! 🎉
      </button>
    </div>
  );
}
