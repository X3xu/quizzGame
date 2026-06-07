import { NextResponse } from 'next/server';
import { loadState, resolveRoundIfReady } from '@/lib/match-server';

/**
 * Heartbeat / safety net. Clients poll this so a round still resolves even if
 * the opponent disconnected (deadline passed with no answer) and Realtime never
 * delivered an update. Resolution is idempotent, so polling is harmless.
 */
export async function POST(req: Request) {
  let matchId: string | undefined;
  try {
    matchId = (await req.json())?.matchId;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  if (!matchId) return NextResponse.json({ error: 'Falta matchId' }, { status: 400 });

  try {
    await resolveRoundIfReady(matchId);
    const match = await loadState(matchId);
    if (!match) return NextResponse.json({ error: 'Sala no encontrada' }, { status: 404 });
    return NextResponse.json({ match, serverNow: Date.now() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
