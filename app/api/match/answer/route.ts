import { NextResponse } from 'next/server';
import { admin, loadState, resolveRoundIfReady, ROUND_TIME_MS } from '@/lib/match-server';

interface Body {
  matchId:  string;
  playerId: string;
  round:    number;
  selected: string;   // '' = timed out / no answer
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const { matchId, playerId } = body;
  const round    = Number(body.round);
  const selected = typeof body.selected === 'string' ? body.selected : '';
  if (!matchId || !playerId || !Number.isInteger(round)) {
    return NextResponse.json({ error: 'Datos de respuesta inválidos' }, { status: 400 });
  }

  try {
    const db = admin();
    const { data: match } = await db.from('match').select('*').eq('id', matchId).single();
    if (!match)                       return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    if (match.status !== 'playing')   return NextResponse.json({ error: 'La partida no está activa' }, { status: 409 });

    const role =
      match.host_id  === playerId ? 'host' :
      match.guest_id === playerId ? 'guest' : null;
    if (!role) return NextResponse.json({ error: 'No perteneces a esta sala' }, { status: 403 });

    // Ignore answers for a round that is no longer live (late/duplicate submits).
    if (round !== match.current_round) {
      return NextResponse.json({ match: await loadState(matchId), serverNow: Date.now() });
    }

    // Server-measured time — the client's clock is never trusted (anti-cheat).
    const startedAt = match.round_started_at ? new Date(match.round_started_at).getTime() : Date.now();
    const timeMs    = Math.max(0, Math.min(ROUND_TIME_MS, Date.now() - startedAt));

    // Correctness is decided from the secret key, not from anything the client sent.
    const { data: key } = await db.from('match_key').select('answers').eq('match_id', matchId).single();
    const correctAnswer: string = key?.answers?.[round] ?? '';
    const correct = selected !== '' && selected === correctAnswer;

    // Idempotent: first answer for (match, round, player) wins; later ones ignored.
    await db
      .from('match_answer')
      .upsert(
        { match_id: matchId, round, player_id: playerId, role, selected, correct, time_ms: timeMs },
        { onConflict: 'match_id,round,player_id', ignoreDuplicates: true },
      );

    await resolveRoundIfReady(matchId);

    return NextResponse.json({ match: await loadState(matchId), serverNow: Date.now() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
