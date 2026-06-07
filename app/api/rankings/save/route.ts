import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { RankingEntry } from '@/lib/types';

type Body = Omit<RankingEntry, 'id' | 'date'> & { playerId?: string };

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase no configurado' }, { status: 503 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { name, avatar, score, totalQuestions, percentage, streak, duration, playerId } = body;

  if (!name?.trim() || score == null || !totalQuestions || percentage == null) {
    return NextResponse.json({ error: 'Datos de puntuación inválidos' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('rankings')
    .insert({
      player_id:       playerId ?? null,
      name:            name.trim().slice(0, 20),
      avatar:          avatar ?? '🧠',
      score,
      total_questions: totalQuestions,
      percentage,
      streak:          streak  ?? 0,
      duration:        duration ?? 0,
    })
    .select('id, date')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Error al guardar' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, date: data.date });
}
