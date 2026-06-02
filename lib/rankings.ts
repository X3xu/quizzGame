import { RankingEntry } from './types';

const STORAGE_KEY = 'brainwave_rankings';

export function getRankings(): RankingEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRanking(entry: Omit<RankingEntry, 'id' | 'date'>): RankingEntry {
  const rankings = getRankings();
  const newEntry: RankingEntry = {
    ...entry,
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
  };
  const updated = [newEntry, ...rankings]
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newEntry;
}

export function clearRankings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getRankPosition(score: number): number {
  const rankings = getRankings();
  return rankings.filter(r => r.score > score).length + 1;
}
