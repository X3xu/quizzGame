import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { RankingEntry } from '@/lib/types';

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ rankings: [] });
  }

  const { data, error } = await supabase
    .from('rankings')
    .select('id, player_id, name, avatar, score, total_questions, percentage, streak, duration, date')
    .order('score', { ascending: false })
    .order('duration', { ascending: true })   // tiebreak: faster game wins
    .limit(50);

  if (error || !data) {
    return NextResponse.json({ rankings: [] });
  }

  const rankings: RankingEntry[] = data.map((r) => ({
    id:             r.id,
    name:           r.name,
    avatar:         r.avatar,
    score:          r.score,
    totalQuestions: r.total_questions,
    percentage:     r.percentage,
    streak:         r.streak,
    duration:       r.duration,
    date:           r.date,
    playerId:       r.player_id ?? undefined,
  }));

  return NextResponse.json({ rankings });
}
