
import React, { useState, useRef } from 'react';

const SHAPES = [
  { 
    name: 'Circle', 
    sides: 0, 
    description: 'A circle is perfectly round with zero sides!',
    color: '#ef4444',
    render: () => <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-lg"><circle cx="50" cy="50" r="45" fill="currentColor" /></svg>
  },
  { 
    name: 'Triangle', 
    sides: 3, 
    description: 'A triangle has three straight sides and three corners!',
    color: '#3b82f6',
    render: () => <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-lg"><polygon points="50,5 95,95 5,95" fill="currentColor" /></svg>
  },
  { 
    name: 'Square', 
    sides: 4, 
    description: 'A square has four equal sides and four corners!',
    color: '#10b981',
    render: () => <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-lg"><rect x="10" y="10" width="80" height="80" fill="currentColor" /></svg>
  },
  { 
    name: 'Rectangle', 
    sides: 4, 
    description: 'A rectangle has four sides, two long and two short!',
    color: '#f59e0b',
    render: () => <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-lg"><rect x="5" y="25" width="90" height="50" fill="currentColor" /></svg>
  },
  { 
    name: 'Pentagon', 
    sides: 5, 
    description: 'A pentagon has five straight sides!',
    color: '#8b5cf6',
    render: () => <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-lg"><polygon points="50,5 95,40 80,95 20,95 5,40" fill="currentColor" /></svg>
  },
  { 
    name: 'Hexagon', 
    sides: 6, 
    description: 'A hexagon has six straight sides, like a honey bee house!',
    color: '#ec4899',
    render: () => <svg viewBox="0 0 100 100" className="w-48 h-48 drop-shadow-lg"><polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="currentColor" /></svg>
  },
];

export default function ShapesSidesGame({ onComplete, onCancel, speak, parentSound }: { onComplete: (r: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const shape = SHAPES[currentIdx];
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    if (currentIdx < SHAPES.length - 1) {
      setCurrentIdx(currentIdx + 1);
      speak(`Next shape! ${SHAPES[currentIdx + 1].name}`);
    } else {
      onComplete(20);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      speak(`Back to ${SHAPES[currentIdx - 1].name}`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[5000] bg-orange-50 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-4xl flex justify-between items-center mb-10 z-[5100]">
        <button 
          onClick={(e) => { e.stopPropagation(); onCancel(); }} 
          className="bg-white text-orange-500 px-10 py-4 rounded-full font-black border-4 border-orange-100 shadow-xl active:scale-95 transition-all flex items-center gap-2 pointer-events-auto cursor-pointer"
        >
          <span>Back to School 🏫</span>
        </button>
        <h2 className="text-orange-600 font-black text-2xl uppercase tracking-widest pointer-events-none">Shapes Explorer</h2>
      </div>

      <div 
        onClick={playParentVoice}
        className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-2xl bg-white rounded-[5rem] border-[12px] border-orange-100 p-10 shadow-inner relative"
      >
        
        <div 
          onClick={(e) => { e.stopPropagation(); playParentVoice(); speak(`${shape.name}. It has ${shape.sides} sides. ${shape.description}`); }}
          className="cursor-pointer hover:scale-110 transition-transform duration-500"
          style={{ color: shape.color }}
        >
          {shape.render()}
        </div>

        <div className="text-center pointer-events-none">
          <h3 className="text-5xl font-black text-orange-900 mb-2">{shape.name}</h3>
          <p className="text-2xl font-black text-orange-600 bg-orange-50 px-6 py-2 rounded-full inline-block mb-4 shadow-sm">
            {shape.sides} SIDES
          </p>
          <p className="text-lg font-bold text-orange-400 max-w-md">
            {shape.description}
          </p>
        </div>

        <div className="flex gap-10 mt-6">
          <button 
            onClick={handlePrev} 
            disabled={currentIdx === 0}
            className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full font-black text-4xl shadow-lg border-4 border-white disabled:opacity-30 active:scale-90 transition-all"
          >
            ⬅️
          </button>
          <button 
            onClick={handleNext} 
            className="w-20 h-20 bg-orange-500 text-white rounded-full font-black text-4xl shadow-lg border-4 border-white active:scale-90 transition-all"
          >
            {currentIdx === SHAPES.length - 1 ? '✅' : '➡️'}
          </button>
        </div>

        <div className="absolute bottom-10 flex gap-2">
          {SHAPES.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === currentIdx ? 'w-8 bg-orange-500' : 'w-2 bg-orange-200'}`} />
          ))}
        </div>
      </div>

      <p className="mt-8 text-orange-300 font-black uppercase tracking-widest text-center pointer-events-none">
        Tap the shape to hear Mermaid EVA!
      </p>
    </div>
  );
}
