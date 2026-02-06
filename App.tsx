
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import ArtCanvas from './components/ArtCanvas';
import ClockGame from './components/ClockGame';
import LessonRewardModal from './components/LessonRewardModal';
import { MorningCheckIn } from './components/MorningCheckIn';
import { gemini } from './services/gemini';
import { Task, Grade, ActiveGame, FidgetToy } from './types';
import { jsPDF } from "jspdf";
import * as pdfjs from 'pdfjs-dist';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

const STATE_STORAGE_KEY = 'jadzia_magic_academy_state_v19';
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SA_GRADES = ['Grade R', 'Grade 1', 'Grade 2', 'Grade 3'];
const GRADE_OPTIONS: Grade[] = ['Diamond', 'Gold', 'Silver', 'Bronze', 'Keep Trying'];

const SAMPLE_TASKS: Task[] = [
  { id: 's1', title: 'The Letter A Adventure', category: 'Literacy (Languages)', completed: false, points: 50, day: 'Monday', week: 1, timeSlot: '08:30 - Sunrise Secrets' },
  { id: 's2', title: 'Counting Magic Shells', category: 'Numeracy (Maths)', completed: false, points: 50, day: 'Monday', week: 1, timeSlot: '13:00 - Midday Academy' }
];

const INITIAL_FIDGET_TOYS: FidgetToy[] = [
  { id: 'f1', emoji: '🎆', name: 'Fireworks', cost: 30, unlocked: false, description: 'Splashes of color!', colorClass: 'from-pink-400 to-red-500' },
  { id: 'f2', emoji: '🌀', name: 'Ocean Spinner', cost: 40, unlocked: false, description: 'Spin for splashes!', colorClass: 'from-blue-400 to-cyan-500' },
  { id: 'f3', emoji: '🦖', name: 'T-Rex Tangle', cost: 50, unlocked: false, description: 'Assemble the bones!', colorClass: 'from-green-400 to-emerald-600' },
  { id: 'f4', emoji: '🦦', name: 'Squishy Otter', cost: 35, unlocked: false, description: 'Squish the sea buddy!', colorClass: 'from-amber-400 to-orange-500' },
  { id: 'f5', emoji: '🧊', name: 'Infinite Cube', cost: 60, unlocked: false, description: 'Flip forever!', colorClass: 'from-purple-400 to-indigo-500' },
  { id: 'fidget', emoji: '🎈', name: 'Pop-It Fun (Game)', cost: 100, unlocked: false, description: 'Pop all the bubbles!', colorClass: 'from-cyan-400 to-blue-500', type: 'game' },
];

const ALL_GAME_IDS = [
  { id: 'unicorn-counting', name: 'Counting Fun', icon: '🦄', keywords: ['unicorn', 'counting', 'uni'] },
  { id: 'maze', name: 'Coral Maze', icon: '🧜‍♀️', keywords: ['maze', 'coral', 'ocean'] },
  { id: 'memory-match', name: 'Memory Match', icon: '🃏', keywords: ['memory', 'match', 'pair'] },
  { id: 'bubble-pop', name: 'Bubble ABCs', icon: '🫧', keywords: ['bubble', 'abc', 'pop'] },
  { id: 'new-words', name: 'New Words', icon: '📚', keywords: ['words', 'vocab', 'read'] },
  { id: 'shapes-sides', name: 'Shapes & Sides', icon: '🔶', keywords: ['shapes', 'sides', 'geometry'] },
  { id: '3d-explore', name: '3D Shapes', icon: '💎', keywords: ['3d', 'explore', 'solid'] },
  { id: 'spell-me', name: 'Spell Me', icon: '📝', keywords: ['spell', 'letters', 'write'] },
  { id: 'art-canvas', name: 'Magic Canvas', icon: '🎨', keywords: ['art', 'canvas', 'paint', 'draw'] },
  { id: 'clock-game', name: 'Clock Master', icon: '⏰', keywords: ['clock', 'time', 'watch'] },
];

interface ScannedKnowledge {
  id: string;
  name: string;
  text: string;
  date: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState('schedule');
  const [totalStars, setTotalStars] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [toys, setToys] = useState<FidgetToy[]>(INITIAL_FIDGET_TOYS);
  const [activeGame, setActiveGame] = useState<ActiveGame>('none');
  const [currentLesson, setCurrentLesson] = useState<(any) | null>(null);
  const [isParentMode, setIsParentMode] = useState(false);
  const [showParentLock, setShowParentLock] = useState(false);
  const [parentCodeInput, setParentCodeInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [completedTaskForReward, setCompletedTaskForReward] = useState<Task | null>(null);
  const [showMorningCheckIn, setShowMorningCheckIn] = useState(false);
  const [selectedFidget, setSelectedFidget] = useState<FidgetToy | null>(null);
  const [customGameSounds, setCustomGameSounds] = useState<Record<string, string>>({});
  const [mascotImg, setMascotImg] = useState<string | null>(null);
  const [appBackground, setAppBackground] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isQuotaError, setIsQuotaError] = useState(false);
  const [customIdeaInput, setCustomIdeaInput] = useState('');
  const [importCodeInput, setImportCodeInput] = useState('');
  const [adminSection, setAdminSection] = useState<'lessons' | 'game_sounds' | 'lesson_praise' | 'reports' | 'system' | 'profile' | 'knowledge'>('lessons');
  
