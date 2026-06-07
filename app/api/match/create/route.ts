import { NextResponse } from 'next/server';
import {
  admin, pickMatchQuestions, toPublicQuestions, rowToMatchState, TOTAL_ROUNDS,
} from '@/lib/match-server';

interface Body {
  hostId: string;
  name:   string;
  avatar: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const hostId = body.hostId?.trim();
  const name   = body.name?.trim();
  const avatar = body.avatar?.trim() || '🧠';
  if (!hostId || !name) {
    return NextResponse.json({ error: 'Faltan datos del jugador' }, { status: 400 });
  }

  try {
    const db        = admin();
    const full      = await pickMatchQuestions(TOTAL_ROUNDS);
    const questions = toPublicQuestions(full);
    const answers   = full.map((q) => q.correctAnswer);

    const { data: match, error } = await db
      .from('match')
      .insert({
        status: 'waiting',
        questions,
        total_rounds: TOTAL_ROUNDS,
        host_id: hostId,
        host_name: name.slice(0, 20),
        host_avatar: avatar,
      })
      .select('*')
      .single();

    if (error || !match) {
      return NextResponse.json({ error: error?.message ?? 'No se pudo crear la sala' }, { status: 500 });
    }

    // Secret answer key — invisible to the browser (RLS denies all anon access).
    const { error: keyError } = await db
      .from('match_key')
      .insert({ match_id: match.id, answers });

    if (keyError) {
      await db.from('match').delete().eq('id', match.id);
      return NextResponse.json({ error: keyError.message }, { status: 500 });
    }

    return NextResponse.json({ match: rowToMatchState(match), serverNow: Date.now() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
