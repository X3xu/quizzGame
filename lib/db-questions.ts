import { unstable_cache } from 'next/cache';
import { supabase } from './supabase';
import { Question, Category, Difficulty } from './types';
import { questions as localQuestions } from './questions';

export interface DbQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  category: string;
  difficulty: string;
  source: string;
  status: string;
  review_note?: string;
}

const CATEGORY_MAP: Record<string, Category> = {
  tecnologia:  'technology', technology:  'technology',
  ciencia:     'science',    science:     'science',
  historia:    'history',    history:     'history',
  geografia:   'geography',  geography:   'geography',
  deportes:    'sports',     sports:      'sports',
  arte:        'art',        art:         'art',
  naturaleza:  'nature',     nature:      'nature',
  matematicas: 'math',       math:        'math',
  general:     'science',
};

function dbToQuestion(q: DbQuestion, idx: number): Question {
  return {
    id:            idx,
    question:      q.question,
    options:       q.options,
    correctAnswer: q.correct_answer,
    category:      (CATEGORY_MAP[q.category] ?? 'science') as Category,
    difficulty:    (q.difficulty as Difficulty) ?? 'medium',
  };
}

function shuffled<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getLocalFallback(count: number): Question[] {
  return shuffled(localQuestions).slice(0, count);
}

// Cache the full approved question pool for 5 minutes.
// This prevents a Supabase query on every game start.
const fetchApprovedQuestions = unstable_cache(
  async (): Promise<DbQuestion[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('status', 'approved')
      .limit(300);
    if (error || !data) return [];
    return data as DbQuestion[];
  },
  ['approved-questions'],
  { revalidate: 300 }, // 5 minutes
);

/**
 * Fetch questions for a game session.
 * Uses a 5-minute server-side cache for the full question pool, then
 * shuffles and picks locally — no extra DB round-trip per game.
 */
export async function getQuestionsForGame(count = 15): Promise<Question[]> {
  try {
    const pool = await fetchApprovedQuestions();
    if (pool.length === 0) return getLocalFallback(count);

    const picked = shuffled(pool).slice(0, count);

    if (picked.length < count) {
      const extra = getLocalFallback(count - picked.length);
      return [
        ...picked.map((q, i) => dbToQuestion(q, i)),
        ...extra.map((q, i) => ({ ...q, id: picked.length + i })),
      ];
    }

    return picked.map((q, i) => dbToQuestion(q, i));
  } catch {
    return getLocalFallback(count);
  }
}
