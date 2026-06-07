'use client';

import { supabase } from './supabase';
import { rowToMatchState, type MatchRow } from './match-shared';
import type { MatchState } from './types';

/* ─── Persistent player identity (no auth — a stable per-browser id) ──────── */

const ID_KEY      = 'quizgame_player_id';
const PROFILE_KEY = 'quizgame_player_profile';

export function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export interface PlayerProfile { name: string; avatar: string; }

export function getPlayerProfile(): PlayerProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as PlayerProfile) : null;
  } catch {
    return null;
  }
}

export function savePlayerProfile(profile: PlayerProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

/* ─── Result envelope from every match API route ─────────────────────────── */

export interface MatchResponse { match: MatchState; serverNow: number; }

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res  = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
  return data as T;
}

/* ─── API wrappers ───────────────────────────────────────────────────────── */

export function createMatch(name: string, avatar: string): Promise<MatchResponse> {
  return postJson('/api/match/create', { hostId: getPlayerId(), name, avatar });
}

export function joinMatch(matchId: string, name: string, avatar: string): Promise<MatchResponse> {
  return postJson('/api/match/join', { matchId, guestId: getPlayerId(), name, avatar });
}

export function submitAnswer(matchId: string, round: number, selected: string): Promise<MatchResponse> {
  return postJson('/api/match/answer', { matchId, playerId: getPlayerId(), round, selected });
}

export function fetchState(matchId: string): Promise<MatchResponse> {
  return postJson('/api/match/state', { matchId });
}

export function requestRematch(matchId: string): Promise<MatchResponse> {
  return postJson('/api/match/rematch', { matchId, playerId: getPlayerId() });
}

export function cancelMatch(matchId: string): Promise<MatchResponse> {
  return postJson('/api/match/cancel', { matchId, playerId: getPlayerId() });
}

/* ─── Realtime subscription ──────────────────────────────────────────────── */

/**
 * Subscribe to live updates for a match. Calls `onState` with the freshly
 * mapped state on every row change. Returns an unsubscribe function. If Realtime
 * is unavailable the caller's polling fallback still keeps the game in sync.
 */
export function subscribeToMatch(
  matchId: string,
  onState: (state: MatchState) => void,
): () => void {
  const client = supabase;
  if (!client) return () => {};

  const channel = client
    .channel(`match:${matchId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'match', filter: `id=eq.${matchId}` },
      (payload) => onState(rowToMatchState(payload.new as MatchRow)),
    )
    .subscribe();

  return () => { client.removeChannel(channel); };
}

/* ─── Misc ───────────────────────────────────────────────────────────────── */

export function matchShareUrl(matchId: string): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/m/${matchId}`;
}
