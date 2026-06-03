import { supabase } from './supabase';
import { RankingEntry } from './types';

// ─── localStorage fallback (used when Supabase is not configured) ─────────────

const STORAGE_KEY = 'brainwave_rankings';

function localGet(): RankingEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function localSave(entries: RankingEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ─── DB row ↔ RankingEntry mapping ───────────────────────────────────────────

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

export async function getRankings(): Promise<RankingEntry[]> {
  if (!supabase) return localGet();

  const { data, error } = await supabase
    .from('rankings')
    .select('*')
    .order('score', { ascending: false })
    .order('duration', { ascending: true })
    .limit(50);

  if (error || !data) return localGet();
  return (data as DbRow[]).map(rowToEntry);
}

export async function saveRanking(
  entry: Omit<RankingEntry, 'id' | 'date'>,
): Promise<RankingEntry> {
  if (supabase) {
    const { data, error } = await supabase
      .from('rankings')
      .insert({
        name:            entry.name,
        avatar:          entry.avatar,
        score:           entry.score,
        total_questions: entry.totalQuestions,
        percentage:      entry.percentage,
        streak:          entry.streak,
        duration:        entry.duration,
      })
      .select()
      .single();

    if (!error && data) return rowToEntry(data as DbRow);
  }

  // Fallback to localStorage
  const local = localGet();
  const newEntry: RankingEntry = {
    ...entry,
    id:   crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  localSave([newEntry, ...local].sort((a, b) => b.score - a.score).slice(0, 50));
  return newEntry;
}

export async function clearRankings(): Promise<void> {
  if (supabase) {
    await supabase.from('rankings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
}

export async function getRankPosition(score: number): Promise<number> {
  if (supabase) {
    const { count } = await supabase
      .from('rankings')
      .select('*', { count: 'exact', head: true })
      .gt('score', score);
    return (count ?? 0) + 1;
  }
  return localGet().filter(r => r.score > score).length + 1;
}
