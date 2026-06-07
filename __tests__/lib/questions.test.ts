import { describe, it, expect } from 'vitest';
import { getRandomQuestions, questions, AVATARS, CATEGORY_LABELS } from '@/lib/questions';

describe('getRandomQuestions', () => {
  it('returns the requested count', () => {
    expect(getRandomQuestions(15)).toHaveLength(15);
  });

  it('returns all questions when count exceeds the pool', () => {
    const result = getRandomQuestions(questions.length + 100);
    expect(result).toHaveLength(questions.length);
  });

  it('returns a subset of the full question pool', () => {
    const ids = new Set(questions.map((q) => q.id));
    getRandomQuestions(10).forEach((q) => expect(ids.has(q.id)).toBe(true));
  });

  it('each returned question has all required fields', () => {
    getRandomQuestions(5).forEach((q) => {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('question');
      expect(q).toHaveProperty('options');
      expect(q).toHaveProperty('correctAnswer');
      expect(q).toHaveProperty('category');
      expect(q).toHaveProperty('difficulty');
      expect(q.options).toHaveLength(4);
      expect(q.options).toContain(q.correctAnswer);
    });
  });

  it('returns no duplicate IDs in a single call', () => {
    const result = getRandomQuestions(15);
    const ids = result.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('produces different orderings across calls (probabilistic)', () => {
    const a = getRandomQuestions(10).map((q) => q.id);
    const b = getRandomQuestions(10).map((q) => q.id);
    // Identical order on every call would be a shuffle bug; this rarely fires
    let different = false;
    for (let i = 0; i < 5; i++) {
      const c = getRandomQuestions(10).map((q) => q.id);
      if (c.join() !== a.join()) { different = true; break; }
    }
    expect(different).toBe(true);
  });
});

describe('AVATARS', () => {
  it('contains at least one avatar', () => {
    expect(AVATARS.length).toBeGreaterThan(0);
  });

  it('has no duplicates', () => {
    expect(new Set(AVATARS).size).toBe(AVATARS.length);
  });
});

describe('CATEGORY_LABELS', () => {
  it('covers all categories used in questions', () => {
    const usedCategories = new Set(questions.map((q) => q.category));
    usedCategories.forEach((cat) => {
      expect(CATEGORY_LABELS).toHaveProperty(cat);
    });
  });
});
