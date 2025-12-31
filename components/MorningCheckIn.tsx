
import React, { useState, useEffect, useMemo, useRef } from 'react';

const WEATHER_OPTIONS = [
  { id: 'sunny', emoji: '☀️', label: 'Sunny' },
  { id: 'cloudy', emoji: '☁️', label: 'Cloudy' },
  { id: 'rainy', emoji: '🌧️', label: 'Rainy' },
  { id: 'cold', emoji: '❄️', label: 'Cold' },
  { id: 'windy', emoji: '💨', label: 'Windy' },
];

const EMOTION_OPTIONS = [
  { id: 'happy', emoji: '😊', label: 'Happy', verse: "God loves to see your happy face! He gives us many good things to enjoy." },
  { id: 'excited', emoji: '🤩', label: 'Excited', verse: "Wow! Your heart is dancing! God has something wonderful planned for you today." },
  { id: 'angry', emoji: '😡', label: 'Angry', verse: "It's okay to feel cross, but remember to take a big breath. God will help you feel calm again." },
  { id: 'frustrated', emoji: '😤', label: 'Frustrated', verse: "When things are tricky, don't worry! Just try again. God is your helper." },
  { id: 'lonely', emoji: '😔', label: 'Lonely', verse: "You are never ever alone. God is always, always right there with you, Jadzia." },
  { id: 'bored', emoji: '😐', label: 'Bored', verse: "Let's find some magic! God made a world full of secrets for us to discover." },
  { id: 'brave', emoji: '🦁', label: 'Brave', verse: "You are strong because God is holding your hand today!" },
  { id: 'sad', emoji: '😢', label: 'Sad', verse: "It's okay to cry. God is right next to you, hugging your heart." },
];

