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

/* ─── Multiplayer (1v1) ──────────────────────────────────────────────────── */

export type MatchStatus = 'waiting' | 'playing' | 'finished' | 'cancelled';
export type MatchRole   = 'host' | 'guest';
export type RoundWinner = 'host' | 'guest' | 'tie' | null;

/** A question as sent to the browser in a match — NEVER includes the answer. */
export interface MatchQuestion {
  id:         number;
  question:   string;
  options:    string[];
  category:   Category;
  difficulty: Difficulty;
}

/** Per-player outcome of a single resolved round. */
export interface RoundPlayerResult {
  selected: string;
  correct:  boolean;
  timeMs:   number;
}

/** Result of the round that just resolved — drives the synced reveal. */
export interface LastRound {
  round:         number;
  correctAnswer: string;
  host:          RoundPlayerResult | null;
  guest:         RoundPlayerResult | null;
  winner:        RoundWinner;
}

/** Public match state, as read by the browser (no correct answers). */
export interface MatchState {
  id:             string;
  status:         MatchStatus;
  questions:      MatchQuestion[];
  totalRounds:    number;
  currentRound:   number;
  roundStartedAt: string | null;
  roundDeadline:  string | null;
  host:  MatchPlayer;
  guest: MatchPlayer | null;
  lastRound: LastRound | null;
  winner: RoundWinner;
  rematchId: string | null;
}

export interface MatchPlayer {
  id:     string;
  name:   string;
  avatar: string;
  score:  number;
}
