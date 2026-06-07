import { NextResponse } from 'next/server';
import {
  admin, pickMatchQuestions, toPublicQuestions, rowToMatchState, TOTAL_ROUNDS, ROUND_TIME_MS,
} from '@/lib/match-server';

interface Body {
  matchId:  string;
  playerId: string;
}

/**
 * Start a rematch between the same two players. Either participant may trigger
 * it; the new match's id is written back onto the old match (`rematch_id`) so
 * the opponent's client can follow via Realtime. Idempotent: if a rematch was
 * already created, the existing one is returned.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { matchId, playerId } = body;
  if (!matchId || !playerId) {
    return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
  }

  try {
    const db = admin();
    const { data: old } = await db.from('match').select('*').eq('id', matchId).single();
    if (!old)                              return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    if (old.host_id !== playerId && old.guest_id !== playerId)
      return NextResponse.json({ error: 'No perteneces a esta sala' }, { status: 403 });
    if (!old.guest_id)                     return NextResponse.json({ error: 'La sala no tuvo rival' }, { status: 409 });

    // Already created → return it (handles both players clicking at once).
    if (old.rematch_id) {
      const { data: existing } = await db.from('match').select('*').eq('id', old.rematch_id).single();
      if (existing) return NextResponse.json({ match: rowToMatchState(existing), serverNow: Date.now() });
    }

    const full      = await pickMatchQuestions(TOTAL_ROUNDS);
    const questions = toPublicQuestions(full);
    const answers   = full.map((q) => q.correctAnswer);
    const now       = Date.now();

    const { data: created, error } = await db
      .from('match')
      .insert({
        status: 'playing',
        questions,
        total_rounds: TOTAL_ROUNDS,
        current_round: 0,
        round_started_at: new Date(now).toISOString(),
        round_deadline:   new Date(now + ROUND_TIME_MS).toISOString(),
        host_id: old.host_id,   host_name: old.host_name,   host_avatar: old.host_avatar,
        guest_id: old.guest_id, guest_name: old.guest_name, guest_avatar: old.guest_avatar,
      })
      .select('*')
      .single();

    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? 'No se pudo crear la revancha' }, { status: 500 });
    }

    await db.from('match_key').insert({ match_id: created.id, answers });

    // Link old → new, but only if nobody beat us to it (guarded).
    const { data: linked } = await db
      .from('match')
      .update({ rematch_id: created.id, updated_at: new Date().toISOString() })
      .eq('id', matchId)
      .is('rematch_id', null)
      .select('rematch_id')
      .single();

    // Lost the race: another rematch already linked → use that one, drop ours.
    if (linked && linked.rematch_id !== created.id) {
      await db.from('match').delete().eq('id', created.id);
      const { data: winner } = await db.from('match').select('*').eq('id', linked.rematch_id).single();
      if (winner) return NextResponse.json({ match: rowToMatchState(winner), serverNow: Date.now() });
    }

    return NextResponse.json({ match: rowToMatchState(created), serverNow: Date.now() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
