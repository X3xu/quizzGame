// Server-only module: imported exclusively by /api/match/* routes. It uses the
// service-role client and reads the secret answer key, so it must never be
// pulled into a client component.
import { supabaseAdmin } from './supabase';
import { getRandomQuestions } from './questions';
import { dbToQuestion, type DbQuestion } from './db-questions';
import { rowToMatchState, type MatchRow } from './match-shared';
import type { Question, MatchQuestion, MatchState, RoundWinner, LastRound } from './types';

export { rowToMatchState };

/* ─── Tunables (single source of truth, shared by server logic) ──────────── */

export const TOTAL_ROUNDS  = 10;
export const ROUND_TIME_MS = 15_000;   // answering window per question
export const REVEAL_MS     = 2_000;    // synced "who won the round" reveal before next Q

/* ─── DB row shapes ──────────────────────────────────────────────────────── */

interface AnswerRow {
  role: 'host' | 'guest';
  selected: string;
  correct: boolean;
  time_ms: number;
}

/** Narrow the admin client to a non-null value or throw a clear error. */
export function admin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase no está configurado (faltan variables de entorno).');
  }
  return supabaseAdmin;
}

/** Load a match by id as the public projection, or null if it doesn't exist. */
export async function loadState(matchId: string): Promise<MatchState | null> {
  const { data } = await admin().from('match').select('*').eq('id', matchId).single();
  return data ? rowToMatchState(data as MatchRow) : null;
}

/* ─── Question sourcing (server side, service-role) ──────────────────────── */

/**
 * Pick `count` questions for a match. Tries Supabase (approved) first, falls
 * back to the local hardcoded set. Returns full questions (with answers) — the
 * caller splits these into the public set + the secret answer key.
 */
export async function pickMatchQuestions(count = TOTAL_ROUNDS): Promise<Question[]> {
  try {
    const { data, error } = await admin()
      .from('questions')
      .select('*')
      .eq('status', 'approved')
      .limit(300);

    if (!error && data && data.length >= count) {
      const shuffled = [...(data as DbQuestion[])].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count).map((q, i) => dbToQuestion(q, i));
    }
  } catch {
    /* fall through to local */
  }
  return getRandomQuestions(count);
}

/** Strip the correct answer so it never reaches the browser. */
export function toPublicQuestions(qs: Question[]): MatchQuestion[] {
  return qs.map(({ id, question, options, category, difficulty }) => ({
    id, question, options, category, difficulty,
  }));
}

/* ─── Round resolution (the heart of the anti-cheat arbitration) ─────────── */

function decideRoundWinner(
  host:  AnswerRow | undefined,
  guest: AnswerRow | undefined,
): RoundWinner {
  const hc = host?.correct ?? false;
  const gc = guest?.correct ?? false;
  if (hc && gc) {
    if (host!.time_ms < guest!.time_ms) return 'host';
    if (guest!.time_ms < host!.time_ms) return 'guest';
    return 'tie';
  }
  if (hc) return 'host';
  if (gc) return 'guest';
  return null;
}

/**
 * Resolve the current round if it is ready (both answered, or the deadline has
 * passed). Server-authoritative and idempotent: the advancing UPDATE is guarded
 * on `current_round`, so concurrent calls can't double-advance or double-score.
 */
export async function resolveRoundIfReady(matchId: string): Promise<void> {
  const db = admin();

  const { data: match } = await db.from('match').select('*').eq('id', matchId).single();
  if (!match || match.status !== 'playing') return;
  const row = match as MatchRow;
  const round = row.current_round;

  const { data: answers } = await db
    .from('match_answer')
    .select('role, selected, correct, time_ms')
    .eq('match_id', matchId)
    .eq('round', round);

  const host  = (answers as AnswerRow[] | null)?.find((a) => a.role === 'host');
  const guest = (answers as AnswerRow[] | null)?.find((a) => a.role === 'guest');

  const deadlinePassed =
    !!row.round_deadline && Date.now() >= new Date(row.round_deadline).getTime();
  const bothAnswered = !!host && !!guest;

  if (!bothAnswered && !deadlinePassed) return;

  const winner = decideRoundWinner(host, guest);
  const hostScore  = row.host_score  + (winner === 'host'  || winner === 'tie' ? 1 : 0);
  const guestScore = row.guest_score + (winner === 'guest' || winner === 'tie' ? 1 : 0);

  const { data: key } = await db
    .from('match_key').select('answers').eq('match_id', matchId).single();
  const correctAnswer: string = key?.answers?.[round] ?? '';

  const lastRound: LastRound = {
    round,
    correctAnswer,
    host:  host  ? { selected: host.selected,  correct: host.correct,  timeMs: host.time_ms  } : null,
    guest: guest ? { selected: guest.selected, correct: guest.correct, timeMs: guest.time_ms } : null,
    winner,
  };

  const nextRound = round + 1;
  const finished  = nextRound >= row.total_rounds;
  const nowMs     = Date.now();

  const patch = finished
    ? {
        status: 'finished' as const,
        host_score: hostScore, guest_score: guestScore,
        last_round: lastRound,
        winner: (hostScore > guestScore ? 'host' : guestScore > hostScore ? 'guest' : 'tie') as RoundWinner,
        round_started_at: null, round_deadline: null,
        updated_at: new Date().toISOString(),
      }
    : {
        current_round: nextRound,
        host_score: hostScore, guest_score: guestScore,
        last_round: lastRound,
        // Answering opens after the reveal window; both clients honor these stamps.
        round_started_at: new Date(nowMs + REVEAL_MS).toISOString(),
        round_deadline:   new Date(nowMs + REVEAL_MS + ROUND_TIME_MS).toISOString(),
        updated_at: new Date().toISOString(),
      };

  // Guarded on current_round + status so only one caller advances this round.
  await db
    .from('match')
    .update(patch)
    .eq('id', matchId)
    .eq('current_round', round)
    .eq('status', 'playing');
}
