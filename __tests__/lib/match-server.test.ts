import { describe, it, expect } from 'vitest';
import { toPublicQuestions, TOTAL_ROUNDS, ROUND_TIME_MS, REVEAL_MS } from '@/lib/match-server';
import type { Question } from '@/lib/types';

const makeQuestion = (id: number, correctAnswer = 'Correct'): Question => ({
  id,
  question:      `Question ${id}?`,
  options:       ['Wrong A', 'Wrong B', 'Wrong C', correctAnswer],
  correctAnswer,
  category:      'science',
  difficulty:    'easy',
});

describe('toPublicQuestions', () => {
  it('strips correctAnswer from every question', () => {
    const qs = [makeQuestion(0, 'Respuesta'), makeQuestion(1, 'Otra')];
    const pub = toPublicQuestions(qs);
    pub.forEach((q) => expect(q).not.toHaveProperty('correctAnswer'));
  });

  it('keeps id, question, options, category, difficulty', () => {
    const q = makeQuestion(5, 'Litio');
    const [pub] = toPublicQuestions([q]);
    expect(pub.id).toBe(5);
    expect(pub.question).toBe('Question 5?');
    expect(pub.options).toEqual(['Wrong A', 'Wrong B', 'Wrong C', 'Litio']);
    expect(pub.category).toBe('science');
    expect(pub.difficulty).toBe('easy');
  });

  it('returns the same number of questions', () => {
    const qs = Array.from({ length: 10 }, (_, i) => makeQuestion(i));
    expect(toPublicQuestions(qs)).toHaveLength(10);
  });

  it('handles an empty array', () => {
    expect(toPublicQuestions([])).toEqual([]);
  });
});

describe('Constants', () => {
  it('TOTAL_ROUNDS is 10', () => {
    expect(TOTAL_ROUNDS).toBe(10);
  });

  it('ROUND_TIME_MS is 15 seconds', () => {
    expect(ROUND_TIME_MS).toBe(15_000);
  });

  it('REVEAL_MS is 2 seconds', () => {
    expect(REVEAL_MS).toBe(2_000);
  });
});
