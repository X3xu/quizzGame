/**
 * Tests for server-side round logic in match-server.ts.
 *
 * resolveRoundIfReady depends on supabaseAdmin. We override the global setup
 * mock at file scope using vi.hoisted() so the spy exists when vi.mock's
 * factory executes (vi.mock is hoisted before regular variable declarations).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Hoist the spy so vi.mock's factory can reference it ───────────────────────
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@/lib/supabase', () => ({
  supabase:      null,
  supabaseAdmin: { from: mockFrom },
}));

import { resolveRoundIfReady, TOTAL_ROUNDS, ROUND_TIME_MS, REVEAL_MS } from '@/lib/match-server';

beforeEach(() => vi.clearAllMocks());

// ── Constants ─────────────────────────────────────────────────────────────────

describe('Constants', () => {
  it('TOTAL_ROUNDS is 10',      () => expect(TOTAL_ROUNDS).toBe(10));
  it('ROUND_TIME_MS is 15 s',  () => expect(ROUND_TIME_MS).toBe(15_000));
  it('REVEAL_MS is 2 s',       () => expect(REVEAL_MS).toBe(2_000));
  it('REVEAL_MS < ROUND_TIME_MS', () => expect(REVEAL_MS).toBeLessThan(ROUND_TIME_MS));
  it('full round window = 17 s', () => expect(REVEAL_MS + ROUND_TIME_MS).toBe(17_000));
});

// ── resolveRoundIfReady — status guard ────────────────────────────────────────

describe('resolveRoundIfReady — status guard', () => {
  it('does not query match_answer when the match is already finished', async () => {
    const finishedRow = {
      id: 'match-1', status: 'finished', current_round: 5, total_rounds: 10,
      round_deadline: new Date(Date.now() - 1000).toISOString(),
      round_started_at: null,
      host_id: 'h', host_name: 'A', host_avatar: '🧠', host_score: 5,
      guest_id: 'g', guest_name: 'B', guest_avatar: '🦊', guest_score: 4,
      last_round: null, winner: 'host', rematch_id: null, questions: [],
    };

    // Build a minimal select chain that returns the finished match
    const singleFn = vi.fn().mockResolvedValue({ data: finishedRow, error: null });
    const eqChain: Record<string, unknown> = {};
    eqChain.eq     = vi.fn().mockReturnValue(eqChain);
    eqChain.single = singleFn;
    const selectFn = vi.fn().mockReturnValue(eqChain);

    mockFrom.mockReturnValue({ select: selectFn });

    await resolveRoundIfReady('match-1');

    // Only the 'match' table should have been touched — not 'match_answer' or 'match_key'
    const queriedTables: string[] = mockFrom.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(queriedTables).not.toContain('match_answer');
    expect(queriedTables).not.toContain('match_key');
  });

  it('does not query match_answer when the match is in "waiting" status', async () => {
    const waitingRow = {
      id: 'match-2', status: 'waiting', current_round: 0, total_rounds: 10,
      round_deadline: null, round_started_at: null,
      host_id: 'h', host_name: 'A', host_avatar: '🧠', host_score: 0,
      guest_id: null, guest_name: null, guest_avatar: null, guest_score: 0,
      last_round: null, winner: null, rematch_id: null, questions: [],
    };

    const singleFn = vi.fn().mockResolvedValue({ data: waitingRow, error: null });
    const eqChain: Record<string, unknown> = {};
    eqChain.eq     = vi.fn().mockReturnValue(eqChain);
    eqChain.single = singleFn;

    mockFrom.mockReturnValue({ select: vi.fn().mockReturnValue(eqChain) });

    await resolveRoundIfReady('match-2');

    const queriedTables: string[] = mockFrom.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(queriedTables).not.toContain('match_answer');
  });
});
