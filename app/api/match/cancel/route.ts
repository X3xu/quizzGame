import { NextResponse } from 'next/server';
import { admin, loadState } from '@/lib/match-server';

interface Body {
  matchId:  string;
  playerId: string;
}

/** Host cancels a room while still waiting for an opponent. */
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
    await db
      .from('match')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', matchId)
      .eq('host_id', playerId)
      .eq('status', 'waiting');     // only a still-open room can be cancelled

    return NextResponse.json({ match: await loadState(matchId), serverNow: Date.now() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
