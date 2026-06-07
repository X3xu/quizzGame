import type { RankingEntry } from './types';
import { getPlayerId } from './multiplayer';

export async function getRankings(): Promise<RankingEntry[]> {
  try {
    const res = await fetch('/api/rankings');
    if (!res.ok) return [];
    const { rankings } = await res.json();
    return rankings ?? [];
  } catch {
    return [];
  }
}

export async function saveRanking(
  entry: Omit<RankingEntry, 'id' | 'date'>,
): Promise<{ id: string; date: string }> {
  const res = await fetch('/api/rankings/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...entry, playerId: getPlayerId() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? 'No se pudo guardar la puntuación');
  }
  return res.json();
}

export async function getRankPosition(score: number): Promise<number> {
  const rankings = await getRankings();
  return rankings.filter((r) => r.score > score).length + 1;
}
