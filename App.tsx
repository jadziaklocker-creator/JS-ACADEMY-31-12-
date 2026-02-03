
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
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { jsPDF } from "jspdf";

const STATE_STORAGE_KEY = 'jadzia_magic_academy_state_v8';

interface GenAIBlob {
  data: string;
  mimeType: string;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SA_GRADES = ['Grade R', 'Grade 1', 'Grade 2', 'Grade 3'];

const SAMPLE_TASKS: Task[] = [
  { id: 'sample-1', title: 'The Letter A Adventure', category: 'Literacy (Languages)', completed: false, points: 50, day: 'Monday', week: 1, timeSlot: '08:30 - Sunrise Spells' },
  { id: 'sample-2', title: 'Counting Magic Shells', category: 'Numeracy (Maths)', completed: false, points: 50, day: 'Monday', week: 1, timeSlot: '13:00 - Midday Magic' },
  { id: 'sample-3', title: 'Sharing is Magic', category: 'Social Skills & Empathy', completed: false, points: 50, day: 'Monday', week: 1, timeSlot: '18:30 - Sunset Stories' }
];

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

function createBlob(data: Float32Array): GenAIBlob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

const INITIAL_FIDGET_TOYS: FidgetToy[] = [
  { id: 'f1', emoji: '🎆', name: 'Fireworks', cost: 30, unlocked: false, animationClass: 'animate-pop', description: 'Splashes of color when you click!', colorClass: 'from-pink-400 to-red-500' },
  { id: 'f2', emoji: '🌀', name: 'Ocean Spinner', cost: 40, unlocked: false, animationClass: 'animate-bloom', description: 'Spin it fast for whirlpool splashes!', colorClass: 'from-blue-400 to-cyan-500' },
  { id: 'f3', emoji: '🦖', name: 'T-Rex Tangle', cost: 50, unlocked: false, animationClass: 'animate-stomp', description: 'Build your T-Rex skeleton puzzle!', colorClass: 'from-green-400 to-emerald-600' },
  { id: 'f4', emoji: '🦦', name: 'Squishy Otter', cost: 35, unlocked: false, animationClass: 'animate-sway', description: 'Soft and cuddly sea stress ball!', colorClass: 'from-amber-400 to-orange-500' },
  { id: 'f5', emoji: '🧊', name: 'Infinite Cube', cost: 60, unlocked: false, animationClass: 'animate-stretch', description: 'Flip and fold forever!', colorClass: 'from-purple-400 to-indigo-500' },
  { id: 'fidget', emoji: '🎈', name: 'Pop-It Fun (Game)', cost: 100, unlocked: false, description: 'Unlock the Pop-It mini-game for unlimited fun!', colorClass: 'from-cyan-400 to-blue-500', type: 'game' },
];

const ALL_GAME_IDS = [
  { id: 'unicorn-counting', name: 'Counting Fun', icon: '🦄', desc: 'Find magic unicorns!' },
  { id: 'maze', name: 'Coral Maze', icon: '🧜‍♀️', desc: 'Help EVA through the maze.' },
  { id: 'memory-match', name: 'Memory Match', icon: '🃏', desc: 'Find matching magic pairs.' },
  { id: 'bubble-pop', name: 'Bubble ABCs', icon: '🫧', desc: 'Pop letters to learn.' },
  { id: 'new-words', name: 'New Words', icon: '📚', desc: 'Learn big girl vocabulary.' },
  { id: 'shapes-sides', name: 'Shapes & Sides', icon: '🔶', desc: 'Count sides of shapes.' },
  { id: '3d-explore', name: '3D Shapes', icon: '💎', desc: 'Spin and touch 3D items.' },
  { id: 'spell-me', name: 'Spell Me', icon: '📝', desc: 'Spell simple words.' },
  { id: 'art-canvas', name: 'Magic Canvas', icon: '🎨', desc: 'Paint your masterpiece.' },
  { id: 'clock-game', name: 'Clock Master', icon: '⏰', desc: 'Learn to tell the time.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [totalStars, setTotalStars] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toys, setToys] = useState<FidgetToy[]>(INITIAL_FIDGET_TOYS);
  const [activeGame, setActiveGame] = useState<ActiveGame>('none');
  const [currentLesson, setCurrentLesson] = useState<(Lesson & { taskId: string }) | null>(null);
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
  const [mascotImg, setMascotImg] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customIdeaInput, setCustomIdeaInput] = useState('');
  const [extraRandInput, setExtraRandInput] = useState('');
  const [importCodeInput, setImportCodeInput] = useState('');
  const [adminSection, setAdminSection] = useState<'lessons' | 'game_sounds' | 'lesson_praise' | 'reports' | 'system' | 'profile' | 'knowledge'>('lessons');
  const [isNestActive, setIsNestActive] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  
  const [childName, setChildName] = useState('Jadzia');
  const [gradeLevel, setGradeLevel] = useState('Grade R');
  const [homeAddress, setHomeAddress] = useState('26 Oak Hill');
  const [growthContext, setGrowthContext] = useState('');

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

  // Persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTasks(data.tasks || SAMPLE_TASKS);
        setTotalStars(data.totalStars || 0);
        if (data.fidgetToys && data.fidgetToys.length === INITIAL_FIDGET_TOYS.length) {
          setToys(data.fidgetToys);
        } else {
          setToys(INITIAL_FIDGET_TOYS);
        }
        setCustomGameSounds(data.customGameSounds || {});
        setMascotImg(data.mascotImg || null);
        setTranscriptions(data.transcriptions || []);
        setChildName(data.childName || 'Jadzia');
        setGradeLevel(data.gradeLevel || 'Grade R');
        setHomeAddress(data.homeAddress || '26 Oak Hill');
        setGrowthContext(data.growthContext || '');
      } else {
        setTasks(SAMPLE_TASKS);
      }
    } catch (e) {
      setTasks(SAMPLE_TASKS);
    }
    const lastCheckIn = localStorage.getItem('jadzia_last_checkin');
    if (lastCheckIn !== new Date().toDateString()) setShowMorningCheckIn(true);
  }, []);

  useEffect(() => {
    try {
      const state = { tasks, totalStars, fidgetToys: toys, customGameSounds, mascotImg, transcriptions, childName, gradeLevel, homeAddress, growthContext };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }, [totalStars, tasks, toys, customGameSounds, mascotImg, transcriptions, childName, gradeLevel, homeAddress, growthContext]);

  useEffect(() => { transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [transcriptions]);

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
    if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        const voices = window.speechSynthesis.getVoices();
        const targetVoice = voices.find(v => v.name.toLowerCase().includes('zira')) || voices.find(v => v.name.includes('female')) || voices[0];
        if (targetVoice) utterance.voice = targetVoice;
        utterance.rate = 0.95; utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
    }
  }, [stopAllSpeech]);

  const handleGoHome = useCallback(() => {
    setActiveGame('none');
    setCurrentLesson(null);
    setActiveTab('schedule');
    setShowMorningCheckIn(false);
    if (liveSessionRef.current) {
        liveSessionRef.current.then((s: any) => { if(s?.close) s.close(); });
        liveSessionRef.current = null;
    }
    setIsListening(false);
    setIsNestActive(false);
    stopAllSpeech();
  }, [stopAllSpeech]);

  const startLiveSession = useCallback(async () => {
    if (liveSessionRef.current) return;
    setIsListening(true);
    setIsNestActive(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    audioContextOutRef.current = outCtx; audioContextInRef.current = inCtx;
    
    try {
      await outCtx.resume(); await inCtx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
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
            speak(`Hi ${childName}! I'm Mermaid EVA! How was your magic day?`);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
               const text = message.serverContent.inputTranscription.text;
               if (text?.trim()) setTranscriptions(prev => [...prev, { role: 'user', text, timestamp: Date.now() }]);
            }
            if (message.serverContent?.modelTurn?.parts) {
               message.serverContent.modelTurn.parts.forEach(part => {
                 if (part.text?.trim()) setTranscriptions(prev => [...prev, { role: 'model', text: part.text, timestamp: Date.now() }]);
               });
            }
            const audioB64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioB64) {
              setIsSpeaking(true);
              const buffer = await decodeAudioData(decode(audioB64), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = buffer; source.connect(outCtx.destination);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => { sourcesRef.current.delete(source); if (sourcesRef.current.size === 0) setIsSpeaking(false); };
            }
          },
          onclose: () => setIsListening(false),
          onerror: () => setIsListening(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          inputAudioTranscription: {}, outputAudioTranscription: {},
          systemInstruction: `You are EVA. Friendly mermaid guide for 5yo ${childName} (Grade: ${gradeLevel}) in South Africa. Encouraging.`
        }
      });
      liveSessionRef.current = sessionPromise;
    } catch (e) { setIsListening(false); setIsNestActive(false); }
  }, [speak, childName, gradeLevel]);

  const endLiveSession = () => {
    if (liveSessionRef.current) {
        liveSessionRef.current.then((s: any) => { if(s?.close) s.close(); });
        liveSessionRef.current = null;
    }
    setIsListening(false);
    setIsNestActive(false);
    stopAllSpeech();
  };

  const startLesson = async (task: Task) => {
    setIsGenerating(true);
    try {
      const lessonData = await gemini.generateLesson(task.title, task.category, childName, gradeLevel);
      setCurrentLesson({ ...lessonData, taskId: task.id });
      speak(`Ready for your lesson on ${task.title}? Here we go!`);
    } catch (error) {
      speak("Oh bubbles! Something went wrong. Let's try again in a bit!");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTaskComplete = (task: Task, grade: Grade = 'Diamond', forceComplete?: boolean) => {
    const isNowCompleted = forceComplete !== undefined ? forceComplete : !task.completed;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: isNowCompleted, grade: isNowCompleted ? grade : undefined, completionTimestamp: isNowCompleted ? Date.now() : undefined } : t));
    if (isNowCompleted) { setTotalStars(prev => prev + task.points); setCompletedTaskForReward(task); }
    else { setTotalStars(prev => Math.max(0, prev - task.points)); }
  };

  const generateRebirthBlueprint = () => {
    const prompt = `ACT AS A SENIOR FRONTEND ENGINEER. REBUILD "JADZIA'S MAGIC ACADEMY".
    
    SYSTEM SPECS:
    1. THEME: Mermaid EVA Academy. Pink/Purple Balloon style UI.
    2. SCHEDULE: 5-day week, 3 tasks/day based on SA CAPS Standards.
    3. TUTOR: "EVA's Nest" Live API voice interaction with transcription logs.
    4. PLAY ZONE: 11 games (Counting, Maze, Memory, Spell Me, Art, Clock).
    5. REWARDS: Chest shop for 6 interactive toys: Fireworks, Spinner, T-Rex, Squishy Otter, Cube, Pop-It.
    6. ADMIN: Profile (Name/Grade), Praise Manager (Audio uploads), Growth Reports (PDF), Magic State Sync.
    
    LOGIC: React, TypeScript, Tailwind, Gemini API. LocalStorage persistence.
    
    USE THE PROVIDED SOURCE CODE AS THE MASTER BLUEPRINT.`;
    
    const textArea = document.createElement("textarea");
    textArea.value = prompt;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert("MASTER AI BLUEPRINT COPIED!");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        const filteredTasks = tasks.filter(t => t.day === selectedDay);
        return (
          <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 p-4 rounded-[2.5rem] border-4 border-pink-50 shadow-sm shrink-0">
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {WEEKDAYS.map(day => (
                    <button key={day} onClick={() => setSelectedDay(day)} className={`px-6 py-3 rounded-full font-black text-xs uppercase transition-all ${selectedDay === day ? 'bg-pink-500 text-white shadow-lg scale-105' : 'bg-white text-pink-300'}`}>{day}</button>
                  ))}
               </div>
               {isParentMode && (
                 <div className="flex gap-2">
                   <button onClick={() => setTasks(prev => prev.map(t => t.day === selectedDay ? { ...t, completed: false } : t))} className="bg-rose-500 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase border-2 border-white shadow-md">Reset Day 🔄</button>
                   <button onClick={() => setTasks(prev => prev.map(t => ({ ...t, completed: false })))} className="bg-indigo-600 text-white px-4 py-2 rounded-full font-black text-[10px] uppercase border-2 border-white shadow-md">Reset Week 🔄</button>
                 </div>
               )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
              {filteredTasks.map(task => (
                <div key={task.id} onClick={() => !task.completed && startLesson(task)} className={`p-10 rounded-[4rem] border-8 transition-all cursor-pointer shadow-2xl flex flex-col h-full ${task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-pink-50 hover:scale-[1.02] active:scale-95'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-pink-100 text-pink-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">{task.timeSlot}</span>
                    {task.completed && <span className="text-3xl animate-pop">✅</span>}
                  </div>
                  <h3 className="text-2xl font-black text-purple-900 uppercase leading-tight mb-4 flex-1">{task.title}</h3>
                  <p className="text-xs font-bold text-pink-400 uppercase mb-8">{task.category}</p>
                  {isParentMode ? (
                    <div className="mt-auto pt-6 border-t-2 border-purple-100 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                       <label className="text-[10px] font-black text-purple-600 uppercase">Lesson Grade:</label>
                       <select 
                         value={task.grade || 'Not Graded'} 
                         onChange={(e) => { const g = e.target.value as Grade; setTasks(prev => prev.map(x => x.id === task.id ? {...x, grade: g} : x)); speak(`Graded ${g}!`); }} 
                         className="p-3 bg-white rounded-xl border-4 border-black font-black text-xs uppercase text-black outline-none"
                       >
                         {['Diamond', 'Gold', 'Silver', 'Bronze', 'Keep Trying', 'Not Graded'].map(opt => <option key={opt} value={opt} className="text-black bg-white">{opt}</option>)}
                       </select>
                       <button onClick={() => handleTaskComplete(task, 'Diamond', true)} className="w-full py-4 rounded-full font-black uppercase text-[10px] shadow-lg bg-purple-900 text-white border-4 border-white">Mark Complete ✅</button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-auto border-t-2 border-pink-50 pt-4">
                      <span className="text-green-600 font-black text-xl tracking-tighter">R {task.points}</span>
                      {task.completed && <span className="text-[10px] font-black text-indigo-500 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{task.grade || 'Diamond'}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case 'tutor':
        return (
          <div className="flex flex-col items-center gap-10 py-10 animate-pop h-full">
            {!isNestActive ? (
              <div className="flex flex-col items-center gap-10 mt-10">
                <div className="w-80 h-80 rounded-full bg-white border-[15px] border-purple-100 flex items-center justify-center shadow-2xl relative">
                  <div className="absolute inset-0 bg-purple-400/10 rounded-full animate-ping"></div>
                  <span className="text-9xl">🧜‍♀️</span>
                </div>
                <div className="text-center space-y-4">
                  <h2 className="text-5xl font-black text-purple-900 uppercase tracking-tighter">Enter EVA's Nest</h2>
                  <p className="text-purple-400 font-bold max-w-sm">Share your wonderful discoveries with Mermaid EVA!</p>
                </div>
                <button onClick={startLiveSession} className="py-8 px-20 bg-purple-900 text-white rounded-full font-black text-3xl shadow-[0_15px_0_#2e1065] border-[10px] border-white active:translate-y-4 active:shadow-none transition-all uppercase">Start Talking! 🔊</button>
              </div>
            ) : (
              <div className="w-full max-w-4xl flex flex-col items-center gap-8">
                <Mascot isSpeaking={isSpeaking} isListening={isListening} customImage={mascotImg} />
                <div className="w-full bg-white/50 backdrop-blur-xl p-8 rounded-[4rem] border-[10px] border-white shadow-2xl h-[400px] overflow-y-auto no-scrollbar space-y-4">
                  {transcriptions.map((log, i) => (
                    <div key={i} className={`p-6 rounded-[2rem] max-w-[80%] ${log.role === 'user' ? 'bg-indigo-600 text-white self-end ml-auto' : 'bg-white text-purple-900 self-start border-4 border-purple-100'}`}>
                      <p className="font-black text-lg">{log.text}</p>
                      <p className="text-[10px] opacity-50 font-bold uppercase mt-2 tracking-widest">{log.role === 'user' ? childName : 'EVA'}</p>
                    </div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
                <button onClick={endLiveSession} className="py-4 px-10 bg-rose-600 text-white rounded-full font-black uppercase text-sm border-4 border-white shadow-xl">Quit Nest 🛑</button>
              </div>
            )}
          </div>
        );
      case 'games':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 pb-32 animate-pop">
            {ALL_GAME_IDS.map(game => (
              <div key={game.id} onClick={() => setActiveGame(game.id as ActiveGame)} className="p-8 bg-white rounded-[4rem] border-8 border-pink-50 hover:scale-105 active:scale-95 cursor-pointer shadow-2xl transition-all flex flex-col items-center text-center gap-4">
                <span className="text-7xl">{game.icon}</span>
                <h3 className="text-xl font-black text-purple-900 uppercase leading-none">{game.name}</h3>
                <p className="text-[10px] font-bold text-pink-400 uppercase italic tracking-widest">{game.desc}</p>
              </div>
            ))}
          </div>
        );
      case 'rewards':
        return (
          <div className="flex flex-col gap-10 animate-pop">
            <div className="bg-indigo-600 p-10 rounded-[4rem] border-[10px] border-white shadow-2xl text-center text-white">
               <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">R {totalStars}</h2>
               <p className="text-lg font-black text-indigo-200 uppercase mt-2 tracking-widest">In your Magic Chest</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8 pb-32">
               {toys.map(toy => (
                 <div key={toy.id} onClick={() => { 
                    if(toy.unlocked){ setSelectedFidget(toy); setActiveGame('fidget-play'); } 
                    else if(totalStars >= toy.cost){ 
                        setToys(prev => prev.map(t => t.id === toy.id ? {...t, unlocked: true} : t)); 
                        setTotalStars(s => s - toy.cost); 
                        speak(`Wonderful! You unlocked the ${toy.name}!`); 
                    } 
                 }} className={`p-8 rounded-[4rem] border-8 transition-all cursor-pointer flex flex-col items-center gap-4 text-center ${toy.unlocked ? 'bg-white border-indigo-100 shadow-2xl hover:scale-105 active:scale-95' : 'bg-gray-50 border-gray-200 opacity-60 grayscale'}`}>
                    <span className="text-7xl">{toy.emoji}</span>
                    <h3 className="text-xl font-black text-purple-900 uppercase tracking-tight">{toy.name}</h3>
                    {toy.unlocked ? (
                      <span className="bg-green-100 text-green-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">Play Now ✨</span>
                    ) : (
                      <div className="bg-amber-400 text-white px-8 py-3 rounded-full font-black text-lg border-2 border-white shadow-lg tracking-tighter">Buy: R {toy.cost}</div>
                    )}
                 </div>
               ))}
            </div>
          </div>
        );
      case 'parent-admin':
        return (
          <div className="space-y-10 animate-pop pb-20">
            <div className="flex flex-wrap gap-4 border-b-8 border-purple-100 pb-10">
              {(['lessons', 'profile', 'knowledge', 'game_sounds', 'lesson_praise', 'reports', 'system'] as const).map(sec => (
                <button key={sec} onClick={() => setAdminSection(sec)} className={`px-8 py-4 rounded-full font-black text-xs uppercase transition-all shadow-lg border-4 ${adminSection === sec ? 'bg-purple-900 text-white border-white' : 'bg-purple-100 text-purple-900 border-purple-300'}`}>
                  {sec === 'game_sounds' ? 'Sounds 🎵' : sec === 'lesson_praise' ? 'Praise 🎁' : sec === 'reports' ? 'Reports 📊' : sec.replace('_', ' ')}
                </button>
              ))}
            </div>

            {adminSection === 'reports' && (
              <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-10 text-center">
                  <h3 className="text-4xl font-black text-purple-950 uppercase tracking-tighter">Growth Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <button onClick={() => { const doc = new jsPDF(); doc.text(`${childName}'s Progress`, 20, 20); tasks.filter(t => t.completed).forEach((t, i) => doc.text(`${t.title} - ${t.grade}`, 20, 30 + i * 10)); doc.save('Report.pdf'); }} className="bg-rose-50 p-12 rounded-[4rem] border-4 border-white flex flex-col items-center gap-8 shadow-2xl active:scale-95 transition-all">
                        <span className="text-9xl">📈</span>
                        <span className="w-full py-8 bg-rose-900 text-white rounded-[3rem] font-black uppercase border-4 border-white text-xl">Download PDF Report</span>
                     </button>
                     <button onClick={() => { const doc = new jsPDF(); doc.text(`Chat logs`, 20, 20); transcriptions.forEach((t, i) => doc.text(`${t.role}: ${t.text}`, 20, 30 + i * 10)); doc.save('Transcripts.pdf'); }} className="bg-cyan-50 p-12 rounded-[4rem] border-4 border-white flex flex-col items-center gap-8 shadow-2xl active:scale-95 transition-all">
                        <span className="text-9xl">💬</span>
                        <span className="w-full py-8 bg-cyan-900 text-white rounded-[3rem] font-black uppercase border-4 border-white text-xl">Download Chat History</span>
                     </button>
                  </div>
              </div>
            )}

            {adminSection === 'profile' && (
              <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-10">
                  <h3 className="text-4xl font-black text-purple-950 uppercase tracking-tighter">Learner Settings 🛠️</h3>
                  <div className="space-y-8 max-w-2xl mx-auto">
                    <div className="space-y-3">
                       <label className="font-black text-purple-500 uppercase text-xs ml-6 tracking-widest">Full Name</label>
                       <input value={childName} onChange={(e) => setChildName(e.target.value)} className="w-full p-8 bg-purple-50 rounded-[2.5rem] font-black text-3xl border-4 border-purple-200 text-purple-950 outline-none shadow-inner" />
                    </div>
                    <div className="space-y-3">
                       <label className="font-black text-purple-500 uppercase text-xs ml-6 tracking-widest">School Grade (CAPS)</label>
                       <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full p-8 bg-purple-50 rounded-[2.5rem] font-black text-2xl border-4 border-purple-200 text-purple-950 outline-none cursor-pointer">
                         {SA_GRADES.map(g => <option key={g} value={g} className="bg-white text-black">{g}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <label className="font-black text-purple-500 uppercase text-xs ml-6 tracking-widest">Academy Home Base (Address)</label>
                       <input value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="e.g. 26 Oak Hill" className="w-full p-8 bg-purple-50 rounded-[2.5rem] font-black text-2xl border-4 border-purple-200 text-purple-950 outline-none shadow-inner" />
                    </div>
                    <button onClick={() => speak("Profile updated perfectly!")} className="w-full py-8 bg-purple-900 text-white rounded-[3rem] font-black uppercase text-2xl shadow-xl border-4 border-white">Save Changes ✨</button>
                  </div>
              </div>
            )}

            {adminSection === 'knowledge' && (
              <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-4xl font-black text-purple-950 uppercase tracking-tighter">Knowledge Hub 🧠</h3>
                    <input type="file" multiple id="bulk-reports" className="hidden" onChange={(e) => { speak("Syncing report metadata to Academy memory."); }} />
                    <label htmlFor="bulk-reports" className="bg-indigo-600 text-white px-8 py-4 rounded-full font-black text-xs uppercase border-4 border-white shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all">Bulk Report Sync 📁</label>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-indigo-50 p-8 rounded-[4rem] border-4 border-indigo-100 shadow-inner">
                       <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Past Growth Report Summary (Context for AI)</h4>
                       <textarea value={growthContext} onChange={(e) => setGrowthContext(e.target.value)} placeholder="Paste the content of past reports here to guide future lessons..." className="w-full h-80 bg-white p-8 rounded-[3rem] border-4 border-indigo-100 font-black text-sm text-indigo-900 outline-none shadow-sm" />
                       <p className="mt-4 text-[10px] font-bold text-indigo-400 uppercase tracking-widest italic text-center">Mermaid EVA uses this memory to decide which magic lessons to teach next!</p>
                    </div>
                    <button onClick={() => speak("Academy knowledge updated! The AI will now use this for future lessons.")} className="w-full py-8 bg-indigo-900 text-white rounded-[3rem] font-black uppercase text-2xl shadow-xl border-4 border-white">Update AI Memory ✨</button>
                  </div>
              </div>
            )}

            {adminSection === 'lesson_praise' && (
              <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-8">
                <h3 className="text-4xl font-black text-purple-950 uppercase tracking-tighter">Praise Clips 🎤</h3>
                <div className="grid grid-cols-1 gap-6 max-h-[600px] overflow-y-auto no-scrollbar pr-6">
                  {tasks.map(t => (
                    <div key={t.id} className="p-8 bg-purple-50 rounded-[4rem] border-4 border-white flex justify-between items-center shadow-sm">
                      <div className="space-y-1">
                        <p className="font-black text-purple-950 uppercase text-2xl leading-none">{t.title}</p>
                        <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">{t.day} • {t.category}</p>
                      </div>
                      <input type="file" id={`praise-${t.id}`} className="hidden" accept="audio/*" onChange={(e) => { 
                         const f = e.target.files?.[0]; 
                         if (f) { 
                           const r = new FileReader(); 
                           r.onload = () => { setTasks(prev => prev.map(x => x.id === t.id ? {...x, parentFeedback: r.result as string} : x)); speak("Audio saved!"); }; 
                           r.readAsDataURL(f); 
                         } 
                      }} />
                      <label htmlFor={`praise-${t.id}`} className={`px-10 py-5 rounded-full font-black text-sm uppercase cursor-pointer border-4 shadow-xl transition-all ${t.parentFeedback ? 'bg-green-600 text-white border-white scale-105' : 'bg-white text-purple-950 border-purple-200'}`}>
                        {t.parentFeedback ? "Change Praise 🔊" : "Record Voice 🎤"}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminSection === 'system' && (
              <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-12">
                  <h3 className="text-4xl font-black text-purple-950 uppercase text-center tracking-tighter">Master Portal</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="bg-emerald-50 p-12 rounded-[4rem] border-4 border-white shadow-inner flex flex-col items-center gap-8">
                          <span className="text-9xl">💾</span>
                          <div className="text-center space-y-2">
                             <h4 className="text-2xl font-black text-emerald-950 uppercase leading-none">Lesson Backup</h4>
                             <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Save your current week as a Magic Backup Key to prevent loss.</p>
                          </div>
                          <button onClick={() => { const key = btoa(JSON.stringify({ tasks, totalStars })); navigator.clipboard.writeText(key); speak("Current week saved to your clipboard as a Magic Key!"); }} className="w-full py-8 bg-emerald-900 text-white rounded-[3rem] font-black uppercase border-4 border-white shadow-2xl text-xl">Save Current Week 📋</button>
                      </div>
                      <div className="bg-indigo-50 p-12 rounded-[4rem] border-4 border-white shadow-inner flex flex-col items-center gap-8">
                          <span className="text-9xl">📥</span>
                          <div className="text-center space-y-2">
                             <h4 className="text-2xl font-black text-indigo-950 uppercase leading-none">Sync Magic State</h4>
                             <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Transfer progress, Rand balance, and sounds between devices.</p>
                          </div>
                          <textarea value={importCodeInput} onChange={(e) => setImportCodeInput(e.target.value)} placeholder="Paste Setup Code..." className="w-full h-32 p-6 rounded-3xl border-4 border-white text-xs font-mono shadow-inner outline-none text-black" />
                          <button onClick={() => { try { const d = JSON.parse(atob(importCodeInput)); if(d.childName) setChildName(d.childName); if(d.tasks) setTasks(d.tasks); speak("Magic Sync Complete!"); } catch(e){ alert("Invalid code"); } }} className="w-full py-6 bg-pink-600 text-white rounded-[3rem] font-black uppercase border-4 border-white shadow-xl">Restore State</button>
                      </div>
                  </div>
              </div>
            )}
            
            {adminSection === 'lessons' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-8">
                      <h3 className="text-2xl font-black text-purple-950 uppercase tracking-tighter">Curriculum Engine</h3>
                      <button onClick={async () => { setIsGenerating(true); const res = await gemini.generateWeeklyCurriculum(tasks.map(t => t.title), childName, gradeLevel, growthContext); setTasks(res.map((t: any, i: number) => ({ ...t, id: `g-${Date.now()}-${i}`, completed: false }))); setIsGenerating(false); speak("Weekly map updated using Academy memory!"); }} disabled={isGenerating} className="w-full py-6 bg-purple-900 text-white rounded-[3rem] font-black uppercase border-4 border-white shadow-xl text-lg tracking-widest">Generate Week 🪄</button>
                      <button onClick={async () => { setIsGenerating(true); const res = await gemini.generateDailyCurriculum(selectedDay, tasks.map(t => t.title), childName, gradeLevel, growthContext); const newDaily = res.map((t: any, i: number) => ({ ...t, id: `d-${Date.now()}-${i}`, completed: false, day: selectedDay })); setTasks(prev => [...prev.filter(t => t.day !== selectedDay), ...newDaily]); setIsGenerating(false); speak(`Today's map updated using Academy memory!`); }} disabled={isGenerating} className="w-full py-6 bg-emerald-600 text-white rounded-[3rem] font-black uppercase border-4 border-white shadow-xl text-lg tracking-widest">Generate Today 🪄</button>
                      <div className="pt-6 border-t-4 border-purple-50 text-center">
                        <h4 className="text-sm font-black text-purple-950 uppercase mb-4">Manual Rand Grant</h4>
                        <input type="number" value={extraRandInput} onChange={(e) => setExtraRandInput(e.target.value)} placeholder="0" className="w-full p-4 bg-purple-50 rounded-2xl border-4 border-white text-center font-black text-2xl text-purple-950 shadow-inner" />
                        <button onClick={() => { setTotalStars(s => s + Number(extraRandInput)); setExtraRandInput(''); speak(`Granted extra Rand!`); }} className="w-full py-4 bg-emerald-700 text-white rounded-[2rem] font-black uppercase shadow-xl mt-4 border-2 border-white">Add Bonus 💎</button>
                      </div>
                  </div>
                  <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-8">
                      <h3 className="text-2xl font-black text-purple-950 uppercase tracking-tighter">Custom Tasks</h3>
                      <textarea value={customIdeaInput} onChange={(e) => setCustomIdeaInput(e.target.value)} placeholder="Type a lesson theme here..." className="w-full h-44 p-8 bg-purple-50 text-purple-950 rounded-[3rem] outline-none border-4 border-purple-100 font-black text-lg shadow-inner" />
                      <button onClick={async () => { 
                        if (!customIdeaInput.trim()) return;
                        setIsGenerating(true); 
                        const t = await gemini.generateLessonFromPrompt(customIdeaInput, childName, gradeLevel); 
                        setTasks(prev => [...prev, {...t, id: `c-${Date.now()}`, completed: false, day: selectedDay}]);
                        setCustomIdeaInput(''); setIsGenerating(false); speak("Custom task created!");
                      }} className="w-full py-6 bg-indigo-700 text-white rounded-[3rem] font-black uppercase border-4 border-white shadow-xl tracking-widest">Create Task ✨</button>
                  </div>
              </div>
            )}
            
            {adminSection === 'game_sounds' && (
              <div className="bg-white p-12 rounded-[5rem] border-[12px] border-purple-50 shadow-2xl space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-4xl font-black text-purple-950 uppercase tracking-tighter">Soundboard</h3>
                    <input type="file" multiple id="bulk-sounds" className="hidden" onChange={(e) => {
                      const files = e.target.files; if(!files) return;
                      Array.from(files).forEach(f => {
                         const r = new FileReader(); r.onload = () => {
                           const game = ALL_GAME_IDS.find(g => f.name.toLowerCase().includes(g.id.toLowerCase()));
                           const toy = INITIAL_FIDGET_TOYS.find(t => f.name.toLowerCase().includes(t.id.toLowerCase()));
                           const id = game?.id || toy?.id;
                           if(id) setCustomGameSounds(p => ({...p, [id]: r.result as string}));
                         }; r.readAsDataURL(f);
                      });
                    }} />
                    <label htmlFor="bulk-sounds" className="bg-emerald-600 text-white px-8 py-4 rounded-full font-black text-xs uppercase border-4 border-white shadow-xl cursor-pointer hover:scale-105 active:scale-95 transition-all">Bulk Sync 🎵</label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {[...ALL_GAME_IDS, ...toys].map(item => (
                          <div key={item.id} className="p-6 bg-purple-50 rounded-[3rem] border-4 border-white flex flex-col items-center gap-4 shadow-sm text-center">
                              <span className="text-5xl">{(item as any).emoji || (item as any).icon}</span>
                              <p className="text-[10px] font-black uppercase text-purple-500 tracking-tighter leading-none">{(item as any).name}</p>
                              <input type="file" id={`s-${item.id}`} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => { setCustomGameSounds(p => ({ ...p, [item.id]: r.result as string })); speak("Sound updated!"); }; r.readAsDataURL(f); } }} />
                              <label htmlFor={`s-${item.id}`} className={`w-full py-2 rounded-2xl font-black text-[10px] uppercase cursor-pointer border-2 transition-all ${customGameSounds[item.id] ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-white text-purple-950 border-purple-200'}`}>{customGameSounds[item.id] ? "Change" : "Upload"}</label>
                          </div>
                      ))}
                  </div>
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  const verifyParentCode = () => {
    if (parentCodeInput === '2806') { setIsParentMode(true); setShowParentLock(false); setParentCodeInput(''); setActiveTab('parent-admin'); speak("Welcome to Academy Control."); }
    else { speak("Incorrect access code."); setParentCodeInput(''); }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} totalStars={totalStars} onParentClick={() => isParentMode ? setIsParentMode(false) : setShowParentLock(true)} onQuitClick={() => window.location.reload()} onGoHome={handleGoHome} isParentMode={isParentMode} stopAllSpeech={stopAllSpeech} speak={speak} hideNav={activeGame !== 'none' || currentLesson !== null || showMorningCheckIn || (activeTab === 'tutor' && isNestActive)} childName={childName}>
      {showMorningCheckIn ? <MorningCheckIn onComplete={(r) => { setTotalStars(s => s + r); setShowMorningCheckIn(false); localStorage.setItem('jadzia_last_checkin', new Date().toDateString()); speak(`Good morning Jadzia!`); }} speak={speak} childName={childName} homeAddress={homeAddress} /> : 
       activeGame !== 'none' ? (
        <div className="relative z-50 h-full">
          {activeGame === 'unicorn-counting' && <UnicornGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['unicorn-counting']} />}
          {activeGame === 'memory-match' && <MemoryMatch onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} parentSound={customGameSounds['memory-match']} />}
          {activeGame === 'bubble-pop' && <BubblePopGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['bubble-pop']} />}
          {activeGame === 'new-words' && <NewWordsGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['new-words']} />}
          {activeGame === 'shapes-sides' && <ShapesSidesGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['shapes-sides']} />}
          {activeGame === '3d-explore' && <ThreeDExploreGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['3d-explore']} />}
          {activeGame === 'spell-me' && <SpellMeGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['spell-me']} />}
          {activeGame === 'art-canvas' && <ArtCanvas onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['art-canvas']} childName={childName} />}
          {activeGame === 'clock-game' && <ClockGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} speak={speak} parentSound={customGameSounds['clock-game']} childName={childName} />}
          {activeGame === 'fidget-play' && selectedFidget && <FidgetPlay toy={selectedFidget} onCancel={() => setActiveGame('none')} stopAllSpeech={stopAllSpeech} parentSound={customGameSounds[selectedFidget.id]} />}
          {activeGame === 'maze' && <MazeGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} parentSound={customGameSounds['maze']} />}
          {activeGame === 'fidget' && <FidgetGame onComplete={(r) => { setTotalStars(s => s + r); setActiveGame('none'); }} onCancel={() => setActiveGame('none')} parentSound={customGameSounds['fidget']} />}
        </div>
      ) : currentLesson ? <TeachingMode lesson={currentLesson} onComplete={(grade) => { const t = tasks.find(x => x.id === currentLesson.taskId); if (t) handleTaskComplete(t, grade, true); setCurrentLesson(null); }} onCancel={() => setCurrentLesson(null)} speak={speak} stopAllSpeech={stopAllSpeech} childName={childName} /> : renderTabContent()}

      {showParentLock && (
        <div className="fixed inset-0 z-[20000] bg-[#2e1065]/95 flex items-center justify-center p-6 animate-pop">
          <div className="bg-white p-12 rounded-[5rem] w-full max-w-md text-center border-[12px] border-white shadow-2xl">
            <h3 className="text-4xl font-black text-[#2e1065] uppercase mb-4 leading-none tracking-tighter">Parent Portal</h3>
            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-10">Authentication Required</p>
            <input type="password" value={parentCodeInput} onChange={(e) => setParentCodeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyParentCode()} placeholder="****" className="w-full p-8 bg-purple-50 rounded-[2.5rem] text-center text-5xl font-black outline-none border-4 border-purple-100 mb-10 text-purple-950 shadow-inner" autoFocus />
            <div className="flex gap-4">
              <button onClick={() => { setShowParentLock(false); setParentCodeInput(''); }} className="flex-1 py-6 bg-gray-100 text-gray-500 rounded-full font-black uppercase tracking-widest text-xs">Cancel</button>
              <button onClick={verifyParentCode} className="flex-1 py-6 bg-purple-900 text-white rounded-full font-black uppercase tracking-widest text-xs border-4 border-white shadow-xl">Verify</button>
            </div>
          </div>
        </div>
      )}
      {isGenerating && <div className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-[9999] flex flex-col items-center justify-center text-center"><div className="animate-spin text-9xl mb-10">🫧</div><p className="font-black text-pink-400 uppercase text-6xl tracking-tighter">EVA IS PREPARING MAGIC...</p></div>}
      {completedTaskForReward && <LessonRewardModal task={completedTaskForReward} existingAudio={completedTaskForReward.parentFeedback} onClose={() => setCompletedTaskForReward(null)} onSaveAudio={(b) => { setTasks(prev => prev.map(t => t.id === completedTaskForReward.id ? { ...t, parentFeedback: b } : t)); speak("Praise clip saved!"); }} speak={speak} stopAllSpeech={stopAllSpeech} isSpeaking={isSpeaking} mascotImg={mascotImg} childName={childName} />}
    </Layout>
  );
}