  // FIXED: Added useMemo to React imports at the top
  const todayName = useMemo(() => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    return WEEKDAYS.includes(today) ? today : 'Monday';
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(todayName);
  const [batchTargetDay, setBatchTargetDay] = useState<string>(todayName);
  
  const [childName, setChildName] = useState('Jadzia');
  const [gradeLevel, setGradeLevel] = useState('Grade R');
  const [homeAddress, setHomeAddress] = useState('26 Oak Hill');
  const [growthContext, setGrowthContext] = useState('');
  const [knowledgeFiles, setKnowledgeFiles] = useState<ScannedKnowledge[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [gradingTask, setGradingTask] = useState<Task | null>(null);

  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Data Loading & Startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        setTasks(data.tasks || SAMPLE_TASKS);
        setTotalStars(data.totalStars || 0);
        setToys(data.fidgetToys || INITIAL_FIDGET_TOYS);
        setCustomGameSounds(data.customGameSounds || {});
        setChildName(data.childName || 'Jadzia');
        setGradeLevel(data.gradeLevel || 'Grade R');
        setHomeAddress(data.homeAddress || '26 Oak Hill');
        setGrowthContext(data.growthContext || '');
        setKnowledgeFiles(data.knowledgeFiles || []);
        setMascotImg(data.mascotImg || null);
        setAppBackground(data.appBackground || null);
      } else {
        setTasks(SAMPLE_TASKS);
      }
    } catch (e) {
      setTasks(SAMPLE_TASKS);
    }
    
