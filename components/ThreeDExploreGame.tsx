
import React, { useState, useRef, useEffect } from 'react';

const SHAPES_3D = [
  { 
    name: 'Sphere', 
    description: 'A sphere is round like a ball!', 
    render: (rot: { x: number, y: number }) => (
      <div className="relative w-64 h-64 rounded-full shadow-[inset_-20px_-20px_60px_rgba(0,0,0,0.5),20px_20px_80px_rgba(0,0,0,0.2)] overflow-hidden bg-blue-500">
        <div 
          className="absolute inset-[-50%] grid grid-cols-4 grid-rows-4 gap-4 opacity-20 pointer-events-none"
          style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
        >
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-white/40 blur-sm" />
          ))}
        </div>
        <div 
          className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-gradient-to-br from-white to-transparent rounded-full blur-xl opacity-90"
          style={{ transform: `translate(${-rot.y*0.15}px, ${-rot.x*0.15}px)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/40 rounded-full" />
        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/20 rounded-full blur-md" />
      </div>
    )
  },
  { 
    name: 'Cube', 
    description: 'A cube is like a dice or a box!',
    render: (rot: { x: number, y: number }) => (
      <div style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transformStyle: 'preserve-3d' }} className="w-40 h-40 relative transition-transform duration-100 ease-linear">
        <div className="absolute inset-0 bg-blue-500/90 border-4 border-white" style={{ transform: 'translateZ(80px)' }} />
        <div className="absolute inset-0 bg-blue-600/90 border-4 border-white" style={{ transform: 'rotateY(90deg) translateZ(80px)' }} />
        <div className="absolute inset-0 bg-blue-700/90 border-4 border-white" style={{ transform: 'rotateY(-90deg) translateZ(80px)' }} />
        <div className="absolute inset-0 bg-blue-800/90 border-4 border-white" style={{ transform: 'rotateX(90deg) translateZ(80px)' }} />
        <div className="absolute inset-0 bg-blue-400/90 border-4 border-white" style={{ transform: 'rotateX(-90deg) translateZ(80px)' }} />
        <div className="absolute inset-0 bg-blue-900/90 border-4 border-white" style={{ transform: 'rotateY(180deg) translateZ(80px)' }} />
      </div>
    )
  },
  { 
    name: 'Cylinder', 
    description: 'A cylinder is like a can of soup!',
    render: (rot: { x: number, y: number }) => (
      <div style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transformStyle: 'preserve-3d' }} className="w-40 h-64 relative transition-transform duration-100 ease-linear">
        {[0, 45, 90, 135].map(deg => (
          <div key={deg} className="absolute inset-0 bg-cyan-400/60 border-x-4 border-white/50" style={{ transform: `rotateY(${deg}deg)` }} />
        ))}
        <div className="absolute top-0 w-40 h-40 bg-cyan-200 border-4 border-white rounded-full" style={{ transform: 'translateY(-20px) rotateX(90deg)' }} />
        <div className="absolute bottom-0 w-40 h-40 bg-cyan-600 border-4 border-white rounded-full" style={{ transform: 'translateY(20px) rotateX(90deg)' }} />
      </div>
    )
  },
  {
    name: 'Octahedron',
    description: 'Eight sides! It looks like two pyramids stuck together!',
    render: (rot: { x: number, y: number }) => (
      <div style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transformStyle: 'preserve-3d' }} className="w-40 h-40 relative transition-transform duration-100 ease-linear">
        <div className="absolute inset-0 bg-emerald-400 border-2 border-white/50" style={{ transform: 'translateY(-20px) rotateY(0deg) rotateX(35deg) translateZ(28px)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute inset-0 bg-emerald-500 border-2 border-white/50" style={{ transform: 'translateY(-20px) rotateY(90deg) rotateX(35deg) translateZ(28px)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute inset-0 bg-emerald-600 border-2 border-white/50" style={{ transform: 'translateY(-20px) rotateY(180deg) rotateX(35deg) translateZ(28px)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute inset-0 bg-emerald-700 border-2 border-white/50" style={{ transform: 'translateY(-20px) rotateY(270deg) rotateX(35deg) translateZ(28px)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute inset-0 bg-emerald-400 border-2 border-white/50" style={{ transform: 'translateY(20px) rotateY(0deg) rotateX(-35deg) translateZ(28px) rotate(180deg)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute inset-0 bg-emerald-500 border-2 border-white/50" style={{ transform: 'translateY(20px) rotateY(90deg) rotateX(-35deg) translateZ(28px) rotate(180deg)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute inset-0 bg-emerald-600 border-2 border-white/50" style={{ transform: 'translateY(20px) rotateY(180deg) rotateX(-35deg) translateZ(28px) rotate(180deg)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute inset-0 bg-emerald-700 border-2 border-white/50" style={{ transform: 'translateY(20px) rotateY(270deg) rotateX(-35deg) translateZ(28px) rotate(180deg)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      </div>
    )
  },
  {
    name: 'Torus',
    description: 'A real 3D doughnut! Look through the middle!',
    render: (rot: { x: number, y: number }) => (
      <div style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transformStyle: 'preserve-3d' }} className="w-64 h-64 relative flex items-center justify-center transition-transform duration-100 ease-linear">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-48 h-48 border-[15px] border-pink-500 rounded-full" 
            style={{ 
              transform: `rotateY(${i * 30}deg)`, 
              borderColor: `rgba(236, 72, 153, ${0.3 + (i % 2) * 0.4})`,
              boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)'
            }} 
          />
        ))}
        <div className="absolute w-52 h-52 border-[2px] border-white/20 rounded-full animate-pulse" />
      </div>
    )
  },
  {
    name: 'Prism',
    description: 'A triangular prism! It is like a slice of yummy cake!',
    render: (rot: { x: number, y: number }) => (
      <div style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transformStyle: 'preserve-3d' }} className="w-40 h-40 relative transition-transform duration-100 ease-linear">
        <div className="absolute inset-0 bg-purple-500 border-4 border-white" style={{ transform: 'rotateX(90deg) translateZ(-40px)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute inset-0 bg-purple-300 border-4 border-white" style={{ transform: 'rotateX(90deg) translateZ(40px)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute w-40 h-80 bg-purple-400 border-4 border-white" style={{ transform: 'translateY(-20px) translateZ(35px) rotateX(0deg)' }} />
        <div className="absolute w-40 h-80 bg-purple-600 border-4 border-white" style={{ transform: 'translateY(-20px) rotateY(120deg) translateZ(35px)' }} />
        <div className="absolute w-40 h-80 bg-purple-700 border-4 border-white" style={{ transform: 'translateY(-20px) rotateY(-120deg) translateZ(35px)' }} />
      </div>
    )
  }
];

export default function ThreeDExploreGame({ onComplete, onCancel, speak, parentSound }: { onComplete: (r: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [rotation, setRotation] = useState({ x: -20, y: 45 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  
  const shape = SHAPES_3D[currentIdx];

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const handleStart = (clientX: number, clientY: number) => {
    playParentVoice();
    isDragging.current = true;
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;
    setRotation(prev => ({
      x: prev.x - dy * 0.5,
      y: prev.y + dx * 0.5
    }));
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  const nextShape = (e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    if (currentIdx < SHAPES_3D.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setRotation({ x: -20, y: 45 });
      speak(`Next shape: ${SHAPES_3D[currentIdx + 1].name}. ${SHAPES_3D[currentIdx+1].description}`);
    } else {
      onComplete(30);
    }
  };

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-indigo-50 flex flex-col items-center p-6 animate-pop overflow-hidden select-none"
    >
      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-indigo-500 px-8 py-3 rounded-full font-black border-4 border-indigo-100 shadow-lg active:scale-95 transition-all">Back to School 🏫</button>
        <h2 className="text-indigo-600 font-black text-2xl uppercase tracking-widest">3D Magic</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 w-full max-w-2xl bg-white rounded-[5rem] border-[12px] border-indigo-100 p-10 shadow-inner relative overflow-hidden">
        
        <div 
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
          className="w-full h-96 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing perspective-1000"
        >
          {shape.render(rotation)}
        </div>

        <div className="text-center pointer-events-none">
          <h3 className="text-4xl font-black text-indigo-900 mb-2 uppercase">{shape.name}</h3>
          <p className="text-indigo-300 font-bold max-w-xs">{shape.description}</p>
        </div>

        <div className="flex gap-4">
           <button onClick={nextShape} className="px-10 py-5 bg-indigo-600 text-white rounded-full font-black uppercase border-4 border-white shadow-lg text-xl">
             {currentIdx === SHAPES_3D.length - 1 ? 'Finish ✅' : 'Next Shape ➡️'}
           </button>
        </div>
      </div>

      <p className="mt-8 text-indigo-400 font-black uppercase tracking-widest text-center pointer-events-none">
        Drag to spin the {shape.name}!
      </p>
    </div>
  );
}
