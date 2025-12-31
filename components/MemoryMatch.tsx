
import React, { useState, useEffect, useRef } from 'react';

const EMOJI_NAMES: Record<string, string> = {
  '🦄': 'Unicorn',
  '🦋': 'Butterfly',
  '🌸': 'Flower',
  '🌈': 'Rainbow',
  '🍦': 'Ice cream',
  '🦁': 'Lion'
};

const EMOJIS = Object.keys(EMOJI_NAMES);

const MemoryMatch = ({ onComplete, onCancel, parentSound }: { onComplete: (reward: number, time: number, errors: number) => void; onCancel: () => void; parentSound?: string }) => {
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [startTime] = useState(Date.now());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const shuffled = [...EMOJIS, ...EMOJIS]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji, flipped: false, matched: false }));
    setCards(shuffled);
  }, []);

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.3;
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const playParentVoice = () => {
    if (parentSound && (!audioRef.current || audioRef.current.ended)) {
      audioRef.current = new Audio(parentSound);
      audioRef.current.play().catch(() => {});
    }
  };

  const handleCardClick = (index, e: React.MouseEvent) => {
    e.stopPropagation();
    playParentVoice();
    
    if (isLocked || cards[index].flipped || cards[index].matched || flippedIndices.length === 2) return;

    const emoji = cards[index].emoji;
    const name = EMOJI_NAMES[emoji] || 'Magic item';

    speak(name);
    const audio = new Audio('https://www.soundjay.com/buttons/sounds/button-37.mp3');
    audio.play().catch(() => {});

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsLocked(true);
      const [first, second] = newFlipped;
      
      if (cards[first].emoji === cards[second].emoji) {
        setTimeout(() => {
          speak(`A match! ${name}!`);
          setCards(prev => prev.map((c, i) => 
            (i === first || i === second) ? { ...c, matched: true } : c
          ));
          setFlippedIndices([]);
          setIsLocked(false);
          const audioMatch = new Audio('https://www.soundjay.com/misc/sounds/magic-chime-01.mp3');
          audioMatch.play().catch(() => {});
        }, 600);
      } else {
        setErrors(prev => prev + 1);
        setTimeout(() => {
          setCards(prev => prev.map((c, i) => 
            (i === first || i === second) ? { ...c, flipped: false } : c
          ));
          setFlippedIndices([]);
          setIsLocked(false);
        }, 1200);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);
      speak("Fantastic! You matched them all!");
      setTimeout(() => onComplete(25, timeTaken, errors), 2000);
    }
  }, [cards, onComplete, startTime, errors]);

  return (
    <div 
      onClick={playParentVoice}
      className="fixed inset-0 z-[2000] bg-purple-50 flex flex-col items-center p-6 animate-pop overflow-hidden"
    >
      <div className="w-full max-w-2xl flex justify-between items-center mb-8 relative z-[2100]">
        <button onClick={(e) => { e.stopPropagation(); onCancel(); }} className="bg-white text-purple-500 px-6 py-3 rounded-full font-black border-4 border-purple-100 active:scale-95 transition-transform">Back to School 🏫</button>
        <div className="flex gap-4 items-center">
          <div className="bg-white px-8 py-4 rounded-[3rem] border-4 border-purple-200 shadow-xl">
            <p className="text-purple-600 font-black text-2xl uppercase">Moves: {moves}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 max-w-2xl w-full flex-1 content-center relative z-[2050]">
        {cards.map((card, idx) => (
          <div
            key={card.id}
            onClick={(e) => handleCardClick(idx, e)}
            className="aspect-square cursor-pointer perspective-1000"
          >
            <div className={`w-full h-full rounded-[2rem] border-4 flex items-center justify-center text-4xl shadow-xl transition-all duration-500 transform ${card.flipped || card.matched ? 'bg-white border-pink-200 rotate-y-180' : 'bg-purple-600 border-white rotate-y-0 active:scale-90'}`}>
              {(card.flipped || card.matched) ? (
                <span className="select-none">{card.emoji}</span>
              ) : (
                <span className="text-white font-black select-none">✨</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryMatch;
