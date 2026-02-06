
import React, { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  totalStars: number;
  onParentClick: () => void;
  onQuitClick: () => void;
  onGoHome: () => void;
  isParentMode?: boolean;
  stopAllSpeech: () => void;
  speak: (t: string) => void;
  hideNav?: boolean;
  childName: string;
  customBackground?: string | null;
}

const Layout: React.FC<LayoutProps> = (props) => {
  const { children, activeTab, setActiveTab, totalStars, onParentClick, onQuitClick, onGoHome, isParentMode, stopAllSpeech, speak, hideNav, childName, customBackground } = props;
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
  
  const speakSystem = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.name.toLowerCase().includes('zira')) 
                     || voices.find(v => v.name.includes('Female'))
                     || voices.find(v => v.lang.startsWith('en-US'));
    
    if (targetVoice) utterance.voice = targetVoice;
    utterance.pitch = 1.1; 
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleTabChange = (tabId: string) => {
    stopAllSpeech();
    setActiveTab(tabId);
  };

  const baseTabs = [
    { id: 'schedule', label: 'Magic Map', icon: '🦋', color: 'bg-pink-400' },
    { id: 'tutor', label: 'EVA Nest', icon: '🧜‍♀️', color: 'bg-purple-400' },
    { id: 'games', label: 'Play Zone', icon: '✨', color: 'bg-fuchsia-400' },
    { id: 'rewards', label: 'Chest', icon: '🎁', color: 'bg-indigo-400' },
  ];

  const tabs = isParentMode 
    ? [...baseTabs, { id: 'parent-admin', label: 'Admin', icon: '🛠️', color: 'bg-purple-800' }]
    : baseTabs;

  return (
    <div 
      className="app-boundary bg-white relative border-x-8 border-pink-100 overflow-hidden"
      style={customBackground ? { backgroundImage: `url(${customBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <header className={`flex-none p-6 text-white flex flex-col gap-4 z-[10000] overflow-hidden transition-all duration-1000 ${isParentMode ? 'bg-[#4c1d95] shadow-[0_12px_0_#2e1065]' : 'bg-[#db2777] shadow-[0_12px_0_#9d174d]'}`}>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={onQuitClick} className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center text-sm balloon-button border-2 border-white/20">❌</button>
            <div onClick={() => speakSystem(`The date is ${dateStr}, and it is ${timeStr}`)} className="cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <h1 className="text-2xl font-black tracking-tighter uppercase drop-shadow-lg leading-none">{childName}'s Academy</h1>
              <p className="text-[12px] font-black opacity-100 uppercase tracking-widest mt-1 bg-white/20 px-3 py-1 rounded-full border-2 border-white/30 shadow-inner inline-block">
                {dateStr} • {timeStr}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTab !== 'schedule' && (
              <button onClick={onGoHome} className="bg-white text-purple-600 px-6 py-2 rounded-full font-black text-sm shadow-[0_5px_0_#ccc] border-4 border-purple-200 active:translate-y-2 active:shadow-none transition-all flex items-center gap-2 uppercase animate-pop">
                <span>School Map 🗺️</span>
              </button>
            )}
            <button onClick={onParentClick} className={`w-12 h-12 rounded-full flex items-center justify-center text-xl balloon-button border-4 transition-all duration-500 ${isParentMode ? 'bg-yellow-400 border-yellow-200 animate-pulse scale-110' : 'bg-white/20 border-white/20'}`}>
                {isParentMode ? '🔓' : '🔒'}
            </button>
            <button onClick={() => speakSystem(`${childName}, your current balance is ${totalStars} Rand`)} className="bg-[#10b981] text-white px-6 py-2 rounded-full font-black text-xl shadow-[0_5px_0_#059669] border-4 border-white/40 flex items-center gap-2 active:scale-95 transition-all">
              💰 <span>{totalStars} Rand</span>
            </button>
          </div>
        </div>

        {!hideNav && (
          <nav className="flex justify-between items-center bg-white/95 backdrop-blur-3xl p-3 rounded-[3rem] border-4 border-white/30 shadow-inner w-full max-w-4xl mx-auto pointer-events-auto">
            {tabs.map((tab) => (
              <button 
                key={tab.id} 
                onClick={() => handleTabChange(tab.id)} 
                className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-full transition-all duration-300 mx-1 group ${activeTab === tab.id ? `${tab.color} text-white scale-105 shadow-xl border-2 border-white` : 'bg-transparent text-purple-950 font-black hover:bg-white/50'}`}
              >
                <span className={`text-2xl transition-transform ${activeTab === tab.id ? 'scale-110' : 'opacity-80'}`}>{tab.icon}</span>
                <span className={`text-[11px] font-black uppercase tracking-tighter ${activeTab === tab.id ? 'opacity-100' : 'opacity-90'}`}>{tab.label}</span>
              </button>
            ))}
          </nav>
        )}
      </header>
      <main className={`flex-1 overflow-y-auto p-6 relative z-10 no-scrollbar ${hideNav ? '' : 'pt-4'}`}>
        {children}
      </main>
    </div>
  );
};
export default Layout;