    // Startup Ritual Check
    const lastCheckIn = localStorage.getItem('jadzia_last_checkin');
    const dStr = new Date().toDateString();
    if (!lastCheckIn || lastCheckIn !== dStr) {
      setShowMorningCheckIn(true);
    }
  }, []);

  // Data Saving
  useEffect(() => {
    try {
      const state = { tasks, totalStars, fidgetToys: toys, customGameSounds, mascotImg, appBackground, transcriptions, childName, gradeLevel, homeAddress, growthContext, knowledgeFiles };
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }, [totalStars, tasks, toys, customGameSounds, mascotImg, appBackground, transcriptions, childName, gradeLevel, homeAddress, growthContext, knowledgeFiles]);

  const stopAllSpeech = useCallback(() => {
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
    sourcesRef.current.clear();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
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
    setIsQuotaError(false);
    stopAllSpeech();
  }, [stopAllSpeech]);

  const handleTaskComplete = useCallback((task: Task, grade: Grade, isFromLesson: boolean = false) => {
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: true, grade, completionTimestamp: Date.now() } : t));
    setTotalStars(prev => prev + task.points);
    if (isFromLesson) {
      setCompletedTaskForReward({ ...task, completed: true, grade });
    }
    speak(`Excellent, ${childName}! You earned R${task.points}!`);
  }, [childName, speak]);

  const startLesson = async (task: Task) => {
    setIsGenerating(true);
    setIsQuotaError(false);
    const fullContext = `Manual Notes: ${growthContext}\nScanned PDF Reports: ${knowledgeFiles.map(f => f.text).join('\n')}`;
    try {
      const lessonData = await gemini.generateLesson(task.title, task.category, childName, gradeLevel, fullContext);
      setCurrentLesson({ ...lessonData, taskId: task.id });
      speak(`Ready for your Academy lesson on ${task.title}?`);
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        setIsQuotaError(true);
        speak("EVA is resting her magic brain! Please check back soon.");
      } else {
        speak("Oops! Magic misfired. Try again!");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsGenerating(true);
    const newKnowledge: ScannedKnowledge[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const content = await page.getTextContent();
          fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
        }
        newKnowledge.push({
          id: `pdf-${Date.now()}-${i}`,
          name: file.name,
          text: fullText,
          date: Date.now()
        });
      } catch (err) {
        console.error("PDF Scan failed", err);
      }
    }

    setKnowledgeFiles(prev => [...prev, ...newKnowledge]);
    setIsGenerating(false);
    speak(`Library updated with ${newKnowledge.length} reports.`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        const filteredTasks = tasks.filter(t => t.day === selectedDay);
        return (
          <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/95 p-6 rounded-[2.5rem] border-4 border-indigo-100 shadow-sm shrink-0">
               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {WEEKDAYS.map(day => (
                    <button key={day} onClick={() => setSelectedDay(day)} className={`px-10 py-3 rounded-full font-black text-sm uppercase transition-all ${selectedDay === day ? 'bg-indigo-700 text-white shadow-xl scale-105' : 'bg-white text-indigo-900 font-black hover:bg-indigo-50'}`}>{day}</button>
                  ))}
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 pb-32">
              {filteredTasks.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-70">
                  <span className="text-8xl mb-6 block">🗺️</span>
                  <p className="text-2xl font-black text-indigo-950 uppercase">No magic tasks found for {selectedDay}.</p>
                </div>
              )}
              {filteredTasks.map(task => (
                <div key={task.id} onClick={() => !task.completed && startLesson(task)} className={`p-10 rounded-[4rem] border-8 transition-all cursor-pointer shadow-2xl flex flex-col h-full ${task.completed ? 'bg-green-50 border-green-300' : 'bg-white border-indigo-200 hover:scale-[1.03] active:scale-95'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <span className="bg-indigo-950 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{task.timeSlot}</span>
                    {task.completed && <span className="text-4xl">✅</span>}
                  </div>
                  <h3 className="text-3xl font-black text-indigo-950 uppercase leading-none mb-4 flex-1">{task.title}</h3>
                  <p className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-8">{task.category}</p>
                  <div className="flex justify-between items-center mt-auto border-t-4 border-indigo-50 pt-6">
                    <span className="text-green-700 font-black text-3xl tracking-tighter">R {task.points}</span>
                    {task.completed && <span className="text-xs font-black text-indigo-950 uppercase bg-white px-4 py-2 rounded-full border-2 border-indigo-300 shadow-sm">{task.grade || 'Diamond'}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'tutor':
        return (
          <div className="flex flex-col items-center gap-12 py-12 h-full animate-pop">
            <h2 className="text-6xl font-black text-indigo-950 uppercase tracking-tighter">EVA's Nest</h2>
            <Mascot isSpeaking={isSpeaking} customImage={mascotImg} />
            <button onClick={() => speak(`Hi ${childName}! I'm Mermaid EVA! Let's explore your magic map together!`)} className="py-10 px-24 bg-indigo-800 text-white rounded-full font-black text-4xl shadow-[0_20px_0_#1e3a8a] border-[12px] border-white active:translate-y-4 active:shadow-none transition-all uppercase tracking-tighter">Talk to EVA! 🔊</button>
          </div>
        );
      case 'games':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 pb-32 animate-pop">
            {ALL_GAME_IDS.map(game => (
              <div key={game.id} onClick={() => setActiveGame(game.id as ActiveGame)} className="p-12 bg-white rounded-[5rem] border-[12px] border-indigo-100 hover:scale-105 active:scale-95 cursor-pointer shadow-2xl transition-all flex flex-col items-center text-center gap-8">
                <span className="text-[10rem] drop-shadow-xl">{game.icon}</span>
                <h3 className="text-3xl font-black text-indigo-950 uppercase leading-none">{game.name}</h3>
              </div>
            ))}
          </div>
        );
      case 'rewards':
        return (
          <div className="flex flex-col gap-12 animate-pop">
            <div className="bg-indigo-800 p-14 rounded-[6rem] border-[20px] border-white shadow-2xl text-center text-white">
               <h2 className="text-[10rem] font-black tracking-tighter uppercase leading-none">R {totalStars}</h2>
               <p className="text-2xl font-black text-indigo-200 uppercase mt-4 tracking-widest">Saved in your magic chest</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 pb-32">
               {toys.map(toy => (
                 <div key={toy.id} onClick={() => { 
                    if(toy.unlocked){ 
                      if (toy.id === 'fidget') setActiveGame('fidget');
                      else { setSelectedFidget(toy); setActiveGame('fidget-play'); }
                    } else if(totalStars >= toy.cost){ 
                        setToys(prev => prev.map(t => t.id === toy.id ? {...t, unlocked: true} : t)); 
                        setTotalStars(s => s - toy.cost); speak(`Hooray! You bought the ${toy.name}!`); 
                    } 
                 }} className={`p-12 rounded-[5rem] border-[12px] transition-all cursor-pointer flex flex-col items-center gap-8 text-center ${toy.unlocked ? 'bg-white border-indigo-200 shadow-2xl hover:scale-105 active:scale-95' : 'bg-gray-100 border-gray-400 grayscale opacity-60'}`}>
                    <span className="text-[10rem] drop-shadow-md">{toy.emoji}</span>
                    <h3 className="text-3xl font-black text-indigo-950 uppercase">{toy.name}</h3>
                    {toy.unlocked ? (
                      <span className="bg-emerald-700 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest border-4 border-white shadow-lg">Play ✨</span>
                    ) : (
                      <div className="bg-amber-600 text-white px-12 py-5 rounded-full font-black text-2xl border-4 border-white shadow-xl">Buy: R {toy.cost}</div>
                    )}
                 </div>
               ))}
            </div>
          </div>
        );
      case 'parent-admin':
        return (
          <div className="space-y-12 animate-pop pb-20">
            <div className="flex flex-wrap gap-4 border-b-8 border-indigo-200 pb-12 overflow-x-auto no-scrollbar">
              {(['lessons', 'profile', 'knowledge', 'game_sounds', 'lesson_praise', 'reports', 'system'] as const).map(sec => (
                <button key={sec} onClick={() => setAdminSection(sec)} className={`px-12 py-6 rounded-full font-black text-xs uppercase transition-all shadow-xl border-4 ${adminSection === sec ? 'bg-indigo-950 text-white border-white scale-105' : 'bg-white text-indigo-950 border-indigo-200'}`}>
                  {sec === 'game_sounds' ? 'Sounds 🎙️' : sec === 'lesson_praise' ? 'Praise 🎁' : sec.replace('_', ' ')}
                </button>
              ))}
            </div>

            {adminSection === 'lessons' && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl space-y-10 text-center">
                        <h3 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter">AI Planner 🪄</h3>
                        <div className="flex flex-col gap-6">
                          <button onClick={async () => { setIsGenerating(true); try { const fullContext = `Manual Notes: ${growthContext}\nScanned PDF Reports: ${knowledgeFiles.map(f => f.text).join('\n')}`; const res = await gemini.generateWeeklyCurriculum(tasks.map(t => t.title), childName, gradeLevel, fullContext); setTasks(res.map((t: any, i: number) => ({ ...t, id: `g-${Date.now()}-${i}`, completed: false }))); speak("Weekly magic map updated!"); } catch(e) { speak("Magic recharge needed!"); } setIsGenerating(false); }} className="w-full py-10 bg-indigo-950 text-white rounded-[4rem] font-black uppercase border-4 border-white shadow-2xl text-2xl hover:bg-black transition-all">Plan Full Week 🪄</button>
                          
                          {/* FIXED TODAY LOGIC */}
                          <button onClick={async () => { setIsGenerating(true); try { const fullContext = `Manual Notes: ${growthContext}\nScanned PDF Reports: ${knowledgeFiles.map(f => f.text).join('\n')}`; const res = await gemini.generateDailyCurriculum(todayName, tasks.map(t => t.title), childName, gradeLevel, fullContext); const newDaily = res.map((t: any, i: number) => ({ ...t, id: `d-${Date.now()}-${i}`, completed: false, day: todayName })); setTasks(prev => [...prev.filter(t => t.day !== todayName), ...newDaily]); speak(`${todayName} map updated.`); } catch(e) { speak("Magic recharge needed!"); } setIsGenerating(false); }} className="w-full py-10 bg-emerald-800 text-white rounded-[4rem] font-black uppercase border-4 border-white shadow-2xl text-2xl hover:bg-emerald-950 transition-all">Plan Today ({todayName}) Only 🪄</button>
                        </div>
                    </div>
                    <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl space-y-8">
                        <h3 className="text-4xl font-black text-indigo-950 uppercase tracking-tighter text-center">Batch Add Tasks</h3>
                        <div className="space-y-4">
                           <p className="text-xs font-black text-indigo-900 uppercase tracking-widest ml-6">Target Day:</p>
                           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                             {WEEKDAYS.map(d => (
                               <button key={d} onClick={() => setBatchTargetDay(d)} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase border-2 transition-all ${batchTargetDay === d ? 'bg-indigo-950 text-white border-white' : 'bg-indigo-50 text-indigo-950 border-indigo-200'}`}>{d}</button>
                             ))}
                           </div>
                        </div>
                        <textarea value={customIdeaInput} onChange={(e) => setCustomIdeaInput(e.target.value)} placeholder="Lesson titles (one per line)..." className="w-full h-48 p-10 bg-indigo-50 rounded-[4rem] outline-none border-4 border-white font-black text-xl shadow-inner text-indigo-950" />
                        <button onClick={async () => { 
                          if (!customIdeaInput.trim()) return;
                          setIsGenerating(true); 
                          const lines = customIdeaInput.split('\n').filter(l => l.trim().length > 0);
                          const newBatch = [];
                          for (const line of lines) {
                             try { const t = await gemini.generateLessonFromPrompt(line, childName, gradeLevel); newBatch.push({...t, id: `c-${Date.now()}-${Math.random()}`, completed: false, day: batchTargetDay}); } catch (e) {}
                          }
                          setTasks(prev => [...prev, ...newBatch]); setCustomIdeaInput(''); setIsGenerating(false); speak(`Added ${newBatch.length} tasks!`);
                        }} className="w-full py-8 bg-indigo-900 text-white rounded-[4rem] font-black uppercase border-4 border-white shadow-2xl text-2xl tracking-widest hover:bg-black transition-all">Add Batch ✨</button>
                    </div>
                </div>
                <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl">
                    <h3 className="text-4xl font-black text-indigo-950 uppercase text-center mb-12">Weekly Academy Schedule</h3>
                    <div className="space-y-8 max-h-[1000px] overflow-y-auto no-scrollbar pr-6">
                       {WEEKDAYS.map(day => (
                         <div key={day} className="space-y-4 mb-12">
                           <h4 className="text-3xl font-black text-indigo-700 uppercase ml-6 tracking-widest border-b-4 border-indigo-100 pb-2">{day}</h4>
                           {tasks.filter(t => t.day === day).map(task => (
                             <div key={task.id} className="flex flex-col md:flex-row items-center justify-between p-8 bg-indigo-50 rounded-[3rem] border-4 border-white shadow-md gap-8 hover:border-indigo-300 transition-all">
                                <div className="flex-1 w-full">
                                  <div className="flex items-center gap-4">
                                     <p className="font-black text-indigo-950 uppercase text-2xl leading-none">{task.title}</p>
                                     {task.completed && <span className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full font-black uppercase tracking-widest">Done</span>}
                                  </div>
                                  <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mt-3">{task.timeSlot} • R{task.points} • {task.category}</p>
                                  {task.grade && <p className="text-[10px] font-black text-emerald-600 uppercase mt-2">Grade: {task.grade}</p>}
                                </div>
                                <div className="flex flex-wrap gap-3 justify-center">
                                   <button onClick={() => { if(!task.completed) handleTaskComplete(task, 'Not Graded'); else speak("Already done!"); }} title="Force Complete" className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl border-2 border-white shadow-md hover:bg-emerald-200 active:scale-90 transition-all flex items-center justify-center text-xl">✅</button>
                                   <button onClick={() => setGradingTask(task)} title="Set Grade" className="w-14 h-14 bg-yellow-100 text-yellow-700 rounded-2xl border-2 border-white shadow-md hover:bg-yellow-200 active:scale-90 transition-all flex items-center justify-center text-xl">⭐</button>
                                   <button onClick={() => { setTasks(prev => prev.map(x => x.id === task.id ? {...x, completed: false, grade: undefined} : x)); speak("Task reset."); }} title="Reset" className="w-14 h-14 bg-orange-100 text-orange-950 rounded-2xl border-2 border-white shadow-md hover:bg-orange-200 active:scale-90 transition-all flex items-center justify-center text-xl">🔄</button>
                                   <button onClick={() => setEditingTask(task)} title="Edit Task" className="w-14 h-14 bg-indigo-100 text-indigo-950 rounded-2xl border-2 border-white shadow-md hover:bg-indigo-200 active:scale-90 transition-all flex items-center justify-center text-xl">✏️</button>
                                   <button onClick={() => { if(confirm("Delete this magic task permanently?")) { setTasks(prev => prev.filter(t => t.id !== task.id)); speak("Task removed."); } }} title="Delete" className="w-14 h-14 bg-rose-100 text-rose-950 rounded-2xl border-2 border-white shadow-md hover:bg-rose-200 active:scale-90 transition-all flex items-center justify-center text-xl">🗑️</button>
                                </div>
                             </div>
                           ))}
                         </div>
                       ))}
                    </div>
                </div>
              </div>
            )}

            {adminSection === 'game_sounds' && (
              <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 px-6">
                  <h3 className="text-5xl font-black text-indigo-950 uppercase tracking-tighter">Voice Clips 🎙️</h3>
                  <div className="flex gap-4">
                     <input type="file" id="bulk-sounds-v11" multiple className="hidden" accept="audio/*" onChange={async (e) => {
                        const files = e.target.files; if (!files) return;
                        const soundBatch: Record<string, string> = {};
                        const loaders = Array.from(files).map((file: File) => new Promise<void>((resolve) => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const nameOnly = file.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                            const matched = ALL_GAME_IDS.find(g => {
                              const idClean = g.id.toLowerCase().replace(/[^a-z0-9]/g, '');
                              return g.keywords.some(k => nameOnly.includes(k)) || nameOnly.includes(idClean);
                            });
                            if (matched) soundBatch[matched.id] = reader.result as string;
                            resolve();
                          };
                          reader.readAsDataURL(file);
                        }));
                        await Promise.all(loaders);
                        setCustomGameSounds(prev => ({...prev, ...soundBatch}));
                        speak(`Matched ${Object.keys(soundBatch).length} magic clips!`);
                     }} />
                     <label htmlFor="bulk-sounds-v11" className="bg-indigo-950 text-white px-14 py-6 rounded-full font-black text-sm uppercase border-4 border-white shadow-2xl cursor-pointer hover:bg-black transition-all">Bulk Upload Sounds 📁</label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {ALL_GAME_IDS.map(game => (
                    <div key={game.id} className="p-10 bg-indigo-50 rounded-[4rem] border-4 border-white flex justify-between items-center shadow-md">
                      <div className="flex items-center gap-8">
                        <span className="text-8xl drop-shadow-lg">{game.icon}</span>
                        <p className="font-black text-indigo-950 uppercase text-3xl leading-none">{game.name}</p>
                      </div>
                      <label htmlFor={`gs-${game.id}`} className={`px-12 py-6 rounded-full font-black text-sm uppercase cursor-pointer border-4 shadow-xl transition-all ${customGameSounds[game.id] ? 'bg-emerald-700 text-white border-white scale-110' : 'bg-white text-indigo-950 border-indigo-200 hover:bg-indigo-100'}`}>
                        {customGameSounds[game.id] ? "🔊 READY" : "🎤 ADD"}
                      </label>
                      <input type="file" id={`gs-${game.id}`} className="hidden" onChange={(e) => { 
                         const f = e.target.files?.[0]; if (f) { 
                           const r = new FileReader(); r.onload = () => { setCustomGameSounds(prev => ({...prev, [game.id]: r.result as string})); speak("Saved!"); }; r.readAsDataURL(f);
                         } 
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminSection === 'knowledge' && (
              <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl space-y-12">
                  <div className="text-center space-y-4">
                    <h3 className="text-5xl font-black text-indigo-950 uppercase tracking-tighter">Magic Memory Library 📚</h3>
                    <p className="text-indigo-900 font-bold max-w-2xl mx-auto">Upload past PDF reports. EVA uses this context to recap skills and prevent boring repetition!</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-widest">Manual Growth Notes</label>
                       <textarea value={growthContext} onChange={(e) => setGrowthContext(e.target.value)} placeholder="Type Strengths/Weaknesses here..." className="w-full h-[500px] p-10 bg-indigo-50 rounded-[4rem] border-4 border-white shadow-inner font-black text-xl text-indigo-950 outline-none" />
                    </div>
                    <div className="space-y-8 flex flex-col">
                       <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-widest">Scanned Reports</label>
                       <div className="bg-indigo-50 p-10 rounded-[4rem] border-4 border-white shadow-inner flex-1 flex flex-col gap-6 overflow-y-auto max-h-[400px]">
                          {knowledgeFiles.length === 0 && <p className="text-indigo-300 text-center py-20 font-black uppercase text-xs">No reports scanned yet.</p>}
                          {knowledgeFiles.map(file => (
                            <div key={file.id} className="bg-white p-6 rounded-3xl border-2 border-indigo-100 flex justify-between items-center shadow-sm">
                               <div className="flex items-center gap-4">
                                  <span className="text-3xl">📘</span>
                                  <p className="font-black text-indigo-950 text-sm truncate w-48">{file.name}</p>
                               </div>
                               <button onClick={() => setKnowledgeFiles(prev => prev.filter(f => f.id !== file.id))} className="text-rose-600 p-2 hover:bg-rose-50 rounded-full transition-all">🗑️</button>
                            </div>
                          ))}
                       </div>
                       <input type="file" id="pdf-magic-scan" multiple accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                       <label htmlFor="pdf-magic-scan" className="w-full py-10 bg-indigo-900 text-white rounded-[4rem] font-black uppercase text-xl shadow-2xl border-8 border-white text-center cursor-pointer hover:bg-black transition-all">Scan Growth PDFs 📁</label>
                    </div>
                  </div>
                  <button onClick={() => speak("Memory Synced with Mermaid EVA!")} className="w-full py-12 bg-emerald-700 text-white rounded-[5rem] font-black uppercase text-3xl shadow-2xl border-8 border-white tracking-widest hover:bg-emerald-800 transition-all">Sync Memory ✨</button>
              </div>
            )}

            {adminSection === 'profile' && (
              <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl space-y-12 min-h-[500px]">
                  <h3 className="text-5xl font-black text-indigo-950 uppercase tracking-tighter text-center">Academy Profile & Wallet</h3>
                  <div className="space-y-12 max-w-4xl mx-auto">
                    <div className="space-y-6">
                       <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-[0.2em]">Child's Name</label>
                       <input value={childName} onChange={(e) => setChildName(e.target.value)} className="w-full p-12 bg-indigo-50 rounded-[4rem] font-black text-5xl border-4 border-white text-indigo-950 outline-none shadow-inner" />
                    </div>
                    
                    <div className="space-y-6">
                       <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-[0.2em]">Chest Balance (Rand)</label>
                       <div className="flex items-center gap-6">
                          <span className="text-6xl font-black text-emerald-700">R</span>
                          <input type="number" value={totalStars} onChange={(e) => setTotalStars(parseInt(e.target.value) || 0)} className="w-full p-12 bg-emerald-50 rounded-[4rem] font-black text-6xl border-4 border-white text-emerald-900 outline-none shadow-inner" />
                       </div>
                    </div>

                    <div className="space-y-12 pt-8 border-t-8 border-indigo-50">
                        <h4 className="text-3xl font-black text-indigo-950 uppercase text-center tracking-widest">Academy Aesthetics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                               <p className="font-black text-indigo-900 uppercase text-xs ml-8">Mascot Avatar</p>
                               <input type="file" id="mascot-up" accept="image/*" className="hidden" onChange={(e) => { 
                                  const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=()=>setMascotImg(r.result as string); r.readAsDataURL(f); speak("Avatar updated!"); }
                               }} />
                               <label htmlFor="mascot-up" className="w-full py-10 bg-white border-4 border-indigo-200 rounded-[3rem] font-black uppercase text-indigo-950 flex flex-col items-center gap-4 cursor-pointer hover:bg-indigo-50 transition-all shadow-md">
                                  {mascotImg ? <img src={mascotImg} className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-xl" /> : <span className="text-6xl">🧜‍♀️</span>}
                                  <span>Change EVA Image</span>
                               </label>
                            </div>
                            <div className="space-y-4">
                               <p className="font-black text-indigo-900 uppercase text-xs ml-8">Academy Background</p>
                               <input type="file" id="bg-up" accept="image/*" className="hidden" onChange={(e) => { 
                                  const f = e.target.files?.[0]; if(f){ const r=new FileReader(); r.onload=()=>setAppBackground(r.result as string); r.readAsDataURL(f); speak("Background updated!"); }
                               }} />
                               <label htmlFor="bg-up" className="w-full py-10 bg-white border-4 border-indigo-200 rounded-[3rem] font-black uppercase text-indigo-950 flex flex-col items-center gap-4 cursor-pointer hover:bg-indigo-50 transition-all shadow-md">
                                  {appBackground ? <div className="w-24 h-14 bg-cover bg-center rounded-xl border-2 border-white" style={{backgroundImage: `url(${appBackground})`}} /> : <span className="text-6xl">🖼️</span>}
                                  <span>Change Background</span>
                               </label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                       <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-[0.2em]">Current Grade</label>
                       <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} className="w-full p-12 bg-indigo-50 rounded-[4rem] font-black text-4xl border-4 border-white text-indigo-950 outline-none cursor-pointer">
                         {SA_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                       </select>
                    </div>
                    <div className="space-y-6">
                       <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-[0.2em]">Home Address</label>
                       <input value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} className="w-full p-12 bg-indigo-50 rounded-[4rem] font-black text-4xl border-4 border-white text-indigo-950 outline-none shadow-inner" />
                    </div>
                    <button onClick={() => speak("Academy Settings Updated!")} className="w-full py-12 bg-indigo-950 text-white rounded-[4rem] font-black uppercase text-4xl shadow-2xl border-8 border-white tracking-widest hover:bg-black transition-all mt-10">Save Academy Profile ✨</button>
                  </div>
              </div>
            )}

            {adminSection === 'lesson_praise' && (
              <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl space-y-10 min-h-[500px]">
                <h3 className="text-5xl font-black text-indigo-950 uppercase text-center tracking-tighter">Voice Rewards 🎁</h3>
                <div className="space-y-8 max-h-[800px] overflow-y-auto no-scrollbar pr-6">
                  {tasks.map(t => (
                    <div key={t.id} className="p-10 bg-indigo-50 rounded-[4rem] border-4 border-white flex justify-between items-center shadow-md">
                      <div>
                        <p className="font-black text-indigo-950 uppercase text-3xl leading-none">{t.title}</p>
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mt-2">{t.day} • {t.timeSlot}</p>
                      </div>
                      <label htmlFor={`p-${t.id}`} className={`px-14 py-7 rounded-full font-black text-sm uppercase cursor-pointer border-4 shadow-xl transition-all ${t.parentFeedback ? 'bg-emerald-800 text-white border-white scale-110' : 'bg-white text-indigo-950 border-indigo-300 hover:bg-indigo-100'}`}>
                        {t.parentFeedback ? "READY 🔊" : "ADD VOICE 🎤"}
                      </label>
                      <input type="file" id={`p-${t.id}`} className="hidden" onChange={(e) => { 
                         const f = e.target.files?.[0]; if (f) { 
                           const r = new FileReader(); r.onload = () => { setTasks(prev => prev.map(x => x.id === t.id ? {...x, parentFeedback: r.result as string} : x)); speak("Audio praise saved!"); }; r.readAsDataURL(f);
                         } 
                      }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {adminSection === 'reports' && (
              <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl space-y-12 text-center min-h-[500px]">
                  <h3 className="text-5xl font-black text-indigo-950 uppercase tracking-tighter">Academy Progress Reports</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <button onClick={() => { const doc = new jsPDF(); doc.text(`${childName}'s Academy Progress`, 20, 20); tasks.filter(t => t.completed).forEach((t, i) => doc.text(`${t.title} - Grade: ${t.grade || 'Diamond'}`, 20, 30 + i * 10)); doc.save(`${childName}_Progress.pdf`); speak("PDF Report ready!"); }} className="bg-rose-50 p-16 rounded-[6rem] border-8 border-white flex flex-col items-center gap-12 shadow-2xl hover:scale-105 active:scale-95 transition-all w-full">
                        <span className="text-[12rem] drop-shadow-lg">📈</span>
                        <span className="w-full py-10 bg-rose-900 text-white rounded-[4rem] font-black uppercase text-3xl border-4 border-white tracking-widest shadow-xl">Get PDF Report</span>
                     </button>
                     <div className="bg-cyan-50 p-16 rounded-[6rem] border-8 border-white flex flex-col items-center gap-6 shadow-inner">
                        <span className="text-6xl mb-4">🏆</span>
                        <p className="font-black text-cyan-900 text-xl uppercase">Total Tasks Done</p>
                        <p className="text-8xl font-black text-cyan-600">{tasks.filter(t => t.completed).length}</p>
                     </div>
                  </div>
              </div>
            )}

            {adminSection === 'system' && (
              <div className="bg-white p-14 rounded-[6rem] border-[15px] border-indigo-200 shadow-2xl space-y-14 text-center min-h-[500px]">
                  <h3 className="text-5xl font-black text-indigo-950 uppercase tracking-tighter">Academy System Care</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="bg-emerald-50 p-16 rounded-[6rem] border-8 border-white shadow-inner flex flex-col items-center gap-12">
                          <span className="text-[12rem]">💾</span>
                          <button onClick={() => { const key = btoa(JSON.stringify({ tasks, totalStars, childName, gradeLevel, toys, customGameSounds, mascotImg, appBackground, growthContext, knowledgeFiles })); navigator.clipboard.writeText(key); speak("Backup Code Copied!"); }} className="w-full py-10 bg-emerald-950 text-white rounded-[4rem] font-black uppercase border-8 border-white shadow-2xl text-3xl tracking-widest hover:bg-black transition-all">Copy Backup 📋</button>
                      </div>
                      <div className="bg-indigo-50 p-16 rounded-[6rem] border-8 border-white shadow-inner flex flex-col items-center gap-10">
                          <span className="text-[12rem]">📥</span>
                          <textarea value={importCodeInput} onChange={(e) => setImportCodeInput(e.target.value)} placeholder="Paste magic code..." className="w-full h-32 p-6 rounded-3xl border-4 border-white shadow-inner bg-white/50 text-xs font-bold outline-none" />
                          <button onClick={() => { try { const d = JSON.parse(atob(importCodeInput)); if(d.childName) setChildName(d.childName); if(d.tasks) setTasks(d.tasks); if(d.totalStars) setTotalStars(d.totalStars); if(d.mascotImg) setMascotImg(d.mascotImg); if(d.appBackground) setAppBackground(d.appBackground); speak("Academy Magic Restored!"); } catch(e){ alert("Invalid code!"); } }} className="w-full py-8 bg-indigo-800 text-white rounded-[4rem] font-black uppercase border-4 border-white shadow-xl text-2xl">Restore State</button>
                      </div>
                  </div>
              </div>
            )}
          </div>
        );
      default: return null;
    }
  };

  const verifyParentCode = () => {
    if (parentCodeInput === '2806') { setIsParentMode(true); setShowParentLock(false); setParentCodeInput(''); setActiveTab('parent-admin'); speak("Portal Open. Welcome Parent."); }
    else { speak("Wrong code!"); setParentCodeInput(''); }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} totalStars={totalStars} onParentClick={() => isParentMode ? setIsParentMode(false) : setShowParentLock(true)} onQuitClick={() => window.location.reload()} onGoHome={handleGoHome} isParentMode={isParentMode} stopAllSpeech={stopAllSpeech} speak={speak} hideNav={activeGame !== 'none' || currentLesson !== null || showMorningCheckIn} childName={childName} customBackground={appBackground}>
      {showMorningCheckIn ? <MorningCheckIn onComplete={(r) => { setTotalStars(s => s + r); setShowMorningCheckIn(false); localStorage.setItem('jadzia_last_checkin', new Date().toDateString()); speak(`Good morning, Jadzia! Let's have a wonderful day at the Academy.`); }} speak={speak} childName={childName} homeAddress={homeAddress} /> : 
       activeGame !== 'none' ? (
        <div className="fixed inset-0 z-[99999] bg-white">
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
        <div className="fixed inset-0 z-[100000] bg-indigo-950/95 flex items-center justify-center p-8 animate-pop backdrop-blur-md">
          <div className="bg-white p-14 rounded-[5rem] w-full max-w-2xl text-center border-[20px] border-white shadow-2xl">
            <h3 className="text-5xl font-black text-indigo-950 uppercase mb-12 tracking-tighter leading-none">Parent Entrance</h3>
            <input type="password" value={parentCodeInput} onChange={(e) => setParentCodeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyParentCode()} placeholder="****" className="w-full p-12 bg-indigo-50 rounded-[4rem] text-center text-7xl font-black outline-none border-8 border-indigo-200 mb-12 text-indigo-950 shadow-inner" autoFocus />
            <div className="flex gap-8">
              <button onClick={() => { setShowParentLock(false); setParentCodeInput(''); }} className="flex-1 py-10 bg-gray-100 text-gray-900 rounded-full font-black uppercase tracking-widest text-lg shadow-md border-2 border-white transition-all">Cancel</button>
              <button onClick={verifyParentCode} className="flex-1 py-10 bg-indigo-900 text-white rounded-full font-black uppercase tracking-widest text-lg border-8 border-white shadow-2xl hover:bg-black transition-all">Verify Code</button>
            </div>
          </div>
        </div>
      )}

      {gradingTask && (
        <div className="fixed inset-0 z-[100000] bg-indigo-950/95 flex items-center justify-center p-8 animate-pop backdrop-blur-md">
          <div className="bg-white p-16 rounded-[6rem] w-full max-w-xl border-[20px] border-white shadow-2xl space-y-10 text-center">
            <h3 className="text-5xl font-black text-indigo-900 uppercase tracking-tighter leading-none">Grade Task</h3>
            <p className="font-black text-indigo-400 uppercase text-xs tracking-widest">{gradingTask.title}</p>
            <div className="grid grid-cols-1 gap-4">
              {GRADE_OPTIONS.map(g => (
                <button key={g} onClick={() => { setTasks(prev => prev.map(t => t.id === gradingTask.id ? {...t, grade: g, completed: true} : t)); setGradingTask(null); speak(`Graded as ${g}!`); }} className="w-full py-6 bg-indigo-50 text-indigo-900 rounded-full font-black uppercase text-xl border-4 border-white shadow-md hover:bg-indigo-100 transition-all">{g}</button>
              ))}
            </div>
            <button onClick={() => setGradingTask(null)} className="w-full py-6 bg-rose-100 text-rose-600 rounded-full font-black uppercase border-2 border-white transition-all">Cancel</button>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 z-[100000] bg-indigo-950/95 flex items-center justify-center p-8 animate-pop backdrop-blur-md">
          <div className="bg-white p-16 rounded-[6rem] w-full max-w-2xl border-[20px] border-white shadow-2xl space-y-10">
            <h3 className="text-5xl font-black text-indigo-900 uppercase text-center tracking-tighter leading-none">Edit Magic Task</h3>
            <div className="space-y-6">
               <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-widest">Task Title</label>
               <input value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} className="w-full p-8 bg-indigo-50 rounded-[3rem] font-black text-2xl border-4 border-indigo-100 text-indigo-950 outline-none shadow-inner" />
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                 <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-widest">Rand Reward</label>
                 <input type="number" value={editingTask.points} onChange={(e) => setEditingTask({...editingTask, points: parseInt(e.target.value) || 0})} className="w-full p-8 bg-indigo-50 rounded-[3rem] font-black text-3xl border-4 border-indigo-100 text-indigo-950 outline-none shadow-inner" />
              </div>
              <div className="space-y-6">
                 <label className="font-black text-indigo-950 uppercase text-sm ml-10 tracking-widest">Time Slot</label>
                 <input value={editingTask.timeSlot} onChange={(e) => setEditingTask({...editingTask, timeSlot: e.target.value})} className="w-full p-8 bg-indigo-50 rounded-[3rem] font-black text-2xl border-4 border-indigo-100 text-indigo-950 outline-none shadow-inner" />
              </div>
            </div>
            <div className="flex gap-8 mt-12">
              <button onClick={() => setEditingTask(null)} className="flex-1 py-10 bg-gray-100 text-gray-900 rounded-full font-black uppercase text-lg border-2 border-white transition-all">Cancel</button>
              <button onClick={() => { setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t)); setEditingTask(null); speak("Academy map updated!"); }} className="flex-1 py-10 bg-indigo-950 text-white rounded-full font-black uppercase text-lg border-8 border-white shadow-2xl hover:bg-black transition-all">Save Changes</button>
            </div>
          </div>
        </div>
      )}
      
      {isGenerating && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200000] flex flex-col items-center justify-center text-center p-12">
          <div className="animate-spin text-[15rem] mb-12">🫧</div>
          <p className="font-black text-indigo-400 uppercase text-8xl tracking-tighter animate-pulse leading-none">EVA is thinking magic...</p>
        </div>
      )}

      {isQuotaError && (
        <div className="fixed inset-0 bg-indigo-950/98 backdrop-blur-3xl z-[200000] flex flex-col items-center justify-center text-center p-12">
          <div className="text-[15rem] mb-12 bouncy">🛁</div>
          <h2 className="font-black text-white uppercase text-8xl tracking-tighter mb-8 leading-none">EVA is Resting!</h2>
          <p className="font-black text-indigo-400 text-4xl max-w-4xl mb-16 uppercase italic leading-tight">"Bubble bath time! My magic brain needs a quick recharge. Please check back in a minute!"</p>
          <button onClick={handleGoHome} className="bg-white text-indigo-950 px-24 py-12 rounded-full font-black text-5xl uppercase border-[12px] border-indigo-300 shadow-2xl active:scale-95 transition-all">OK, EVA! 👍</button>
        </div>
      )}

      {completedTaskForReward && <LessonRewardModal task={completedTaskForReward} existingAudio={completedTaskForReward.parentFeedback} onClose={() => setCompletedTaskForReward(null)} onSaveAudio={(b) => { setTasks(prev => prev.map(t => t.id === completedTaskForReward.id ? { ...t, parentFeedback: b } : t)); speak("Special praise saved!"); }} speak={speak} stopAllSpeech={stopAllSpeech} isSpeaking={isSpeaking} mascotImg={mascotImg} childName={childName} />}
    </Layout>
  );
}
