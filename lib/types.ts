export type Category = 'geography' | 'science' | 'history' | 'art' | 'sports' | 'technology' | 'nature' | 'math';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  category: Category;
  difficulty: Difficulty;
}

export interface RankingEntry {
  id: string;
  name: string;
  avatar: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  streak: number;
  date: string;
  duration: number; // seconds
}

export interface GameState {
  playerName: string;
  avatar: string;
  currentQuestion: number;
  score: number;
  streak: number;
  maxStreak: number;
  answers: AnswerRecord[];
  startTime: number;
}

export interface AnswerRecord {
  questionId: number;
  selected: string;
  correct: boolean;
  timeSpent: number;
}
