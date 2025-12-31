
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from './components/Layout';
import Mascot from './components/Mascot';
import UnicornGame from './components/UnicornGame';
import MemoryMatch from './components/MemoryMatch';
import BubblePopGame from './components/BubblePopGame';
import MazeGame from './components/MazeGame';
import FidgetGame from './components/FidgetGame';
import FidgetPlay from './components/FidgetPlay';
import TeachingMode from './components/TeachingMode';
import NewWordsGame from './components/NewWordsGame';
import ShapesSidesGame from './components/ShapesSidesGame';
import ThreeDExploreGame from './components/ThreeDExploreGame';
import SpellMeGame from './components/SpellMeGame';
import TalkToFriendsGame from './components/TalkToFriendsGame';
import ArtCanvas from './components/ArtCanvas';
import ClockGame from './components/ClockGame';
import LessonRewardModal from './components/LessonRewardModal';
import { MorningCheckIn } from './components/MorningCheckIn';
import { gemini } from './services/gemini';
import { TaskCategory, TimeSlot, Task, Message, FidgetToy, ActiveGame, Lesson, GameSession, Grade } from './types';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { jsPDF } from "jspdf";

const VOCAB_STORAGE_KEY = 'jadzia_talk_friends_words_v3';
const AUDIO_STORAGE_KEY = 'jadzia_talk_friends_audio_v3';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

const INITIAL_FIDGET_TOYS: FidgetToy[] = [
  { id: 'f1', emoji: '🎆', name: 'Magic Fireworks', cost: 30, unlocked: false, animationClass: 'animate-pop', description: 'Splashes of color when you click!', colorClass: 'from-pink-400 to-red-500' },
  { id: 'f2', emoji: '🌀', name: 'Ocean Spinner', cost: 40, unlocked: false, animationClass: 'animate-bloom', description: 'Spin it fast for whirlpool splashes!', colorClass: 'from-blue-400 to-cyan-500' },
  { id: 'f3', emoji: '🦖', name: 'T-Rex Tangle', cost: 50, unlocked: false, animationClass: 'animate-stomp', description: 'Build your T-Rex skeleton puzzle!', colorClass: 'from-green-400 to-emerald-600' },
  { id: 'f4', emoji: '🦦', name: 'Squishy Otter', cost: 35, unlocked: false, animationClass: 'animate-sway', description: 'Soft and cuddly sea stress ball!', colorClass: 'from-amber-400 to-orange-500' },
  { id: 'f5', emoji: '🧊', name: 'Infinite Cube', cost: 60, unlocked: false, animationClass: 'animate-stretch', description: 'Flip and fold forever!', colorClass: 'from-purple-400 to-indigo-500' },
  { id: 'fidget', emoji: '🎈', name: 'Pop-It Fun (Game)', cost: 100, unlocked: false, description: 'Unlock the Pop-It mini-game for unlimited fun!', colorClass: 'from-cyan-400 to-blue-500', type: 'game' },
];

