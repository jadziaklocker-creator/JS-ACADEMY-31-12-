
import React, { useState, useRef, useEffect, useMemo } from 'react';

interface Point3D { x: number; y: number; z: number }
interface Face { indices: number[]; color: string; avgZ?: number }

export default function ThreeDExploreGame({ onComplete, onCancel, speak, parentSound }: { onComplete: (r: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [rotation, setRotation] = useState({ x: 0.4, y: 0.6 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const SHAPES = useMemo(() => [
    {
      name: 'CYLINDER',
      description: 'A cylinder is like a can of soup!',
      getGeometry: () => {
        const vertices: Point3D[] = [];
        const faces: Face[] = [];
        const segments = 16;
        const radius = 60; // Slightly smaller to avoid edges
        const height = 140;

        for (let i = 0; i < segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const x = Math.cos(theta) * radius;
          const z = Math.sin(theta) * radius;
          vertices.push({ x, y: -height / 2, z }); // Top ring
          vertices.push({ x, y: height / 2, z });  // Bottom ring
        }

        for (let i = 0; i < segments; i++) {
          const next = (i + 1) % segments;
          faces.push({ indices: [i * 2, next * 2, next * 2 + 1, i * 2 + 1], color: 'rgba(34, 211, 238, 0.4)' });
        }
        faces.push({ indices: Array.from({ length: segments }, (_, i) => i * 2), color: 'rgba(207, 250, 254, 0.6)' });
        faces.push({ indices: Array.from({ length: segments }, (_, i) => (segments - 1 - i) * 2 + 1), color: 'rgba(8, 145, 178, 0.5)' });

        return { vertices, faces };
      }
    },
    {
      name: 'SPHERE',
      description: 'A sphere is perfectly round like a ball!',
      getGeometry: () => {
        const vertices: Point3D[] = [];
        const faces: Face[] = [];
        const rings = 10;
        const sectors = 14;
        const radius = 80;

        for (let r = 0; r <= rings; r++) {
          const phi = (r / rings) * Math.PI;
          for (let s = 0; s <= sectors; s++) {
            const theta = (s / sectors) * Math.PI * 2;
            vertices.push({
              x: radius * Math.sin(phi) * Math.cos(theta),
              y: radius * Math.cos(phi),
              z: radius * Math.sin(phi) * Math.sin(theta)
            });
          }
        }
        for (let r = 0; r < rings; r++) {
          for (let s = 0; s < sectors; s++) {
            const first = r * (sectors + 1) + s;
            const second = first + sectors + 1;
            faces.push({ indices: [first, second, second + 1, first + 1], color: 'rgba(59, 130, 246, 0.4)' });
          }
        }
        return { vertices, faces };
      }
    },
    {
      name: 'CUBE',
      description: 'A cube has six flat square sides!',
      getGeometry: () => {
        const s = 65;
        const vertices: Point3D[] = [
          {x:-s, y:-s, z: s}, {x: s, y:-s, z: s}, {x: s, y: s, z: s}, {x:-s, y: s, z: s},
          {x:-s, y:-s, z:-s}, {x: s, y:-s, z:-s}, {x: s, y: s, z:-s}, {x:-s, y: s, z:-s}
        ];
        const faces: Face[] = [
          {indices:[0,1,2,3], color:'rgba(96, 165, 250, 0.4)'}, {indices:[1,5,6,2], color:'rgba(59, 130, 246, 0.5)'},
          {indices:[5,4,7,6], color:'rgba(37, 99, 235, 0.4)'}, {indices:[4,0,3,7], color:'rgba(30, 64, 175, 0.4)'},
          {indices:[4,5,1,0], color:'rgba(147, 197, 253, 0.5)'}, {indices:[3,2,6,7], color:'rgba(30, 58, 138, 0.5)'}
        ];
        return { vertices, faces };
      }
    }
  ], []);

  const currentShape = SHAPES[currentIdx];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { vertices, faces } = currentShape.getGeometry();
    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      const projected = vertices.map(v => {
        // Rotate
        let x = v.x * Math.cos(rotation.y) - v.z * Math.sin(rotation.y);
        let z = v.x * Math.sin(rotation.y) + v.z * Math.cos(rotation.y);
        let y = v.y * Math.cos(rotation.x) - z * Math.sin(rotation.x);
        z = v.y * Math.sin(rotation.x) + z * Math.cos(rotation.x);
        
        // Perspective (Constant 1.0 to keep aspect ratio stable for 5yo)
        const perspective = 600 / (600 + z);
        return { x: x * perspective + width / 2, y: y * perspective + height / 2, z: z };
      });

      // Depth sort
      const sortedFaces = faces.map(f => {
        const avgZ = f.indices.reduce((sum, idx) => sum + projected[idx].z, 0) / f.indices.length;
        return { ...f, avgZ };
      }).sort((a, b) => b.avgZ - a.avgZ);

      sortedFaces.forEach(f => {
        ctx.beginPath();
        f.indices.forEach((idx, i) => {
          if (i === 0) ctx.moveTo(projected[idx].x, projected[idx].y);
          else ctx.lineTo(projected[idx].x, projected[idx].y);
        });
        ctx.closePath();
        ctx.fillStyle = f.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Clean blueprint grid
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for(let i=0; i<=10; i++) {
        const pos = i * (width/10);
        ctx.moveTo(pos, 0); ctx.lineTo(pos, height);
        ctx.moveTo(0, pos); ctx.lineTo(width, pos);
      }
      ctx.stroke();
    };

    render();
  }, [currentIdx, rotation, currentShape]);

  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;
    setRotation(prev => ({ x: prev.x + dy * 0.01, y: prev.y + dx * 0.01 }));
    lastPos.current = { x: clientX, y: clientY };
  };

  const handleEnd = () => { isDragging.current = false; };

  const nextShape = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
    if (currentIdx < SHAPES.length - 1) {
      setCurrentIdx(currentIdx + 1);
      speak(`Next magic shape: ${SHAPES[currentIdx + 1].name}!`);
    } else {
      onComplete(40);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center p-8 select-none animate-pop overflow-hidden">
      {/* Top Left Escape Button */}
      <button 
        onClick={onCancel} 
        className="absolute top-10 left-10 bg-white text-indigo-500 w-16 h-16 rounded-full flex items-center justify-center border-4 border-indigo-50 shadow-xl active:scale-90 transition-all text-2xl z-50 hover:bg-indigo-50"
      >
        ❌
      </button>

      <div className="w-full max-w-2xl flex flex-col items-center gap-10">
        <div 
          className="relative aspect-square w-full max-w-[450px] bg-indigo-50/30 rounded-[5rem] border-[12px] border-white shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing transition-all overflow-hidden"
          onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={(e) => handleStart(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handleEnd}
        >
          {/* Internal Grid Decoration */}
          <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:20px_20px]" />
          
          <canvas 
            ref={canvasRef} 
            width={500} 
            height={500} 
            className="w-full h-full object-contain pointer-events-none" 
          />
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-7xl font-black text-[#2e1065] uppercase tracking-tighter drop-shadow-sm">{currentShape.name}</h2>
          <p className="text-2xl font-bold text-[#a5b4fc] italic">"{currentShape.description}"</p>
        </div>

        <button 
          onClick={nextShape} 
          className="mt-4 px-20 py-8 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-[2.5rem] font-black text-4xl shadow-[0_12px_0_#3730a3] hover:scale-[1.05] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest border-4 border-white flex items-center gap-4"
        >
          <span>{currentIdx === SHAPES.length - 1 ? "FINISH" : "NEXT SHAPE"}</span>
          <span className="text-3xl">➡️</span>
        </button>
      </div>

      <div className="absolute bottom-8 bg-indigo-50/50 px-10 py-3 rounded-full border-2 border-indigo-100">
        <p className="text-indigo-200 font-black uppercase text-[10px] tracking-[0.4em]">
          TOUCH AND SPIN THE MAGIC SHAPE!
        </p>
      </div>
    </div>
  );
}
