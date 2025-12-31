
import React, { useState, useEffect, useCallback, useRef } from 'react';

const MAZE_SIZE = 9; 

export default function MazeGame({ onComplete, onCancel, parentSound }: { onComplete: (reward: number, time: number, errors: number) => void, onCancel: () => void, parentSound?: string }) {
  const [maze, setMaze] = useState<number[][]>([]);
  const [pos, setPos] = useState({ x: 1, y: 1 });
  const [won, setWon] = useState(false);
  const [startTime] = useState(Date.now());
  const [errors, setErrors] = useState(0);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  const generateMaze = useCallback(() => {
    const newMaze = Array(MAZE_SIZE).fill(0).map(() => Array(MAZE_SIZE).fill(1));
    const walk = (x: number, y: number) => {
      newMaze[y][x] = 0;
      const dirs = [[0, 2], [0, -2], [2, 0], [-2, 0]].sort(() => Math.random() - 0.5);
      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx > 0 && nx < MAZE_SIZE && ny > 0 && ny < MAZE_SIZE && newMaze[ny][nx] === 1) {
          newMaze[y + dy / 2][x + dx / 2] = 0;
          walk(nx, ny);
        }
      }
    };
    walk(1, 1);
    const queue: {x: number, y: number, path: {x: number, y: number}[]}[] = [{ x: 1, y: 1, path: [{x: 1, y: 1}] }];
    const visited = new Set(['1-1']);
    let solutionPath: {x: number, y: number}[] = [];
    while (queue.length > 0) {
      const { x, y, path } = queue.shift()!;
      if (x === MAZE_SIZE - 2 && y === MAZE_SIZE - 2) {
        solutionPath = path;
        break;
      }
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < MAZE_SIZE && ny >= 0 && ny < MAZE_SIZE && newMaze[ny][nx] === 0 && !visited.has(`${nx}-${ny}`)) {
          visited.add(`${nx}-${ny}`);
          queue.push({ x: nx, y: ny, path: [...path, { x: nx, y: ny }] });
        }
      }
    }
    newMaze[1][1] = 2; 
    newMaze[MAZE_SIZE - 2][MAZE_SIZE - 2] = 3; 
    let trapsPlaced = 0;
    let attempts = 0;
    const pathSet = new Set(solutionPath.map(p => `${p.x}-${p.y}`));
    while(trapsPlaced < 4 && attempts < 200) {
        let tx = Math.floor(Math.random() * (MAZE_SIZE - 2)) + 1;
        let ty = Math.floor(Math.random() * (MAZE_SIZE - 2)) + 1;
        if (newMaze[ty][tx] === 0 && !pathSet.has(`${tx}-${ty}`)) {
            newMaze[ty][tx] = 4; 
            trapsPlaced++;
        }
        attempts++;
    }
    setMaze(newMaze);
    setPos({ x: 1, y: 1 });
    setWon(false);
  }, []);

  useEffect(() => {
    generateMaze();
  }, [generateMaze]);

  const playParentVoice = () => {
    if (parentSound && (!voiceRef.current || voiceRef.current.ended)) {
      voiceRef.current = new Audio(parentSound);
      voiceRef.current.play().catch(() => {});
    }
  };

  const move = (dx: number, dy: number, e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    if (won) return;
    const nx = pos.x + dx;
    const ny = pos.y + dy;
    if (nx >= 0 && nx < MAZE_SIZE && ny >= 0 && ny < MAZE_SIZE) {
      if (maze[ny][nx] !== 1) {
        setPos({ x: nx, y: ny });
        if (maze[ny][nx] === 4) {
            setErrors(prev => prev + 1);
            new Audio('https://www.soundjay.com/buttons/sounds/button-10.mp3').play().catch(() => {});
            setTimeout(() => setPos({ x: 1, y: 1 }), 200);
        } else if (maze[ny][nx] === 3) {
          setWon(true);
          const timeTaken = Math.floor((Date.now() - startTime) / 1000);
          new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3').play().catch(() => {});
          setTimeout(() => onComplete(30, timeTaken, errors), 2000);
        }
      } else {
        setErrors(prev => prev + 1);
      }
    }
  };

  if (maze.length === 0) return null;

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-cyan-900 flex flex-col items-center p-6 animate-pop"
    >
      <div className="w-full max-w-lg flex justify-between items-center mb-6">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-cyan-600 px-6 py-2 rounded-full font-black border-4 border-cyan-100 shadow-lg active:scale-95 transition-all uppercase text-xs">Back to School 🏫</button>
        <button onClick={(e) => { e.stopPropagation(); playParentVoice(); generateMaze(); }} className="bg-cyan-500 text-white px-6 py-2 rounded-full font-black border-4 border-white shadow-lg active:scale-95">New Maze ✨</button>
      </div>

      <div className="bg-white p-4 rounded-[3rem] border-8 border-cyan-400 shadow-2xl relative pointer-events-none">
        <div 
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${MAZE_SIZE}, minmax(0, 1fr))` }}
        >
          {maze.map((row, y) => row.map((cell, x) => (
            <div key={`${x}-${y}`} className={`w-8 h-8 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
              cell === 1 ? 'bg-orange-400 shadow-inner' : cell === 4 ? 'bg-red-400 animate-pulse' : 'bg-cyan-50'
            }`}>
              {cell === 3 && '🎁'}
              {cell === 4 && '💥'}
              {pos.x === x && pos.y === y && <span className="text-3xl bouncy">🧜‍♀️</span>}
            </div>
          )))}
        </div>
        {won && (
          <div className="absolute inset-0 bg-white/90 rounded-[2rem] flex flex-col items-center justify-center animate-pop">
            <span className="text-8xl mb-4">🏆</span>
            <p className="text-3xl font-black text-cyan-600 uppercase">Maze Master!</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-10">
        <div />
        <button onClick={(e) => move(0, -1, e)} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl text-4xl shadow-lg border-4 border-cyan-100 active:scale-90 transition-all flex items-center justify-center">⬆️</button>
        <div />
        <button onClick={(e) => move(-1, 0, e)} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl text-4xl shadow-lg border-4 border-cyan-100 active:scale-90 transition-all flex items-center justify-center">⬅️</button>
        <button onClick={(e) => move(0, 1, e)} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl text-4xl shadow-lg border-4 border-cyan-100 active:scale-90 transition-all flex items-center justify-center">⬇️</button>
        <button onClick={(e) => move(1, 0, e)} className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl text-4xl shadow-lg border-4 border-cyan-100 active:scale-90 transition-all flex items-center justify-center">➡️</button>
      </div>
    </div>
  );
}
