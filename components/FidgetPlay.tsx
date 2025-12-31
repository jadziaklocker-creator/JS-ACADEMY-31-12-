
import React, { useState, useEffect, useRef } from 'react';
import { FidgetToy } from '../types';

export default function FidgetPlay({ toy, onCancel, parentSound, stopAllSpeech }: { toy: FidgetToy, onCancel: () => void, parentSound?: string, stopAllSpeech: () => void }) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [distortion, setDistortion] = useState({ scaleX: 1, scaleY: 1, skew: 0, x: 0, y: 0 });
  
  const [splashes, setSplashes] = useState<{id: number, x: number, y: number, color: string}[]>([]);
  const [oceanSplashes, setOceanSplashes] = useState<{id: number, x: number, y: number}[]>([]);
  const [dolphins, setDolphins] = useState<{id: number, left: number}[]>([]);
  
  const [puzzleParts, setPuzzleParts] = useState([
    { id: 'tail', emoji: '🦴', name: 'Tail', placed: false, x: 200, y: 150 },
    { id: 'body', emoji: '🦴', name: 'Body', placed: false, x: 140, y: 140 },
    { id: 'leg1', emoji: '🦴', name: 'Leg', placed: false, x: 130, y: 180 },
    { id: 'leg2', emoji: '🦴', name: 'Leg', placed: false, x: 160, y: 180 },
    { id: 'head', emoji: '🦴', name: 'Head', placed: false, x: 100, y: 120 },
  ]);
  const [currentPartIdx, setCurrentPartIdx] = useState(0);
  const [showSkin, setShowSkin] = useState(false);
  const [cubeFace, setCubeFace] = useState(1);

  const spinInterval = useRef<any>(null);
  const soundRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      clearInterval(spinInterval.current);
      if (soundRef.current) soundRef.current.pause();
    };
  }, []);

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const handleInteract = (e: React.MouseEvent) => {
    playParentVoice();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (toy.id === 'f1') {
      const colors = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a855f7'];
      const newSplash = { id: Date.now(), x: clickX, y: clickY, color: colors[Math.floor(Math.random() * colors.length)] };
      setSplashes(prev => [...prev, newSplash]);
      setTimeout(() => setSplashes(prev => prev.filter(s => s.id !== newSplash.id)), 1000);
    } else if (toy.id === 'f2') {
      setIsSpinning(true);
      if (!soundRef.current) {
        soundRef.current = new Audio('https://www.soundjay.com/nature/sounds/water-splash-01.mp3');
        soundRef.current.loop = true;
      }
      soundRef.current.play().catch(() => {});
      const newDolphin = { id: Date.now(), left: Math.random() * 80 + 10 };
      setDolphins(prev => [...prev, newDolphin]);
      setTimeout(() => setDolphins(prev => prev.filter(d => d.id !== newDolphin.id)), 2500);

      let speed = 35;
      clearInterval(spinInterval.current);
      spinInterval.current = setInterval(() => {
        setRotation(prev => prev + speed);
        speed *= 0.985;
        if (Math.random() > 0.6) {
          const splash = { id: Date.now(), x: 150 + (Math.random()-0.5)*250, y: 150 + (Math.random()-0.5)*250 };
          setOceanSplashes(prev => [...prev.slice(-15), splash]);
          setTimeout(() => setOceanSplashes(prev => prev.filter(s => s.id !== splash.id)), 500);
        }
        if (speed < 0.2) {
          clearInterval(spinInterval.current);
          setIsSpinning(false);
          if (soundRef.current) soundRef.current.pause();
        }
      }, 20);
    } else if (toy.id === 'f3') {
      if (currentPartIdx < puzzleParts.length) {
        setPuzzleParts(prev => prev.map((p, i) => i === currentPartIdx ? {...p, placed: true} : p));
        setCurrentPartIdx(prev => prev + 1);
        if (currentPartIdx === puzzleParts.length - 1) {
          setTimeout(() => {
            setShowSkin(true);
          }, 800);
        }
      } else {
        setShowSkin(false);
        setPuzzleParts(prev => prev.map(p => ({...p, placed: false})));
        setCurrentPartIdx(0);
      }
    } else if (toy.id === 'f4') {
      setDistortion({
        scaleX: 0.2 + Math.random() * 0.6,
        scaleY: 1.8 + Math.random() * 0.8,
        skew: (Math.random() - 0.5) * 40,
        x: (Math.random() - 0.5) * 100,
        y: (Math.random() - 0.5) * 100
      });
      const squishSound = new Audio('https://www.soundjay.com/misc/sounds/slime-squish-02.mp3');
      squishSound.volume = 0.8;
      squishSound.play().catch(() => {});
      setTimeout(() => setDistortion(prev => ({ ...prev, scaleX: 1.4, scaleY: 0.6 })), 150);
      setTimeout(() => setDistortion({ scaleX: 1, scaleY: 1, skew: 0, x: 0, y: 0 }), 450);
    } else if (toy.id === 'f5') {
      setCubeFace(prev => (prev % 6) + 1);
      setRotation(prev => prev + 90);
      new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(()=>{});
    }
  };

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[5000] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-lg flex justify-between items-center absolute top-10 left-10 right-10 z-[5050]">
        <button onClick={(e) => { e.stopPropagation(); stopAllSpeech(); onCancel(); }} className="bg-purple-600 text-white px-8 py-3 rounded-full font-black border-4 border-white shadow-lg active:scale-95 transition-all uppercase text-sm">Back to School 🏫</button>
      </div>
      
      <div className="text-center mb-10 z-[5050] pointer-events-none">
        <h2 className="text-4xl font-black text-purple-900 uppercase mb-2">{toy.name}</h2>
        <p className="text-purple-400 font-bold italic">
          {toy.id === 'f2' ? 'Tap the spinner to see dolphins jump!' : 'Tap to play!'}
        </p>
      </div>

      <div 
        onClick={handleInteract}
        className="w-80 h-80 bg-white rounded-[5rem] border-[15px] border-purple-50 shadow-inner flex items-center justify-center cursor-pointer active:scale-95 transition-all relative overflow-hidden"
      >
        <div 
          style={{ 
            transform: `rotate(${rotation}deg) scale(${distortion.scaleX}, ${distortion.scaleY}) skew(${distortion.skew}deg) translate(${distortion.x}px, ${distortion.y}px)`,
            transition: isSpinning ? 'none' : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.5)'
          }}
          className="relative w-full h-full flex items-center justify-center select-none"
        >
          {toy.id === 'f3' ? (
            <div className="relative w-full h-full">
              {puzzleParts.map((p) => (
                <div key={`grey-${p.id}`} style={{ left: p.x, top: p.y }} className={`absolute text-6xl grayscale opacity-20 transform -translate-x-1/2 -translate-y-1/2`}>
                  {p.emoji}
                </div>
              ))}
              {puzzleParts.map((p) => (
                <div key={p.id} style={{ left: p.x, top: p.y }} className={`absolute text-6xl transition-all duration-700 transform -translate-x-1/2 -translate-y-1/2 ${p.placed ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                  {p.emoji}
                </div>
              ))}
              {showSkin && (
                <div className="absolute inset-0 flex items-center justify-center animate-pop">
                  <div className="text-[12rem] drop-shadow-2xl">🦖</div>
                </div>
              )}
            </div>
          ) : toy.id === 'f1' ? (
            <div className="absolute inset-0" />
          ) : (
            <div className={`text-[12rem] drop-shadow-2xl`}>
              {toy.id === 'f5' ? ['🧊', '📦', '🎁', '🧱', '💎', '🍬'][cubeFace-1] : toy.emoji}
            </div>
          )}
          {splashes.map(s => (
            <div key={s.id} className="absolute pointer-events-none" style={{ left: s.x, top: s.y }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="absolute w-8 h-8 rounded-full animate-firework" style={{ backgroundColor: s.color, transform: `rotate(${i * 36}deg) translateY(-60px)` }} />
              ))}
            </div>
          ))}
          {oceanSplashes.map(s => (
            <div key={s.id} className="absolute w-8 h-8 rounded-full bg-cyan-200/50 blur-sm animate-pop" style={{ left: s.x, top: s.y }} />
          ))}
        </div>
      </div>
      {dolphins.map(d => (
        <div 
          key={d.id} 
          style={{ left: `${d.left}%` }}
          className={`absolute z-[5020] text-8xl pointer-events-none animate-dolphin-jump`}
        >
          🐬
        </div>
      ))}
      <div className="mt-16 bg-purple-100/50 p-8 rounded-[3rem] max-w-sm text-center z-[5050] pointer-events-none">
        <p className="text-purple-900 font-black uppercase text-sm mb-2">How to play:</p>
        <p className="text-purple-600 font-bold">{toy.description}</p>
      </div>
    </div>
  );
}