const BIBLE_VERSES = [
  { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
  { text: "Children, obey your parents in the Lord, for this is right.", ref: "Ephesians 6:1" },
  { text: "The Lord is my shepherd; I shall not want.", ref: "Psalm 23:1" },
  { text: "Your word is a lamp to my feet and a light to my path.", ref: "Psalm 119:105" },
  { text: "Trust in the Lord with all your heart.", ref: "Proverbs 3:5" },
  { text: "For God so loved the world that He gave His only begotten Son.", ref: "John 3:16" },
  { text: "In the beginning God created the heavens and the earth.", ref: "Genesis 1:1" },
  { text: "God is our refuge and strength, a very present help in trouble.", ref: "Psalm 46:1" },
  { text: "This is the day the Lord has made; We will rejoice and be glad in it.", ref: "Psalm 118:24" },
  { text: "Give thanks to the Lord, for He is good!", ref: "Psalm 107:1" },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOME_ADDRESS = "26 Oak Hill";

// Latitude/Longitude for Mooikloof, Pretoria East
const MOOIKLOOF_COORDS = { lat: -25.827, lon: 28.324 };

export const MorningCheckIn = ({ onComplete, speak }: { onComplete: (reward: number, data: any) => void, speak: (t: string) => void }) => {
  const [selectedWeather, setSelectedWeather] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [actualWeather, setActualWeather] = useState<string | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(true);
  const lastSpokenRef = useRef<string | null>(null);

  const todayStr = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);
  const dailyVerse = useMemo(() => BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)], []);

  // Fetch real weather for Mooikloof
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${MOOIKLOOF_COORDS.lat}&longitude=${MOOIKLOOF_COORDS.lon}&current_weather=true`);
        const data = await res.json();
        const code = data.current_weather.weathercode;
        
        // Map WMO codes to our labels
        let weatherLabel = 'Sunny';
        if (code >= 1 && code <= 3) weatherLabel = 'Cloudy';
        if (code >= 51 && code <= 99) weatherLabel = 'Rainy';
        if (code >= 71 && code <= 77) weatherLabel = 'Cold';
        if (data.current_weather.windspeed > 25) weatherLabel = 'Windy';
        
        setActualWeather(weatherLabel);
      } catch (e) {
        console.error("Weather fetch failed", e);
        setActualWeather('Sunny'); // Fallback
      } finally {
        setIsWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  const questions: Record<number, string> = {
    0: `Safety Step! Do you remember where we live? We live at ${HOME_ADDRESS}!`,
    1: `Time for our Sword of the Spirit! Listen to today's magic verse from the Bible: ${dailyVerse.text} ${dailyVerse.ref}`,
    2: "What day is it, Jadzia?",
    3: "How is the weather today in Mooikloof?",
    4: "How does your heart feel?"
  };

  useEffect(() => {
    const text = questions[step];
    if (text && lastSpokenRef.current !== text) {
      speak(text);
      lastSpokenRef.current = text;
    }
  }, [step, questions, speak]);

  const handleNext = () => {
    if (step === 2) {
      if (selectedDay !== todayStr) {
        speak(`Wait! Is today really ${selectedDay}? Look at the magic calendar... I think it is ${todayStr}! Try again, Jadzia!`);
        return;
      }
    }

    if (step === 3) {
      if (selectedWeather !== actualWeather) {
        speak(`Oh! Look out the window at Mooikloof! Is it really ${selectedWeather}? I think the sky looks more ${actualWeather} right now!`);
        return;
      }
    }

    if (step === 4) {
      onComplete(35, { 
        day: selectedDay, 
        weather: selectedWeather, 
        emotion: selectedEmotion?.label,
        verse: dailyVerse.ref
      });
    } else {
      setStep(step + 1);
    }
  };

  const handleEmotionSelect = (e: any) => {
    setSelectedEmotion(e);
    speak(`Jadzia is feeling ${e.label}! ${e.verse}`);
  };

  const currentQuestion = questions[step];

  return (
    <div className="bg-white rounded-[4rem] p-10 border-[12px] border-pink-50 shadow-2xl animate-pop mb-10 text-center">
      <button 
        onClick={() => speak(currentQuestion)}
        className="w-full mb-8 p-8 bg-pink-50 rounded-[3rem] border-4 border-white shadow-xl active:scale-95 transition-all group hover:bg-pink-100"
      >
        <h3 className="text-2xl md:text-3xl font-black text-pink-600 uppercase flex items-center justify-center gap-3 leading-tight">
          <span>{step === 1 ? "Sword of the Spirit" : currentQuestion}</span>
          <span className="text-2xl group-hover:scale-125 transition-all">🔊</span>
        </h3>
      </button>

      {step === 0 && (
        <div className="animate-pop">
           <div className="bg-gradient-to-br from-pink-400 to-fuchsia-600 p-8 rounded-[3rem] border-8 border-white shadow-2xl text-white mb-6">
              <div className="text-8xl mb-4">🏠</div>
              <h4 className="text-xl font-black uppercase mb-2">Our Magic Address:</h4>
              <p className="text-4xl font-black leading-tight bg-white/20 p-4 rounded-2xl tracking-tighter">{HOME_ADDRESS}</p>
           </div>
           <p className="text-pink-700 font-bold italic">Safety first! We live at 26 Oak Hill!</p>
        </div>
      )}

      {step === 1 && (
        <div className="animate-pop">
           <div className="bg-gradient-to-br from-purple-400 to-indigo-600 p-8 rounded-[3rem] border-8 border-white shadow-2xl text-white mb-6">
              <div className="text-8xl mb-4">📖</div>
              <h4 className="text-xl font-black uppercase mb-2">{dailyVerse.ref}</h4>
              <p className="text-2xl font-black leading-tight bg-white/20 p-6 rounded-2xl italic">"{dailyVerse.text}"</p>
           </div>
           <p className="text-purple-700 font-bold">A powerful Sword for your heart!</p>
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-2 gap-4">
          {DAYS.map(day => (
            <button 
              key={day} 
              onClick={() => { setSelectedDay(day); speak(day); }} 
              className={`p-8 rounded-[2.5rem] font-black border-4 transition-all text-xl ${selectedDay === day ? 'bg-pink-600 text-white border-white scale-105 shadow-2xl' : 'bg-white text-pink-300 border-pink-50 hover:border-pink-200'}`}
            >
              {day}
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-wrap justify-center gap-6">
          {isWeatherLoading ? (
             <div className="animate-pulse text-blue-300 font-black uppercase">Checking Mooikloof Sky...</div>
          ) : WEATHER_OPTIONS.map(w => (
            <button 
              key={w.id} 
              onClick={() => { setSelectedWeather(w.label); speak(w.label); }} 
              className={`w-32 h-32 flex flex-col items-center justify-center rounded-[2.5rem] border-4 transition-all ${selectedWeather === w.label ? 'bg-blue-400 text-white border-white scale-110 shadow-2xl' : 'bg-white text-blue-200 border-blue-50 hover:border-blue-100'}`}
            >
              <span className="text-6xl">{w.emoji}</span>
              <span className="text-[10px] font-black uppercase mt-2">{w.label}</span>
            </button>
          ))}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-wrap justify-center gap-4">
          {EMOTION_OPTIONS.map(e => (
            <button 
              key={e.id} 
              onClick={() => handleEmotionSelect(e)} 
              className={`w-28 h-36 flex flex-col items-center justify-center rounded-[2.5rem] border-4 transition-all ${selectedEmotion?.id === e.id ? 'bg-fuchsia-500 text-white border-white scale-110 shadow-2xl' : 'bg-white text-fuchsia-300 border-fuchsia-50 hover:border-fuchsia-100'}`}
            >
              <span className="text-6xl">{e.emoji}</span>
              <span className="text-[10px] font-black uppercase mt-2">{e.label}</span>
            </button>
          ))}
          {selectedEmotion && (
            <div className="w-full mt-6 p-8 bg-fuchsia-50 rounded-[3rem] border-4 border-white italic font-bold text-fuchsia-700 animate-pop text-lg">
              "{selectedEmotion.verse}"
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={(step === 2 && !selectedDay) || (step === 3 && (!selectedWeather || isWeatherLoading)) || (step === 4 && !selectedEmotion)}
        className="w-full mt-10 py-8 bg-[#10b981] text-white rounded-[3rem] font-black text-2xl shadow-xl disabled:opacity-50 active:scale-95 transition-transform uppercase border-4 border-white"
      >
        {step === 4 ? "Let's Start Our Magic Day! ✨" : "Check and Continue ➡️"}
      </button>
    </div>
  );
};
