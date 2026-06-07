import type { RankingEntry, AnswerRecord } from './types';
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
  answers?: AnswerRecord[],
): Promise<{ id: string; date: string }> {
  const body = {
    name:           entry.name,
    avatar:         entry.avatar,
    score:          entry.score,
    totalQuestions: entry.totalQuestions,
    percentage:     entry.percentage,
    streak:         entry.streak,
    duration:       entry.duration,
    deviceId:       getPlayerId(),
    // answers enables server-side anti-cheat validation
    answers: (answers ?? []).map((a) => ({ correct: a.correct, timeSpent: a.timeSpent })),
  };

  const res = await fetch('/api/rankings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? 'No se pudo guardar la puntuación');
  }
  return res.json();
}

export async function getRankPosition(score: number): Promise<number> {
  try {
    const res = await fetch(`/api/rankings?position_for_score=${score}`);
    if (!res.ok) return 1;
    const { position } = await res.json();
    return position ?? 1;
  } catch {
    return 1;
  }
}
