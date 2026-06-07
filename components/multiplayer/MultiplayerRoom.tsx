'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, Loader2 } from 'lucide-react';
import type { MatchRole, MatchState } from '@/lib/types';
import {
  cancelMatch, fetchState, getPlayerId, joinMatch, requestRematch,
  savePlayerProfile, submitAnswer, subscribeToMatch, type MatchResponse,
} from '@/lib/multiplayer';
import Button   from '../ui/Button';
import Card     from '../ui/Card';
import AppShell from '../AppShell';
import MultiplayerLobby   from './MultiplayerLobby';
import MultiplayerGame    from './MultiplayerGame';
import MultiplayerResults from './MultiplayerResults';
import JoinForm           from './JoinForm';

const POLL_MS = 2500;

function roleOf(match: MatchState, playerId: string): MatchRole | null {
  if (match.host.id === playerId)  return 'host';
  if (match.guest?.id === playerId) return 'guest';
  return null;
}

export default function MultiplayerRoom({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [playerId] = useState(() => getPlayerId());
  const [match, setMatch]   = useState<MatchState | null>(null);
  const [skew,  setSkew]    = useState(0);
  const [error, setError]   = useState<string | null>(null);
  const [joining,    setJoining]    = useState(false);
  const [joinError,  setJoinError]  = useState<string | null>(null);
  const [rematching, setRematching] = useState(false);
  const loadedRef = useRef(false);

  const applyResponse = useCallback((res: MatchResponse) => {
    setSkew(res.serverNow - Date.now());
    setMatch(res.match);
  }, []);

  /* Initial load. */
  useEffect(() => {
    let alive = true;
    fetchState(matchId)
      .then((res) => { if (alive) { applyResponse(res); loadedRef.current = true; } })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'No se pudo cargar la sala'); });
    return () => { alive = false; };
  }, [matchId, applyResponse]);

  /* Realtime updates (no serverNow in payload → reuse last known skew). */
  useEffect(() => {
    return subscribeToMatch(matchId, (state) => setMatch(state));
  }, [matchId]);

  /* Polling fallback: keeps sync if Realtime drops AND forces server-side
     round resolution when an opponent disconnected (deadline passed). */
  useEffect(() => {
    const id = setInterval(() => {
      const status = match?.status;
      if (status === 'waiting' || status === 'playing') {
        fetchState(matchId).then(applyResponse).catch(() => {});
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [matchId, match?.status, applyResponse]);

  /* ── Actions ── */

  const handleJoin = useCallback(async (name: string, avatar: string) => {
    setJoining(true);
    setJoinError(null);
    try {
      savePlayerProfile({ name, avatar });
      applyResponse(await joinMatch(matchId, name, avatar));
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'No se pudo unir');
    } finally {
      setJoining(false);
    }
  }, [matchId, applyResponse]);

  const handleSubmit = useCallback((round: number, selected: string) => {
    submitAnswer(matchId, round, selected).then(applyResponse).catch(() => {});
  }, [matchId, applyResponse]);

  const handleCancel = useCallback(async () => {
    try { await cancelMatch(matchId); } catch { /* ignore */ }
    router.push('/');
  }, [matchId, router]);

  const handleRematch = useCallback(async () => {
    setRematching(true);
    try {
      const res = await requestRematch(matchId);
      router.push(`/m/${res.match.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la revancha');
      setRematching(false);
    }
  }, [matchId, router]);

  /* ── Render ── */

  if (error)            return <Centered title="Vaya…" message={error} onHome={() => router.push('/')} />;
  if (!match)           return <FullLoader />;

  const role = roleOf(match, playerId);

  if (match.status === 'cancelled') {
    return <Centered title="Sala cancelada" message="Esta partida ya no está disponible." onHome={() => router.push('/')} />;
  }

  if (role === null) {
    if (match.status === 'waiting') {
      return <JoinForm hostName={match.host.name} joining={joining} error={joinError} onJoin={handleJoin} />;
    }
    return <Centered title="Sala completa" message="Esta partida ya tiene dos jugadores." onHome={() => router.push('/')} />;
  }

  if (match.status === 'waiting')  return <MultiplayerLobby match={match} onCancel={handleCancel} />;
  if (match.status === 'finished') {
    return (
      <MultiplayerResults
        match={match} role={role} rematching={rematching}
        onRematch={handleRematch} onHome={() => router.push('/')}
      />
    );
  }
  return <MultiplayerGame match={match} role={role} skew={skew} onSubmit={handleSubmit} />;
}

/* ─── Shared small screens ───────────────────────────────────────────────── */

function FullLoader() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[var(--color-canvas)]">
      <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      <p className="text-sm text-[var(--color-muted)]">Cargando sala…</p>
    </div>
  );
}

function Centered({ title, message, onHome }: { title: string; message: string; onHome: () => void }) {
  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <Card padding="lg" className="w-full max-w-sm text-center">
          <h1 className="mb-2 text-2xl font-black text-[var(--color-ink)]">{title}</h1>
          <p className="mb-6 text-sm text-[var(--color-muted)]">{message}</p>
          <Button variant="primary" size="md" fullWidth icon={<Home className="h-4 w-4" />} onClick={onHome}>
            Volver al inicio
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
