import { describe, it, expect } from 'vitest';

// Replicate the server-side validation logic from app/api/rankings/route.ts

function validateScore(
  score: number,
  answers: { correct: boolean; timeSpent: number }[],
  percentage: number,
): { ok: boolean; reason?: string } {
  const correct = answers.filter(a => a.correct).length;
  const expectedPct = Math.round((correct / answers.length) * 100);

  if (Math.abs(percentage - expectedPct) > 1) {
    return { ok: false, reason: 'percentage mismatch' };
  }
  if (score > answers.length * 2) {
    return { ok: false, reason: 'score too high' };
  }
  return { ok: true };
}

describe('score validation', () => {
  it('accepts a valid perfect game', () => {
    const answers = Array.from({ length: 15 }, () => ({ correct: true, timeSpent: 5 }));
    expect(validateScore(15, answers, 100).ok).toBe(true);
  });

  it('accepts a valid zero-score game', () => {
    const answers = Array.from({ length: 15 }, () => ({ correct: false, timeSpent: 15 }));
    expect(validateScore(0, answers, 0).ok).toBe(true);
  });

  it('rejects score higher than possible (cheat attempt)', () => {
    const answers = Array.from({ length: 15 }, () => ({ correct: true, timeSpent: 5 }));
    const result = validateScore(31, answers, 100); // max possible is 30
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('score too high');
  });

  it('rejects tampered percentage', () => {
    const answers = [
      ...Array.from({ length: 7 }, () => ({ correct: true, timeSpent: 5 })),
      ...Array.from({ length: 8 }, () => ({ correct: false, timeSpent: 10 })),
    ];
    // Real percentage is 47%, client claims 100%
    const result = validateScore(7, answers, 100);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('percentage mismatch');
  });

  it('tolerates 1% rounding difference', () => {
    // 10/15 = 66.67% → rounds to 67, client sends 66
    const answers = [
      ...Array.from({ length: 10 }, () => ({ correct: true, timeSpent: 5 })),
      ...Array.from({ length: 5 },  () => ({ correct: false, timeSpent: 10 })),
    ];
    expect(validateScore(10, answers, 66).ok).toBe(true);
    expect(validateScore(10, answers, 67).ok).toBe(true);
  });
});
