
export const TaskCategory = {
  LITERACY: 'Literacy (Languages)',
  NUMERACY: 'Numeracy (Maths)',
  LIFE_SKILLS: 'Life Skills',
  CREATIVE: 'Creative Arts',
  SCOUTING: 'Scouting & Safety',
  SOCIAL: 'Social Skills & Empathy',
  SELF_DEFENSE: 'Safety & Self-Defense',
  CODING: 'Magic Coding (Sequencing)',
  AFRIKAANS: 'Afrikaans (Taal)',
  ZULU: 'isiZulu (Lugha)',
  BIBLE_STUDY: 'Bible Study (Sword of the Spirit)'
} as const;

export type TaskCategoryType = typeof TaskCategory[keyof typeof TaskCategory];

export const TimeSlot = {
  MORNING: 'Sunrise Spells (Morning)',
  MIDDAY: 'Midday Magic (Lunch)',
  AFTERNOON: 'Sunset Stories (Afternoon)'
} as const;

export type TimeSlotType = typeof TimeSlot[keyof typeof TimeSlot];

export type Grade = 'Diamond' | 'Gold' | 'Silver' | 'Bronze' | 'Keep Trying' | 'Not Graded';

export type GameSession = {
  gameId: string;
  timestamp: number;
  score: number;
  timeTaken: number; // in seconds
  errors: number;
};

export type Task = {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  points: number;
  day: string;
  week: number;
  timeSlot: TimeSlotType;
  grade?: Grade;
  parentFeedback?: string;
  completionTimestamp?: number;
};

export type Message = {
  role: 'user' | 'model';
  text: string;
  audio?: string;
};

export type FidgetToy = {
  id: string;
  emoji: string;
  name: string;
  cost: number;
  unlocked: boolean;
  animationClass?: string;
  soundUrl?: string;
  description?: string;
  type?: 'toy' | 'game';
  gameId?: string;
  colorClass?: string;
};

export type ActiveGame = 'none' | 'unicorn-counting' | 'memory-match' | 'bubble-pop' | 'maze' | 'fidget' | 'fidget-play' | 'new-words' | 'shapes-sides' | '3d-explore' | 'spell-me' | 'talk-to-friends' | 'art-canvas' | 'clock-game';

export type LessonPart = {
  title: string;
  content: string;
  action: string;
  visualHint?: string;
};

export type Lesson = {
  subject: string;
  parts: LessonPart[];
  bigGirlChallenge: {
    title: string;
    content: string;
  };
};
