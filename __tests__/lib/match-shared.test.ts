import { describe, it, expect } from 'vitest';
import { rowToMatchState, type MatchRow } from '@/lib/match-shared';

const baseRow: MatchRow = {
  id:              'match-1',
  status:          'waiting',
  questions:       [],
  total_rounds:    10,
  current_round:   0,
  round_started_at: null,
  round_deadline:  null,
  host_id:         'host-uuid',
  host_name:       'Alice',
  host_avatar:     '🧠',
  host_score:      0,
  guest_id:        null,
  guest_name:      null,
  guest_avatar:    null,
  guest_score:     0,
  last_round:      null,
  winner:          null,
  rematch_id:      null,
};

describe('rowToMatchState', () => {
  it('maps all top-level scalar fields', () => {
    const state = rowToMatchState(baseRow);
    expect(state.id).toBe('match-1');
    expect(state.status).toBe('waiting');
    expect(state.totalRounds).toBe(10);
    expect(state.currentRound).toBe(0);
    expect(state.roundStartedAt).toBeNull();
    expect(state.roundDeadline).toBeNull();
    expect(state.lastRound).toBeNull();
    expect(state.winner).toBeNull();
    expect(state.rematchId).toBeNull();
  });

  it('maps host player correctly', () => {
    const state = rowToMatchState(baseRow);
    expect(state.host).toEqual({ id: 'host-uuid', name: 'Alice', avatar: '🧠', score: 0 });
  });

  it('sets guest to null when no guest has joined', () => {
    const state = rowToMatchState(baseRow);
    expect(state.guest).toBeNull();
  });

  it('maps guest player when present', () => {
    const rowWithGuest: MatchRow = {
      ...baseRow,
      guest_id:     'guest-uuid',
      guest_name:   'Bob',
      guest_avatar: '🦊',
      guest_score:  3,
    };
    const state = rowToMatchState(rowWithGuest);
    expect(state.guest).toEqual({ id: 'guest-uuid', name: 'Bob', avatar: '🦊', score: 3 });
  });

  it('maps round timestamps', () => {
    const now = new Date().toISOString();
    const deadline = new Date(Date.now() + 15_000).toISOString();
    const state = rowToMatchState({ ...baseRow, round_started_at: now, round_deadline: deadline });
    expect(state.roundStartedAt).toBe(now);
    expect(state.roundDeadline).toBe(deadline);
  });

  it('maps lastRound when present', () => {
    const lastRound = {
      round: 1,
      correctAnswer: 'París',
      host:  { selected: 'París', correct: true,  timeMs: 3000 },
      guest: { selected: 'Madrid', correct: false, timeMs: 5000 },
      winner: 'host' as const,
    };
    const state = rowToMatchState({ ...baseRow, last_round: lastRound });
    expect(state.lastRound).toEqual(lastRound);
  });

  it('maps questions array', () => {
    const qs = [{ id: 0, question: 'Q?', options: ['A','B','C','D'], category: 'science' as const, difficulty: 'easy' as const }];
    const state = rowToMatchState({ ...baseRow, questions: qs });
    expect(state.questions).toEqual(qs);
  });

  it('maps rematch_id', () => {
    const state = rowToMatchState({ ...baseRow, rematch_id: 'new-match-99' });
    expect(state.rematchId).toBe('new-match-99');
  });
});
