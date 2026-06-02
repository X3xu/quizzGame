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

/** Map of Supabase category strings → app Category type */
const CATEGORY_MAP: Record<string, Category> = {
  tecnologia:  'technology',
  technology:  'technology',
  ciencia:     'science',
  science:     'science',
  historia:    'history',
  history:     'history',
  geografia:   'geography',
  geography:   'geography',
  deportes:    'sports',
  sports:      'sports',
  arte:        'art',
  art:         'art',
  naturaleza:  'nature',
  nature:      'nature',
  matematicas: 'math',
  math:        'math',
  general:     'science', // fallback
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

/**
 * Fetch questions for a game session.
 * Tries Supabase first; falls back to the local hardcoded list if unavailable.
 */
export async function getQuestionsForGame(count = 15): Promise<Question[]> {
  if (!supabase) return getLocalFallback(count);

  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('status', 'approved')
      .limit(300);

    if (error || !data || data.length === 0) {
      return getLocalFallback(count);
    }

    const picked = shuffled(data as DbQuestion[]).slice(0, count);

    // If DB doesn't have enough, top up from local questions
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

function getLocalFallback(count: number): Question[] {
  return shuffled(localQuestions).slice(0, count);
}
