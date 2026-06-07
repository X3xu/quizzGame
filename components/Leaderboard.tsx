'use client';

import { useEffect, useId, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Flame, Loader2, Target, Trophy } from 'lucide-react';
import type { RankingEntry } from '@/lib/types';
import { getRankings } from '@/lib/rankings';
import { getPlayerId } from '@/lib/multiplayer';
import Button   from './ui/Button';
import Card     from './ui/Card';
import AppShell from './AppShell';

interface LeaderboardProps {
  onBack:       () => void;
  highlightId?: string;   // id of the entry just saved (to highlight it)
}

const MEDALS: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface RankStyle { border: string; text: string; ring: string; }
const RANK_STYLES: Record<1 | 2 | 3, RankStyle> = {
  1: { border: 'border-amber-500/40',  text: 'text-amber-400',  ring: 'ring-amber-500/30'  },
  2: { border: 'border-slate-400/30',  text: 'text-slate-300',  ring: 'ring-slate-400/20'  },
  3: { border: 'border-orange-500/30', text: 'text-orange-400', ring: 'ring-orange-500/25' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface PodiumCardProps { entry: RankingEntry; rank: 1 | 2 | 3; highlighted: boolean; }

function PodiumCard({ entry, rank, highlighted }: PodiumCardProps) {
  const { border, text, ring } = RANK_STYLES[rank];
  return (
    <Card
      padding="sm"
      className={[
        'border text-center transition-transform',
        border,
        rank === 1 ? '-translate-y-3' : '',
        highlighted ? `ring-2 ${ring}` : '',
      ].join(' ')}
    >
      <p aria-hidden="true" className="mb-1 text-3xl">{MEDALS[rank]}</p>
      <p aria-hidden="true" className="mb-1 text-xl leading-none">{entry.avatar}</p>
      <p className="truncate text-xs font-bold text-[var(--color-ink)]" title={entry.name}>{entry.name}</p>
      <p className={`mt-1 text-lg font-black ${text}`} aria-label={`${entry.score} puntos`}>{entry.score}</p>
      <p className="text-[10px] text-[var(--color-muted)]">{entry.percentage}%</p>
    </Card>
  );
}

export default function Leaderboard({ onBack, highlightId }: LeaderboardProps) {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const playerId = getPlayerId();
  const titleId  = useId();

  useEffect(() => {
    let alive = true;
    getRankings()
      .then((data) => { if (alive) { setRankings(data); setLoading(false); } })
      .catch(() => { if (alive) { setError(true); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  // An entry is "mine" if it matches the saved id OR shares this browser's playerId.
  function isHighlighted(entry: RankingEntry) {
    return entry.id === highlightId || entry.playerId === playerId;
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">

          {/* ── Header ── */}
          <div className="anim-fade-up mb-8 flex items-center gap-4">
            <Button
              variant="ghost" size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={onBack}
              aria-label="Volver atrás"
            >
              Volver
            </Button>
            <div className="flex-1 text-center">
              <h1
                id={titleId}
                className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-2xl font-black text-transparent"
              >
                Ranking Global
              </h1>
              <p className="text-xs text-[var(--color-muted)]">
                {loading ? 'Cargando…' : `${rankings.length} ${rankings.length === 1 ? 'jugador' : 'jugadores'}`}
              </p>
            </div>
            {/* Spacer to balance the back button */}
            <div className="w-[72px]" aria-hidden="true" />
          </div>

          {/* ── Loading ── */}
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" aria-label="Cargando ranking" />
            </div>
          )}

          {/* ── Error ── */}
          {!loading && error && (
            <Card padding="lg" className="py-16 text-center">
              <p className="font-semibold text-[var(--color-muted)]">No se pudo cargar el ranking</p>
              <p className="mt-1 text-sm text-[var(--color-subtle)]">Comprueba tu conexión e inténtalo de nuevo</p>
            </Card>
          )}

          {/* ── Empty state ── */}
          {!loading && !error && rankings.length === 0 && (
            <div className="anim-fade-up anim-delay-1">
              <Card padding="lg" className="py-16 text-center">
                <Trophy className="mx-auto mb-3 h-12 w-12 text-[var(--color-subtle)]" aria-hidden="true" />
                <p className="font-semibold text-[var(--color-muted)]">Aún no hay resultados</p>
                <p className="mt-1 text-sm text-[var(--color-subtle)]">Juega para ser el primero en el ranking</p>
              </Card>
            </div>
          )}

          {/* ── Podium ── */}
          {!loading && rankings.length >= 3 && (
            <section
              aria-label="Podio top 3"
              className="anim-fade-up anim-delay-1 mb-5 grid grid-cols-3 items-end gap-2.5"
            >
              <PodiumCard entry={rankings[1]} rank={2} highlighted={isHighlighted(rankings[1])} />
              <PodiumCard entry={rankings[0]} rank={1} highlighted={isHighlighted(rankings[0])} />
              <PodiumCard entry={rankings[2]} rank={3} highlighted={isHighlighted(rankings[2])} />
            </section>
          )}

          {/* ── Full list ── */}
          {!loading && rankings.length > 0 && (
            <ol aria-labelledby={titleId} className="anim-fade-up anim-delay-2">
              {rankings.map((entry, idx) => {
                const rank          = idx + 1;
                const highlighted   = isHighlighted(entry);
                const isTop         = rank <= 3;
                const rs            = isTop ? RANK_STYLES[rank as 1 | 2 | 3] : null;

                return (
                  <motion.li
                    key={entry.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0   }}
                    transition={{ delay: Math.min(idx, 8) * 0.04, duration: 0.25 }}
                    className="mb-2"
                  >
                    <Card
                      padding="none"
                      className={[
                        'flex items-center gap-3 px-4 py-3',
                        rs  ? `border ${rs.border}` : '',
                        highlighted ? 'ring-1 ring-violet-500/40' : '',
                      ].join(' ')}
                    >
                      <div className="w-7 shrink-0 text-center" aria-hidden="true">
                        {isTop
                          ? <span className="text-lg">{MEDALS[rank as 1 | 2 | 3]}</span>
                          : <span className="text-xs font-bold text-[var(--color-subtle)]">#{rank}</span>}
                      </div>
                      <span aria-hidden="true" className="shrink-0 text-2xl leading-none">{entry.avatar}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                          {entry.name}
                          {highlighted && <span className="ml-1.5 text-xs font-normal text-violet-400">(tú)</span>}
                        </p>
                        <time dateTime={entry.date} className="text-[11px] text-[var(--color-subtle)]">
                          {formatDate(entry.date)}
                        </time>
                      </div>
                      <div className="hidden items-center gap-3 sm:flex" aria-label="Estadísticas">
                        <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                          <Target className="h-3 w-3" aria-hidden="true" />
                          <span aria-label={`${entry.percentage} por ciento`}>{entry.percentage}%</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <Flame className="h-3 w-3" aria-hidden="true" />
                          <span aria-label={`Racha ${entry.streak}`}>×{entry.streak}</span>
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          {formatDuration(entry.duration)}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-lg font-black ${rs ? rs.text : 'text-[var(--color-ink)]'}`}
                           aria-label={`${entry.score} puntos`}>
                          {entry.score}
                        </p>
                        <p className="text-[10px] text-[var(--color-subtle)]">pts</p>
                      </div>
                    </Card>
                  </motion.li>
                );
              })}
            </ol>
          )}
      </div>
      </div>
    </AppShell>
  );
}
