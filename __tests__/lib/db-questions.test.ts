import { describe, it, expect } from 'vitest';
import { dbToQuestion, type DbQuestion } from '@/lib/db-questions';

const makeDbQ = (overrides: Partial<DbQuestion> = {}): DbQuestion => ({
  id:           'abc-123',
  question:     '¿Cuál es la capital de Francia?',
  options:      ['Madrid', 'París', 'Roma', 'Berlín'],
  correct_answer: 'París',
  category:     'geography',
  difficulty:   'easy',
  source:       'user',
  status:       'approved',
  ...overrides,
});

describe('dbToQuestion', () => {
  it('maps all fields correctly', () => {
    const q = dbToQuestion(makeDbQ(), 0);
    expect(q.id).toBe(0);
    expect(q.question).toBe('¿Cuál es la capital de Francia?');
    expect(q.options).toEqual(['Madrid', 'París', 'Roma', 'Berlín']);
    expect(q.correctAnswer).toBe('París');
    expect(q.category).toBe('geography');
    expect(q.difficulty).toBe('easy');
  });

  it('uses the idx parameter as the id', () => {
    expect(dbToQuestion(makeDbQ(), 7).id).toBe(7);
    expect(dbToQuestion(makeDbQ(), 42).id).toBe(42);
  });

  it('maps Spanish category names to English', () => {
    expect(dbToQuestion(makeDbQ({ category: 'tecnologia' }), 0).category).toBe('technology');
    expect(dbToQuestion(makeDbQ({ category: 'ciencia' }), 0).category).toBe('science');
    expect(dbToQuestion(makeDbQ({ category: 'historia' }), 0).category).toBe('history');
    expect(dbToQuestion(makeDbQ({ category: 'geografia' }), 0).category).toBe('geography');
    expect(dbToQuestion(makeDbQ({ category: 'deportes' }), 0).category).toBe('sports');
    expect(dbToQuestion(makeDbQ({ category: 'arte' }), 0).category).toBe('art');
    expect(dbToQuestion(makeDbQ({ category: 'naturaleza' }), 0).category).toBe('nature');
    expect(dbToQuestion(makeDbQ({ category: 'matematicas' }), 0).category).toBe('math');
  });

  it('passes through English category names unchanged', () => {
    expect(dbToQuestion(makeDbQ({ category: 'technology' }), 0).category).toBe('technology');
    expect(dbToQuestion(makeDbQ({ category: 'science' }), 0).category).toBe('science');
  });

  it('falls back to "science" for unknown categories', () => {
    expect(dbToQuestion(makeDbQ({ category: 'videogames' }), 0).category).toBe('science');
  });

  it('maps "general" to "science"', () => {
    expect(dbToQuestion(makeDbQ({ category: 'general' }), 0).category).toBe('science');
  });

  it('preserves difficulty', () => {
    expect(dbToQuestion(makeDbQ({ difficulty: 'hard' }), 0).difficulty).toBe('hard');
    expect(dbToQuestion(makeDbQ({ difficulty: 'medium' }), 0).difficulty).toBe('medium');
  });
});
