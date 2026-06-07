import type {
  MatchState, MatchStatus, RoundWinner, LastRound, MatchQuestion,
} from './types';

/** Raw `match` row shape (snake_case) — as stored in Supabase and as delivered
 *  by Realtime `postgres_changes` payloads. Shared by server logic and the
 *  browser so row→state mapping lives in exactly one place. */
export interface MatchRow {
  id: string;
  status: MatchStatus;
  questions: MatchQuestion[];
  total_rounds: number;
  current_round: number;
  round_started_at: string | null;
  round_deadline: string | null;
  host_id: string;   host_name: string;   host_avatar: string;   host_score: number;
  guest_id: string | null; guest_name: string | null; guest_avatar: string | null; guest_score: number;
  last_round: LastRound | null;
  winner: RoundWinner;
  rematch_id: string | null;
}

/** Public projection of a match row. Never carries correct answers. */
export function rowToMatchState(row: MatchRow): MatchState {
  return {
    id:             row.id,
    status:         row.status,
    questions:      row.questions,
    totalRounds:    row.total_rounds,
    currentRound:   row.current_round,
    roundStartedAt: row.round_started_at,
    roundDeadline:  row.round_deadline,
    host:  { id: row.host_id, name: row.host_name, avatar: row.host_avatar, score: row.host_score },
    guest: row.guest_id
      ? { id: row.guest_id, name: row.guest_name!, avatar: row.guest_avatar!, score: row.guest_score }
      : null,
    lastRound: row.last_round,
    winner:    row.winner,
    rematchId: row.rematch_id,
  };
}
