// lib/rankings.ts
// Handles READ (getRankings) and CLEAR from the client.
// WRITE (saveRanking) and POSITION (getRankPosition) are handled
// server-side by POST /api/rankings to enforce validation + rate limiting.

import { supabase } from './supabase';
import { RankingEntry } from './types';

const STORAGE_KEY = 'brainwave_rankings';

// ─── localStorage fallback ────────────────────────────────────────────────────

function localGet(): RankingEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RankingEntry[]) : [];
  } catch { return []; }
}

// ─── DB row → RankingEntry ────────────────────────────────────────────────────

interface DbRow {
  id:              string;
  name:            string;
  avatar:          string;
  score:           number;
  total_questions: number;
  percentage:      number;
  streak:          number;
  duration:        number;
  created_at:      string;
}

function rowToEntry(row: DbRow): RankingEntry {
  return {
    id:             row.id,
    name:           row.name,
    avatar:         row.avatar,
    score:          row.score,
    totalQuestions: row.total_questions,
    percentage:     row.percentage,
    streak:         row.streak,
    duration:       row.duration,
    date:           row.created_at,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fetch the global leaderboard (top 50). */
export async function getRankings(): Promise<RankingEntry[]> {
  if (!supabase) return localGet();

  const { data, error } = await supabase
    .from('rankings')
    .select('*')
    .order('score',    { ascending: false })
    .order('duration', { ascending: true  })
    .limit(50);

  if (error || !data) return localGet();
  return (data as DbRow[]).map(rowToEntry);
}

/** Delete all rankings — local + remote (admin/debug action). */
export async function clearRankings(): Promise<void> {
  if (supabase) {
    await supabase
      .from('rankings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
  }
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}