const ALL_GAME_IDS = [
  { id: 'unicorn-counting', name: 'Counting Fun', icon: '🦄' },
  { id: 'maze', name: 'Coral Maze', icon: '🧜‍♀️' },
  { id: 'memory-match', name: 'Memory Match', icon: '🃏' },
  { id: 'bubble-pop', name: 'Bubble ABCs', icon: '🫧' },
  { id: 'new-words', name: 'New Words', icon: '📚' },
  { id: 'shapes-sides', name: 'Shapes & Sides', icon: '🔶' },
  { id: '3d-explore', name: '3D Shapes', icon: '💎' },
  { id: 'spell-me', name: 'Spell Me', icon: '📝' },
  { id: 'talk-to-friends', name: 'Talk to Friends', icon: '🌍' },
  { id: 'art-canvas', name: 'Magic Canvas', icon: '🎨' },
  { id: 'clock-game', name: 'Clock Master', icon: '⏰' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [totalStars, setTotalStars] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toys, setToys] = useState<FidgetToy[]>(INITIAL_FIDGET_TOYS);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [activeGame, setActiveGame] = useState<ActiveGame>('none');
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isParentMode, setIsParentMode] = useState(false);
  const [showParentLock, setShowParentLock] = useState(false);
  const [parentCodeInput, setParentCodeInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{role: 'user' | 'model', text: string, timestamp: number}[]>([]);
  const [completedTaskForReward, setCompletedTaskForReward] = useState<Task | null>(null);
  const [showMorningCheckIn, setShowMorningCheckIn] = useState(false);
  const [selectedFidget, setSelectedFidget] = useState<FidgetToy | null>(null);
  const [customGameSounds, setCustomGameSounds] = useState<Record<string, string>>({});
  const [nestBg, setNestBg] = useState<string | null>(null);
  const [mascotImg, setMascotImg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customIdeaInput, setCustomIdeaInput] = useState('');
  const [adminSection, setAdminSection] = useState<'lessons' | 'game_sounds' | 'lesson_praise' | 'reports' | 'system' | 'vocab'>('lessons');
  const [isNestActive, setIsNestActive] = useState(false);

  const [vocabList, setVocabList] = useState<any[]>(() => {
    const saved = localStorage.getItem(VOCAB_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [vocabAudioMap, setVocabAudioMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  useEffect(() => {
    localStorage.setItem(VOCAB_STORAGE_KEY, JSON.stringify(vocabList));
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(vocabAudioMap));
  }, [vocabList, vocabAudioMap]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptions]);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem('jadzia_magic_academy_state');
      if (savedState) {
          const data = JSON.parse(savedState);
          if (data) {
            setTasks(Array.isArray(data.tasks) ? data.tasks : []);
            setTotalStars(data.totalStars || 0);
            setToys(Array.isArray(data.fidgetToys) ? data.fidgetToys : INITIAL_FIDGET_TOYS);
            setCustomGameSounds(data.customGameSounds || {});
            setNestBg(data.nestBg || null);
            setMascotImg(data.mascotImg || null);
            setGameSessions(Array.isArray(data.gameSessions) ? data.gameSessions : []);
            setTranscriptions(Array.isArray(data.transcriptions) ? data.transcriptions : []);
          }
      }
    } catch (e) {}
    const lastCheckIn = localStorage.getItem('jadzia_last_checkin');
    if (lastCheckIn !== new Date().toDateString()) setShowMorningCheckIn(true);
  }, []);

  useEffect(() => {
    try {
      const state = { tasks, totalStars, fidgetToys: toys, customGameSounds, nestBg, mascotImg, gameSessions, transcriptions };
      localStorage.setItem('jadzia_magic_academy_state', JSON.stringify(state));
    } catch (e) {}
  }, [totalStars, tasks, toys, customGameSounds, nestBg, mascotImg, gameSessions, transcriptions]);

  const stopAllSpeech = useCallback(() => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
    sourcesRef.current.clear();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    nextStartTimeRef.current = 0;
  }, []);

  const speak = useCallback(async (text: string) => {
    stopAllSpeech();
    setIsSpeaking(true);
    try {
      const audioBase64 = await gemini.textToSpeech(text);
      if (!audioContextOutRef.current || audioContextOutRef.current.state === 'closed') {
        audioContextOutRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextOutRef.current;
      await ctx.resume();
      const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsSpeaking(false);
      sourcesRef.current.add(source);
      source.start(0);
    } catch (e: any) {
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        u.onend = () => setIsSpeaking(false);
        const voices: SpeechSynthesisVoice[] = window.speechSynthesis.getVoices();
        const zira = voices.find(v => v.name.toLowerCase().includes('zira'));
        if (zira) u.voice = zira;
        window.speechSynthesis.speak(u);
      }
    }
  }, [stopAllSpeech]);

  const endLiveSession = useCallback(() => {
    if (liveSessionRef.current) {
      liveSessionRef.current.then((s: any) => { if(s && typeof s.close === 'function') s.close() });
      liveSessionRef.current = null;
    }
    setIsListening(false);
    setIsNestActive(false);
  }, []);

  const startLiveSession = useCallback(async () => {
    if (liveSessionRef.current) return;
    setIsListening(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextOutRef.current = outCtx;
    audioContextInRef.current = inCtx;
    
    try {
      await outCtx.resume();
      await inCtx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob as any }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
            speak("Hi Jadzia! I'm here! Tell me something magic!");
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               if (text && text.trim()) setTranscriptions(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
            }
            if (message.serverContent?.modelTurn?.parts) {
               message.serverContent.modelTurn.parts.forEach(part => {
                 if (part.text && part.text.trim()) setTranscriptions(prev => [...prev, { role: 'model', text: part.text, timestamp: Date.now() }]);
               });
            }
            const audioB64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioB64) {
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(audioB64), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
            }
            if (message.serverContent?.interrupted) stopAllSpeech();
          },
          onclose: () => setIsListening(false),
          onerror: () => setIsListening(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: 'You are EVA. Jadzia is 5 years old. CRITICAL RULES: 1. You use the Kore voice profile (articulate and friendly like Zira). 2. NO internal logic in text output. 3. ALWAYS encourage Jadzia: "Magic takes practice" and "Never give up". 4. Tidy up reminder every 5m: "Jadzia, put all your toys on the floor back in the magic drawer to keep our academy beautiful!". 5. Hygiene reminder: "Remember to take bathroom breaks! Wipe, flush, and wash your hands with bubbly soap!". 6. If Jadzia is quiet, say: "Speak loudly and clearly like a big girl so I can hear your magic!". 7. Use South African spelling.'
        }
      });
      liveSessionRef.current = sessionPromise;
    } catch (e) { 
      setIsListening(false);
      setIsNestActive(false);
    }
  }, [stopAllSpeech, speak]);

  const handleGoHome = () => {
    endLiveSession();
    stopAllSpeech();
    setActiveGame('none');
    setCurrentLesson(null);
    setActiveTab('schedule');
  };

  const handleBulkSoundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: any) => {
      const fileName = file.name.toLowerCase().split('.')[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const gameMatch = ALL_GAME_IDS.find(g => g.id === fileName);
        const toyMatch = toys.find(t => t.id === fileName);
        if (gameMatch || toyMatch) {
          const id = gameMatch?.id || toyMatch?.id;
          if (id) setCustomGameSounds(prev => ({ ...prev, [id]: base64 }));
        }
        const vocabMatch = vocabList.find(v => v.target.toLowerCase() === fileName);
        if (vocabMatch) {
          setVocabAudioMap(prev => ({ ...prev, [vocabMatch.id]: base64 }));
        }
      };
      reader.readAsDataURL(file);
    });
    speak("Bulk magic sound synchronization complete!");
  };

  const handleMascotClickToNest = () => {
    setActiveTab('tutor');
    setIsNestActive(true);
    startLiveSession();
  };

  const handleManualWakeUp = async () => {
    if (audioContextInRef.current) {
        await audioContextInRef.current.resume();
        speak("My ears are open, Jadzia! I'm listening!");
    } else {
        startLiveSession();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        return (
          <div className="flex flex-col gap-8">
            {/* EVA Greeting Section */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-[5rem] p-10 border-[10px] border-white shadow-2xl flex items-center justify-between overflow-hidden relative group">
                <div className="relative z-10 space-y-4 max-w-xl">
                    <h2 className="text-white font-black text-5xl uppercase tracking-tighter leading-tight drop-shadow-lg">Good Morning, Jadzia! ✨</h2>
                    <p className="text-pink-100 font-bold text-xl uppercase tracking-widest">Ready for a magical day? Click me to talk!</p>
                    <button 
                        onClick={handleMascotClickToNest}
                        className="bg-white text-purple-600 px-10 py-4 rounded-full font-black uppercase text-sm border-4 border-purple-200 shadow-xl active:scale-95 transition-all mt-4"
                    >
                        Talk to Eva Now 🧜‍♀️
                    </button>
                </div>
                <div className="relative z-10 transform scale-75 md:scale-90 -mr-10 md:mr-0 transition-transform hover:scale-100 cursor-pointer" onClick={handleMascotClickToNest}>
                   <Mascot isSpeaking={isSpeaking} isListening={isListening} customImage={mascotImg} />
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {tasks.length === 0 ? (
                  <div className="col-span-full py-20 text-center animate-pop">
                      <p className="text-4xl font-black text-pink-200 uppercase tracking-tighter">Magic Map Empty! 🗺️</p>
                  </div>
              ) : tasks.map(task => (
                <div key={task.id} onClick={() => !task.completed && startLesson(task)} className={`p-10 rounded-[4rem] border-8 transition-all cursor-pointer shadow-2xl ${task.completed ? 'bg-green-50 border-green-200 opacity-60' : 'bg-white border-pink-50 hover:scale-105 active:scale-95'}`}>
                  <div className="flex justify-between mb-6">
                    <span className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs font-black uppercase">{task.category}</span>
                    {task.completed && <span className="text-2xl">✅</span>}
                  </div>
                  <h3 className="text-2xl font-black text-purple-900 uppercase leading-tight mb-6">{task.title}</h3>
                  <div className="flex justify-between items-center mt-auto border-t-2 border-pink-50 pt-4">
                    <span className="text-green-600 font-black text-xl">R{task.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'tutor':
        return (
          <div 
            className="fixed inset-0 top-[180px] z-[10] bg-center transition-all duration-1000 bg-black"
            style={{ 
              backgroundImage: nestBg ? `url(${nestBg})` : 'linear-gradient(to bottom, #00b4d8, #03045e)',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/10 backdrop-blur-[0px]"></div>
            
            {!isNestActive && (
              <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-6 bg-black/30 backdrop-blur-md">
                 <div className="mb-10 transform scale-110 cursor-pointer" onClick={() => { setIsNestActive(true); startLiveSession(); }}>
                    <Mascot isSpeaking={false} isListening={false} customImage={mascotImg} />
                 </div>
                 <button 
                  onClick={() => { setIsNestActive(true); startLiveSession(); }}
                  className="bg-cyan-500 text-white px-16 py-8 rounded-[3rem] font-black text-4xl shadow-[0_20px_0_#0891b2] border-8 border-white hover:scale-110 active:scale-95 active:translate-y-4 active:shadow-none transition-all uppercase tracking-tighter animate-bounce"
                 >
                   Join the Nest 🐚
                 </button>
                 <p className="mt-10 text-white font-black text-xl uppercase tracking-widest drop-shadow-lg animate-pulse">Click Eva to talk!</p>
              </div>
            )}

            <div className="relative h-full w-full flex flex-col p-4 overflow-hidden">
                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-44 px-4 md:px-44 lg:px-80 pt-6">
                   {transcriptions.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-white/40 italic font-black text-center text-3xl leading-tight uppercase tracking-tighter">
                       <div className="w-40 h-40 rounded-full border-8 border-white/20 mb-8 animate-pulse flex items-center justify-center">
                          <span className="text-6xl">🧜‍♀️</span>
                       </div>
                       "Hi Jadzia! Tell me something magic!"
                     </div>
                   ) : transcriptionHistoryView()}
                   <div ref={transcriptEndRef} />
                </div>

                {/* Manual "Tap to Talk" Trigger */}
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-4">
                    <button 
                      onClick={handleManualWakeUp}
                      className={`w-32 h-32 rounded-full border-8 border-white shadow-2xl flex items-center justify-center text-5xl transition-all active:scale-90 ${isListening ? 'bg-cyan-500 animate-pulse' : 'bg-white/20 backdrop-blur-md opacity-60'}`}
                    >
                      {isListening ? '🎙️' : '💤'}
                    </button>
                    <p className="text-white font-black uppercase text-xs tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/20">
                        {isListening ? 'Eva is Hearing You!' : 'Tap to Wake Up Ears!'}
                    </p>
                </div>

                <div className="fixed bottom-10 left-10 z-[100] flex items-center gap-4 bg-white/10 backdrop-blur-3xl border-2 border-white/20 p-4 rounded-full shadow-2xl">
                   <div className={`w-10 h-10 rounded-full ${isListening ? 'bg-cyan-400 animate-ping' : 'bg-white/20'}`}></div>
                   <p className="text-white font-black uppercase text-[10px] tracking-widest">
                     {isListening ? "Eva is Listening..." : "Nest Connected"}
                   </p>
                </div>
            </div>
          </div>
        );
      case 'games':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {ALL_GAME_IDS.map(game => (
              <button key={game.id} onClick={() => setActiveGame(game.id as ActiveGame)} className="bg-white p-10 rounded-[5rem] border-8 border-pink-50 hover:scale-110 active:scale-95 transition-all shadow-2xl flex flex-col items-center gap-4">
                <span className="text-7xl block animate-bounce-slow">{(game as any).icon}</span>
                <span className="text-xs font-black text-purple-900 uppercase tracking-tighter">{game.name}</span>
              </button>
            ))}
          </div>
        );
      case 'rewards':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {toys.map(toy => (
              <div key={toy.id} className={`p-10 rounded-[5rem] border-8 shadow-2xl transition-all ${toy.unlocked ? 'bg-white border-pink-100' : 'bg-gray-50 border-gray-100 grayscale opacity-50'}`}>
                <div className="text-8xl mb-6 text-center">{toy.emoji}</div>
                <h3 className="text-2xl font-black text-center mb-6 uppercase text-purple-900">{toy.name}</h3>
                <button 
                  onClick={() => {
                    if (toy.unlocked) { 
                      if (toy.type === 'game') setActiveGame(toy.id as ActiveGame);
                      else { setSelectedFidget(toy); setActiveGame('fidget-play'); }
                    } else if (totalStars >= toy.cost) {
                      setTotalStars(s => s - toy.cost);
                      setToys(t => t.map(x => x.id === toy.id ? { ...x, unlocked: true } : x));
                      speak(`Wonderful! The ${toy.name} is yours!`);
                    } else { speak(`Keep learning for more stars!`); }
                  }}
                  className={`w-full py-6 rounded-[2.5rem] font-black text-lg border-4 border-white shadow-xl ${toy.unlocked ? 'bg-pink-500 text-white' : 'bg-[#10b981] text-white'}`}
                >
                  {toy.unlocked ? 'PLAY' : `BUY R${toy.cost}`}
                </button>
              </div>
            ))}
          </div>
        );
      case 'parent-admin':
        return (
          <div className="space-y-10 animate-pop">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-8 border-purple-100 pb-10">
              <h2 className="text-5xl font-black text-purple-900 uppercase tracking-tighter">Parent Portal 🛠️</h2>
              <div className="flex flex-wrap gap-4">
                {(['lessons', 'vocab', 'game_sounds', 'lesson_praise', 'reports', 'system'] as const).map(sec => (
                    <button 
                      key={sec} 
                      onClick={() => setAdminSection(sec)} 
                      className={`px-10 py-4 rounded-full font-black text-xs uppercase transition-all shadow-xl border-4 ${adminSection === sec ? 'bg-purple-900 text-white border-white scale-110' : 'bg-purple-100 text-purple-900 border-purple-300'}`}
                    >
                        {sec === 'game_sounds' ? '🎵 Sounds' : sec === 'lesson_praise' ? '🎁 Praise' : sec === 'vocab' ? '🔤 Vocab' : sec.replace('_', ' ')}
                    </button>
                ))}
              </div>
            </div>

            {adminSection === 'vocab' && (
               <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-3xl font-black text-purple-900 uppercase">Word Manager 🔤</h3>
                    <button 
                      onClick={() => {
                        const newWord = { id: Date.now().toString(), target: '', english: '', lang: 'Afrikaans', icon: '✨', color: 'bg-blue-400' };
                        setVocabList([...vocabList, newWord]);
                      }}
                      className="bg-emerald-600 text-white px-10 py-4 rounded-full font-black text-xs uppercase border-4 border-white shadow-xl"
                    >
                      Add New Word ➕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto no-scrollbar pr-4">
                    {vocabList.map(v => (
                      <div key={v.id} className="p-8 bg-purple-50 rounded-[3rem] border-4 border-white shadow-sm flex flex-col md:flex-row gap-6 items-center">
                        <input value={v.icon} onChange={e => setVocabList(prev => prev.map(x => x.id === v.id ? {...x, icon: e.target.value} : x))} className="w-16 h-16 text-2xl text-center bg-white rounded-2xl border-2 border-purple-100" />
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                          <input placeholder="Word" value={v.target} onChange={e => setVocabList(prev => prev.map(x => x.id === v.id ? {...x, target: e.target.value} : x))} className="p-3 bg-white rounded-xl border-2 border-purple-100 font-black text-xs" />
                          <input placeholder="Meaning" value={v.english} onChange={e => setVocabList(prev => prev.map(x => x.id === v.id ? {...x, english: e.target.value} : x))} className="p-3 bg-white rounded-xl border-2 border-purple-100 font-black text-xs" />
                          <input placeholder="Lang" value={v.lang} onChange={e => setVocabList(prev => prev.map(x => x.id === v.id ? {...x, lang: e.target.value} : x))} className="p-3 bg-white rounded-xl border-2 border-purple-100 font-black text-xs" />
                        </div>
                        <div className="flex gap-2">
                           <input type="file" id={`v-${v.id}`} className="hidden" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setVocabAudioMap(prev => ({ ...prev, [v.id]: r.result as string })); speak("Clip saved!"); }; r.readAsDataURL(f); } }} />
                           <label htmlFor={`v-${v.id}`} className={`px-6 py-3 rounded-full font-black text-[10px] uppercase cursor-pointer border-2 ${vocabAudioMap[v.id] ? 'bg-indigo-600 text-white border-white' : 'bg-white text-indigo-400 border-indigo-100'}`}>{vocabAudioMap[v.id] ? "🔊 Change" : "➕ Audio"}</label>
                           <button onClick={() => setVocabList(prev => prev.filter(x => x.id !== v.id))} className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full font-black border-2 border-rose-200">X</button>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>
            )}

            {adminSection === 'lessons' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-8">
                        <h3 className="text-2xl font-black text-purple-900 uppercase">Weekly Curriculum</h3>
                        <button onClick={() => { setIsGenerating(true); gemini.generateWeeklyCurriculum().then(res => { setTasks(res.map((t: any, i: number) => ({ ...t, id: `g-${Date.now()}-${i}`, completed: false }))); setIsGenerating(false); speak("Academy updated!"); }); }} disabled={isGenerating} className="w-full py-10 bg-purple-900 text-white rounded-[3rem] font-black uppercase border-4 border-white shadow-xl text-xl">Generate Full Week 🪄</button>
                    </div>
                    <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-8">
                        <h3 className="text-2xl font-black text-purple-900 uppercase">Quick Lesson Creation</h3>
                        <textarea 
                          value={customIdeaInput} 
                          onChange={(e) => setCustomIdeaInput(e.target.value)} 
                          placeholder="Topic e.g. Exploring the Garden" 
                          className="w-full h-32 p-8 bg-white text-black rounded-[3rem] outline-none border-8 border-black font-black text-2xl shadow-inner placeholder:text-gray-400" 
                        />
                        <button onClick={async () => { if (!customIdeaInput.trim()) return; setIsGenerating(true); const t = await gemini.generateLessonFromPrompt(customIdeaInput); setTasks(p => [...p, {...t, id: `c-${Date.now()}`, completed: false}]); setCustomIdeaInput(''); setIsGenerating(false); }} className="w-full py-6 bg-emerald-700 text-white rounded-[3rem] font-black uppercase border-4 border-white shadow-xl">Create ✨</button>
                    </div>
                </div>
            )}

            {adminSection === 'game_sounds' && (
                <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <h3 className="text-3xl font-black text-purple-900 uppercase">Game Soundboard</h3>
                      <div className="flex items-center gap-4">
                         <input type="file" id="bulk-sounds" className="hidden" multiple accept="audio/*" onChange={handleBulkSoundUpload} />
                         <label htmlFor="bulk-sounds" className="bg-emerald-600 text-white px-10 py-4 rounded-full font-black text-xs uppercase cursor-pointer border-4 border-white shadow-xl hover:scale-105 transition-all">Bulk Upload Sounds 📦</label>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 italic">Tip: Name files like 'maze.mp3' or 'hallo.mp3' to bulk match!</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {[...ALL_GAME_IDS, ...toys].map(item => (
                            <div key={item.id} className="p-6 bg-purple-50 rounded-[3rem] border-4 border-white flex flex-col items-center gap-4 relative shadow-sm">
                                <span className="text-5xl">{(item as any).emoji || (item as any).icon}</span>
                                <input type="file" id={`s-${item.id}`} className="hidden" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setCustomGameSounds(p => ({ ...p, [item.id]: r.result as string })); speak("Sound saved!"); }; r.readAsDataURL(f); } }} />
                                <label htmlFor={`s-${item.id}`} className={`w-full py-2 rounded-2xl font-black text-[9px] uppercase text-center cursor-pointer border-2 shadow-sm transition-all active:scale-95 ${customGameSounds[item.id] ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-white text-purple-900 border-purple-100'}`}>{customGameSounds[item.id] ? "CHANGE" : "UPLOAD"}</label>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {adminSection === 'lesson_praise' && (
                <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-10">
                    <h3 className="text-3xl font-black text-purple-900 uppercase">Magic Reward Clips</h3>
                    <div className="grid grid-cols-1 gap-6 max-h-[500px] overflow-y-auto no-scrollbar pr-4">
                        {tasks.map(t => (
                            <div key={t.id} className="flex items-center justify-between p-8 bg-purple-50 rounded-[3rem] border-4 border-white shadow-sm">
                                <div>
                                    <p className="font-black text-purple-900 uppercase text-xl leading-none mb-2">{t.title}</p>
                                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">{t.category}</p>
                                </div>
                                <div className="flex gap-4">
                                    <input type="file" id={`r-${t.id}`} className="hidden" accept="audio/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setTasks(prev => prev.map(x => x.id === t.id ? { ...x, parentFeedback: r.result as string } : x)); speak("Praise clip ready!"); }; r.readAsDataURL(f); } }} />
                                    <label htmlFor={`r-${t.id}`} className={`px-10 py-5 rounded-full font-black text-sm uppercase cursor-pointer border-4 shadow-xl transition-all active:scale-95 ${t.parentFeedback ? 'bg-emerald-700 text-white border-emerald-400' : 'bg-white text-purple-800 border-purple-100'}`}>
                                        {t.parentFeedback ? "Change Reward 🔊" : "Upload Reward 📁"}
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {adminSection === 'system' && (
                <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-12">
                    <h3 className="text-2xl font-black text-purple-900 uppercase text-center">Academy Visuals</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Nest Background Upload */}
                        <div className="p-10 bg-indigo-50 rounded-[4rem] border-4 border-white text-center space-y-8">
                            <span className="text-8xl block">🖼️</span>
                            <input type="file" id="nest-bg" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setNestBg(r.result as string); speak("Background magic complete!"); }; r.readAsDataURL(f); } }} />
                            <label htmlFor="nest-bg" className="block w-full py-10 bg-indigo-900 text-white rounded-[3rem] font-black uppercase cursor-pointer border-4 border-white shadow-2xl text-xl">Upload Nest Background</label>
                            {nestBg && <button onClick={() => setNestBg(null)} className="text-indigo-400 font-black uppercase text-xs underline">Reset Background</button>}
                        </div>

                        {/* Mascot Image Upload */}
                        <div className="p-10 bg-pink-50 rounded-[4rem] border-4 border-white text-center space-y-8">
                            <span className="text-8xl block">🧜‍♀️</span>
                            <input type="file" id="mascot-img" className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setMascotImg(r.result as string); speak("Mermaid transformation complete!"); }; r.readAsDataURL(f); } }} />
                            <label htmlFor="mascot-img" className="block w-full py-10 bg-pink-600 text-white rounded-[3rem] font-black uppercase cursor-pointer border-4 border-white shadow-2xl text-xl">Upload Mermaid Character</label>
                            {mascotImg && <button onClick={() => setMascotImg(null)} className="text-pink-400 font-black uppercase text-xs underline">Reset to Magic EVA</button>}
                        </div>
                    </div>
                </div>
            )}

            {adminSection === 'reports' && (
                <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-10 text-center">
                    <h3 className="text-3xl font-black text-purple-900 uppercase">Academy Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <button onClick={() => { generatePDFReport(); speak("Growth report ready!"); }} className="bg-rose-50 p-12 rounded-[4rem] border-4 border-white flex flex-col items-center gap-8 shadow-2xl active:scale-95 transition-all"><span className="text-9xl">📊</span><span className="w-full py-8 bg-rose-900 text-white rounded-[3rem] font-black uppercase border-4 border-white text-xl">Download PDF Report</span></button>
                       <button onClick={() => { generatePDFTranscriptOnly(); speak("Chat transcript ready!"); }} className="bg-cyan-50 p-12 rounded-[4rem] border-4 border-white flex flex-col items-center gap-8 shadow-2xl active:scale-95 transition-all"><span className="text-9xl">💬</span><span className="w-full py-8 bg-cyan-900 text-white rounded-[3rem] font-black uppercase border-4 border-white text-xl">Download Transcript</span></button>
                    </div>
                </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  const transcriptionHistoryView = () => {
    return transcriptions.map((log, i) => (
      <div key={i} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'} animate-pop w-full`}>
        <div className={`max-w-[70%] md:max-w-[40%] px-5 py-3 rounded-[2rem] shadow-xl relative border-2 ${
          log.role === 'user' ? 'bg-purple-600 text-white border-purple-400 rounded-tr-none' : 'bg-white/95 text-purple-900 border-white rounded-tl-none'
        }`}>
          <span className={`absolute -top-6 ${log.role === 'user' ? '-right-3' : '-left-3'} text-3xl`}>{log.role === 'user' ? '👧' : '🧜‍♀️'}</span>
          <p className="text-sm md:text-base font-black leading-tight tracking-tight">
            {log.role === 'model' ? `Eva: "${log.text}"` : `Jadzia: "${log.text}"`}
          </p>
          <span className="text-[8px] opacity-40 block mt-1 font-bold uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    ));
  }

  const startLesson = async (task: Task) => {
    setIsGenerating(true);
    try {
      const lesson = await gemini.generateLesson(task.title, task.category);
      if (lesson) {
        setCurrentLesson(lesson);
      } else {
        speak("Oh! The magic book is a bit stuck. Let's try once more!");
      }
    } catch (e) { 
      speak("Try again soon!"); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleTaskComplete = (task: Task, grade: Grade = 'Diamond') => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true, grade, completionTimestamp: Date.now() } : t));
    setTotalStars(prev => prev + task.points);
    setCompletedTaskForReward(task);
  };

  const recordGamePerformance = (gameId: string, score: number, timeTaken: number, errors: number) => {
    setGameSessions(prev => [...prev, { gameId, timestamp: Date.now(), score, timeTaken, errors }]);
  };

  const verifyParentCode = () => {
    if (parentCodeInput === '2806') { 
      setIsParentMode(true); 
      setShowParentLock(false); 
      setParentCodeInput(''); 
      setActiveTab('parent-admin'); 
      speak("Access granted."); 
    } 
    else { 
      speak("Wrong magic code!"); 
      setParentCodeInput(''); 
    }
  };

  const generatePDFTranscriptOnly = () => {
    const doc = new jsPDF();
    doc.text("Jadzia Nest Transcript", 20, 20);
    let y = 40;
    transcriptions.forEach(log => {
      const line = `${new Date(log.timestamp).toLocaleTimeString()} ${log.role === 'user' ? 'JADZIA' : 'EVA'}: ${log.text}`;
      const splitText = doc.splitTextToSize(line, 170);
      doc.text(splitText, 20, y);
      y += (splitText.length * 5) + 3;
      if (y > 280) { doc.addPage(); y = 20; }
    });
    doc.save(`Transcript_${Date.now()}.pdf`);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.text("Academic Growth Report", 20, 20);
    doc.save(`Report_${Date.now()}.pdf`);
  };

  return (
    <Layout 
      activeTab={activeTab} setActiveTab={setActiveTab} totalStars={totalStars} 
      onParentClick={() => isParentMode ? setIsParentMode(false) : setShowParentLock(true)} 
      onQuitClick={() => window.location.reload()} onGoHome={handleGoHome} 
      isParentMode={isParentMode} stopAllSpeech={stopAllSpeech} speak={speak} 
      hideNav={activeGame !== 'none' || currentLesson !== null || showMorningCheckIn || (activeTab === 'tutor' && isNestActive)}
    >
      {showMorningCheckIn ? <MorningCheckIn onComplete={(r) => { setTotalStars(s => s + r); setShowMorningCheckIn(false); localStorage.setItem('jadzia_last_checkin', new Date().toDateString()); speak("Good morning Jadzia!"); }} speak={speak} /> : 
       activeGame !== 'none' ? (
        <div className="relative z-50">
          {activeGame === 'unicorn-counting' && <UnicornGame onComplete={(r, t, e) => { recordGamePerformance('unicorn', r, t, e); setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['unicorn-counting']} />}
          {activeGame === 'memory-match' && <MemoryMatch onComplete={(r, t, e) => { recordGamePerformance('memory', r, t, e); setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} parentSound={customGameSounds['memory-match']} />}
          {activeGame === 'bubble-pop' && <BubblePopGame onComplete={(r, t, e) => { recordGamePerformance('bubble', r, t, e); setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['bubble-pop']} />}
          {activeGame === 'maze' && <MemoryMatch onComplete={(r, t, e) => { recordGamePerformance('maze', r, t, e); setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} parentSound={customGameSounds['maze']} />}
          {activeGame === 'fidget' && <FidgetGame onComplete={(r, t, e) => { recordGamePerformance('fidget', r, t, e); setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} parentSound={customGameSounds['fidget']} />}
          {activeGame === 'new-words' && <NewWordsGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['new-words']} />}
          {activeGame === 'shapes-sides' && <ShapesSidesGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['shapes-sides']} />}
          {activeGame === '3d-explore' && <ThreeDExploreGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['3d-explore']} />}
          {activeGame === 'spell-me' && <SpellMeGame onComplete={(r, t, e) => { recordGamePerformance('spell', r, t, e); setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['spell-me']} />}
          {activeGame === 'talk-to-friends' && <TalkToFriendsGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['talk-to-friends']} vocabList={vocabList} vocabAudioMap={vocabAudioMap} />}
          {activeGame === 'art-canvas' && <ArtCanvas onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['art-canvas']} />}
          {activeGame === 'clock-game' && <ClockGame onComplete={(r, t, e) => { recordGamePerformance('clock', r, t, e); setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['clock-game']} />}
          {activeGame === 'fidget-play' && selectedFidget && <FidgetPlay toy={selectedFidget} onCancel={() => setActiveGame('none')} stopAllSpeech={stopAllSpeech} parentSound={customGameSounds[selectedFidget.id]} />}
        </div>
      ) : currentLesson ? <TeachingMode lesson={currentLesson} onComplete={(grade) => { const t = tasks.find(x => x.title === currentLesson.subject); if (t) handleTaskComplete(t, grade); setCurrentLesson(null); }} onCancel={() => setCurrentLesson(null)} speak={speak} stopAllSpeech={stopAllSpeech} /> : renderTabContent()}

      {showParentLock && (
        <div className="fixed inset-0 z-[20000] bg-[#2e1065]/95 backdrop-blur-xl flex items-center justify-center p-6 animate-pop">
          <div className="bg-white p-16 rounded-[5rem] w-full max-md text-center border-[12px] border-white shadow-2xl">
            <h3 className="text-4xl font-black text-[#2e1065] uppercase mb-4">Parent Portal</h3>
            <p className="text-sm font-bold text-gray-400 mb-8 uppercase tracking-widest">Enter code 2806 to unlock</p>
            <input type="password" value={parentCodeInput} onChange={(e) => setParentCodeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyParentCode()} placeholder="****" className="w-full p-8 bg-purple-50 rounded-[2.5rem] text-center text-5xl font-black outline-none border-4 border-purple-100 mb-10 text-purple-900 shadow-inner" autoFocus />
            <div className="flex gap-4">
              <button onClick={() => { setShowParentLock(false); setParentCodeInput(''); }} className="flex-1 py-6 bg-gray-100 text-gray-500 rounded-full font-black uppercase border-2 border-gray-200">Cancel</button>
              <button onClick={verifyParentCode} className="flex-1 py-6 bg-purple-900 text-white rounded-full font-black uppercase border-4 border-white shadow-xl">Verify</button>
            </div>
          </div>
        </div>
      )}

      {isGenerating && <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[9999] flex flex-col items-center justify-center text-center"><div className="animate-spin text-9xl mb-10">🧜‍♀️</div><p className="font-black text-pink-400 uppercase text-6xl">EVA IS CASTING A SPELL...</p></div>}
      {completedTaskForReward && <LessonRewardModal task={completedTaskForReward} existingAudio={completedTaskForReward.parentFeedback} onClose={() => setCompletedTaskForReward(null)} onSaveAudio={(b) => { setTasks(prev => prev.map(t => t.id === completedTaskForReward.id ? { ...t, parentFeedback: b } : t)); speak("Praise Saved!"); }} speak={speak} stopAllSpeech={stopAllSpeech} isSpeaking={isSpeaking} mascotImg={mascotImg} />}
    </Layout>
  );
}
