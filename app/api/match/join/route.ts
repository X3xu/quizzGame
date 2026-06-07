import { NextResponse } from 'next/server';
import { admin, rowToMatchState, ROUND_TIME_MS } from '@/lib/match-server';

interface Body {
  matchId: string;
  guestId: string;
  name:    string;
  avatar:  string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const matchId = body.matchId?.trim();
  const guestId = body.guestId?.trim();
  const name    = body.name?.trim();
  const avatar  = body.avatar?.trim() || '🦊';
  if (!matchId || !guestId || !name) {
    return NextResponse.json({ error: 'Faltan datos para unirse' }, { status: 400 });
  }

  try {
    const db = admin();
    const { data: match } = await db.from('match').select('*').eq('id', matchId).single();
    if (!match) {
      return NextResponse.json({ error: 'La sala no existe' }, { status: 404 });
    }

    // Reconnect: the player is already part of this match — just return state.
    if (match.host_id === guestId || match.guest_id === guestId) {
      return NextResponse.json({ match: rowToMatchState(match), serverNow: Date.now() });
    }

    if (match.status === 'cancelled') {
      return NextResponse.json({ error: 'La sala fue cancelada' }, { status: 410 });
    }
    if (match.guest_id) {
      return NextResponse.json({ error: 'La sala ya está completa' }, { status: 409 });
    }

    const now = Date.now();
    const { data: updated, error } = await db
      .from('match')
      .update({
        guest_id: guestId,
        guest_name: name.slice(0, 20),
        guest_avatar: avatar,
        status: 'playing',
        current_round: 0,
        round_started_at: new Date(now).toISOString(),
        round_deadline:   new Date(now + ROUND_TIME_MS).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)
      .eq('status', 'waiting')       // guard: only join a still-open room
      .is('guest_id', null)
      .select('*')
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: 'La sala ya no está disponible' }, { status: 409 });
    }

    return NextResponse.json({ match: rowToMatchState(updated), serverNow: Date.now() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
