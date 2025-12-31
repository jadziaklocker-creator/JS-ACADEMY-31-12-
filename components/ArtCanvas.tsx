
import React, { useRef, useState, useEffect } from 'react';

const COLORS = [
  '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', 
  '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', 
  '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', 
  '#f97316', '#ef4444', '#71717a', '#000000', '#ffffff'
];

const STAMPS = [
  { emoji: '🇿🇦', label: 'SA Flag' },
  { emoji: '🦁', label: 'Lion' },
  { emoji: '🦓', label: 'Zebra' },
  { emoji: '🐘', label: 'Elephant' },
  { emoji: '🦒', label: 'Giraffe' },
  { emoji: '🌺', label: 'Protea' },
  { emoji: '🦄', label: 'Unicorn' },
  { emoji: '🧚', label: 'Fairy' },
  { emoji: '🌈', label: 'Rainbow' },
  { emoji: '✨', label: 'Magic' },
];

export default function ArtCanvas({ onComplete, onCancel, speak, parentSound }: { onComplete: (r: number) => void, onCancel: () => void, speak: (t: string) => void, parentSound?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ec4899');
  const [lineWidth, setLineWidth] = useState(10);
  const [tool, setTool] = useState<'brush' | 'eraser' | 'stamp'>('brush');
  const [selectedStamp, setSelectedStamp] = useState('🇿🇦');
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    playParentVoice();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    if (tool === 'stamp') {
      ctx.font = `${lineWidth * 5}px Fredoka`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedStamp, x, y);
      new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3').play().catch(() => {});
      return;
    }
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = tool === 'eraser' ? 'white' : color;
    ctx.lineWidth = lineWidth;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || tool === 'stamp') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    playParentVoice();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    speak("Canvas cleaned! Start again!");
  };

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-rose-50 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-5xl flex justify-between items-center mb-4 z-20">
        <button onClick={onCancel} className="bg-white text-rose-500 px-6 py-2 rounded-full font-black border-4 border-rose-100 shadow-lg active:scale-95 transition-all">Back to School 🏫</button>
        <h2 className="text-rose-600 font-black text-2xl uppercase tracking-widest pointer-events-none">Magic Canvas</h2>
        <button onClick={() => onComplete(20)} className="bg-green-500 text-white px-6 py-2 rounded-full font-black shadow-lg border-4 border-white active:scale-95 transition-all">I'm Finished! ✨</button>
      </div>

      <div className="flex-1 w-full max-w-6xl flex flex-col md:flex-row gap-6 overflow-hidden">
        <div className="w-full md:w-64 bg-white rounded-[3rem] border-8 border-rose-100 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar shadow-2xl">
          <div>
             <h3 className="text-xs font-black text-rose-300 uppercase tracking-widest mb-3">Magic Tools</h3>
             <div className="grid grid-cols-3 gap-2">
                <button onClick={() => { setTool('brush'); speak("Magic Brush"); playParentVoice(); }} className={`p-3 rounded-2xl text-2xl border-4 transition-all ${tool === 'brush' ? 'bg-rose-500 border-rose-200 scale-105 shadow-md' : 'bg-gray-50 border-gray-100'}`}>🖌️</button>
                <button onClick={() => { setTool('eraser'); speak("Fairy Eraser"); playParentVoice(); }} className={`p-3 rounded-2xl text-2xl border-4 transition-all ${tool === 'eraser' ? 'bg-rose-500 border-rose-200 scale-105 shadow-md' : 'bg-gray-50 border-gray-100'}`}>🧽</button>
                <button onClick={clearCanvas} className="p-3 rounded-2xl text-2xl border-4 bg-gray-50 border-gray-100 hover:bg-red-50">🗑️</button>
             </div>
          </div>

          <div>
             <h3 className="text-xs font-black text-rose-300 uppercase tracking-widest mb-3">Brush Size</h3>
             <input 
              type="range" 
              min="2" max="50" 
              value={lineWidth} 
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-full accent-rose-500" 
             />
          </div>

          <div>
             <h3 className="text-xs font-black text-rose-300 uppercase tracking-widest mb-3">Magic Colours</h3>
             <div className="grid grid-cols-4 gap-2">
                {COLORS.map(c => (
                  <button 
                    key={c} 
                    onClick={() => { setColor(c); setTool('brush'); playParentVoice(); }}
                    style={{ backgroundColor: c }}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${color === c && tool === 'brush' ? 'border-rose-400 scale-125' : 'border-white'}`}
                  />
                ))}
             </div>
          </div>

          <div>
             <h3 className="text-xs font-black text-rose-300 uppercase tracking-widest mb-3">Stickers</h3>
             <div className="grid grid-cols-4 gap-2">
                {STAMPS.map(s => (
                  <button 
                    key={s.label} 
                    onClick={() => { setSelectedStamp(s.emoji); setTool('stamp'); speak(s.label); playParentVoice(); }}
                    className={`p-2 rounded-xl text-2xl border-4 transition-all ${selectedStamp === s.emoji && tool === 'stamp' ? 'bg-rose-500 border-rose-200 scale-110 shadow-md' : 'bg-gray-50 border-gray-100'}`}
                  >
                    {s.emoji}
                  </button>
                ))}
             </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[4rem] border-[12px] border-rose-100 shadow-inner overflow-hidden relative group">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
          />
          <div className="absolute top-6 left-6 text-rose-200 pointer-events-none opacity-40 uppercase font-black text-xs tracking-widest">Jadzia's Magic Masterpiece</div>
        </div>
      </div>
    </div>
  );
}
