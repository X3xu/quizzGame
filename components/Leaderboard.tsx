'use client';

import { useEffect, useId, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Flame, Target, Trash2, Trophy, X } from 'lucide-react';
import { RankingEntry } from '@/lib/types';
import { clearRankings, getRankings } from '@/lib/rankings';
import Button   from './ui/Button';
import Card     from './ui/Card';
import Modal    from './ui/Modal';
import AppShell from './AppShell';

interface LeaderboardProps {
  onBack:       () => void;
  highlightId?: string;
}

const MEDALS: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

interface RankStyle { border: string; text: string; ring: string; }
const RANK_STYLES: Record<1 | 2 | 3, RankStyle> = {
  1: { border: 'border-amber-500/40',  text: 'text-amber-400',  ring: 'ring-amber-500/30'  },
  2: { border: 'border-slate-400/30',  text: 'text-slate-300',  ring: 'ring-slate-400/20'  },
  3: { border: 'border-orange-500/30', text: 'text-orange-400', ring: 'ring-orange-500/25' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface PodiumCardProps { entry: RankingEntry; rank: 1 | 2 | 3; highlighted: boolean; onClick: () => void; }

function PodiumCard({ entry, rank, highlighted, onClick }: PodiumCardProps) {
  const { border, text, ring } = RANK_STYLES[rank];
  return (
    <Card
      padding="sm"
      as="button"
      onClick={onClick}
      className={[
        'border text-center transition-all cursor-pointer hover:scale-105 hover:ring-1 hover:ring-violet-500/40 w-full',
        border,
        rank === 1 ? '-translate-y-3' : '',
        highlighted ? `ring-2 ${ring}` : '',
      ].join(' ')}
      aria-label={`Ver detalles de ${entry.name}`}
    >
      <p aria-hidden="true" className="mb-1 text-3xl">{MEDALS[rank]}</p>
      <p aria-hidden="true" className="mb-1 text-xl leading-none">{entry.avatar}</p>
      <p className="truncate text-xs font-bold text-[var(--color-ink)]" title={entry.name}>{entry.name}</p>
      <p className={`mt-1 text-lg font-black ${text}`} aria-label={`${entry.score} puntos`}>{entry.score}</p>
      <p className="text-[10px] text-[var(--color-muted)]">{entry.percentage}%</p>
    </Card>
  );
}

interface PlayerDetailModalProps {
  entry: RankingEntry | null;
  rank:  number;
  onClose: () => void;
}

function PlayerDetailModal({ entry, rank, onClose }: PlayerDetailModalProps) {
  if (!entry) return null;
  const isTop = rank <= 3;
  const rs    = isTop ? RANK_STYLES[rank as 1 | 2 | 3] : null;

  const stats = [
    { label: 'Puntuación',     value: `${entry.score} pts`,              icon: '🏆' },
    { label: 'Precisión',      value: `${entry.percentage}%`,            icon: '🎯' },
    { label: 'Racha máxima',   value: `×${entry.streak}`,                icon: '🔥' },
    { label: 'Duración total', value: formatDuration(entry.duration),    icon: '⏱️' },
    { label: 'Preguntas',      value: `${entry.totalQuestions}`,         icon: '📋' },
    { label: 'Fecha',          value: formatDate(entry.date),            icon: '📅' },
  ];

  return (
    <Modal open onClose={onClose} title={`Detalles de ${entry.name}`}>
      <div className="space-y-5">
        {/* Player header */}
        <div className="flex flex-col items-center gap-2 pb-4 border-b border-[var(--color-border)]">
          <span className="text-5xl leading-none">{entry.avatar}</span>
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--color-ink)]">{entry.name}</p>
            <p className={`text-sm font-semibold ${rs ? rs.text : 'text-[var(--color-muted)]'}`}>
              {isTop ? MEDALS[rank as 1 | 2 | 3] : `#${rank}`} — Posición #{rank}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <dl className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value, icon }) => (
            <div
              key={label}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            >
              <dt className="flex items-center gap-1.5 text-[11px] text-[var(--color-subtle)] mb-1">
                <span aria-hidden="true">{icon}</span>
                {label}
              </dt>
              <dd className="text-sm font-bold text-[var(--color-ink)]">{value}</dd>
            </div>
          ))}
        </dl>

        <Button variant="ghost" size="md" fullWidth onClick={onClose}
                icon={<X className="h-4 w-4" />}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}

export default function Leaderboard({ onBack, highlightId }: LeaderboardProps) {
  const [rankings,     setRankings]     = useState<RankingEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [selected,     setSelected]     = useState<{ entry: RankingEntry; rank: number } | null>(null);
  const modalTitleId = useId();

  useEffect(() => { getRankings().then(setRankings); }, []);

  async function handleClear() {
    await clearRankings();
    setRankings([]);
    setConfirmClear(false);
  }

  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">

          {/* ── Header ── */}
          <div className="anim-fade-up mb-8 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={onBack}
              aria-label="Volver atrás"
            >
              Volver
            </Button>
            <div className="flex-1 text-center">
              <h1 className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-2xl font-black text-transparent">
                Ranking Global
              </h1>
              <p className="text-xs text-[var(--color-muted)]">
                {rankings.length} {rankings.length === 1 ? 'jugador' : 'jugadores'}
                {rankings.length > 0 && (
                  <span className="ml-1 text-[var(--color-subtle)]">· haz clic para ver detalles</span>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => setConfirmClear(true)}
              aria-label="Borrar ranking"
              className="text-[var(--color-subtle)] hover:text-red-400"
            />
          </div>

          {/* ── Empty state ── */}
          {rankings.length === 0 && (
            <div className="anim-fade-up anim-delay-1">
              <Card padding="lg" className="py-16 text-center">
                <Trophy className="mx-auto mb-3 h-12 w-12 text-[var(--color-subtle)]" aria-hidden="true" />
                <p className="font-semibold text-[var(--color-muted)]">Aún no hay resultados</p>
                <p className="mt-1 text-sm text-[var(--color-subtle)]">Juega para ser el primero en el ranking</p>
              </Card>
            </div>
          )}

          {/* ── Podium ── */}
          {rankings.length >= 3 && (
            <section
              aria-label="Podio top 3"
              className="anim-fade-up anim-delay-1 mb-5 grid grid-cols-3 items-end gap-2.5"
            >
              <PodiumCard entry={rankings[1]} rank={2} highlighted={rankings[1].id === highlightId}
                          onClick={() => setSelected({ entry: rankings[1], rank: 2 })} />
              <PodiumCard entry={rankings[0]} rank={1} highlighted={rankings[0].id === highlightId}
                          onClick={() => setSelected({ entry: rankings[0], rank: 1 })} />
              <PodiumCard entry={rankings[2]} rank={3} highlighted={rankings[2].id === highlightId}
                          onClick={() => setSelected({ entry: rankings[2], rank: 3 })} />
            </section>
          )}

          {/* ── Full list ── */}
          {rankings.length > 0 && (
            <ol aria-label="Lista completa del ranking" className="anim-fade-up anim-delay-2">
              {rankings.map((entry, idx) => {
                const rank          = idx + 1;
                const isHighlighted = entry.id === highlightId;
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
                      as="button"
                      onClick={() => setSelected({ entry, rank })}
                      className={[
                        'flex w-full items-center gap-3 px-4 py-3 text-left cursor-pointer',
                        'transition-all hover:ring-1 hover:ring-violet-500/30 hover:bg-violet-500/5',
                        rs  ? `border ${rs.border}` : '',
                        isHighlighted ? 'ring-1 ring-violet-500/40' : '',
                      ].join(' ')}
                      aria-label={`Ver detalles de ${entry.name}, posición ${rank}`}
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
                          {isHighlighted && <span className="ml-1.5 text-xs font-normal text-violet-400">(tú)</span>}
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

      {/* ── Player detail modal ── */}
      <PlayerDetailModal
        entry={selected?.entry ?? null}
        rank={selected?.rank ?? 0}
        onClose={() => setSelected(null)}
      />

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Confirmar borrado de ranking"
      >
        <div className="text-center">
          <div aria-hidden="true"
               className="mx-auto mb-4 flex h-14 w-14 items-center justify-center
                          rounded-2xl bg-red-500/10 border border-red-500/20">
            <Trash2 className="h-6 w-6 text-red-400" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-[var(--color-ink)]">¿Borrar el ranking?</h2>
          <p className="mb-7 text-sm text-[var(--color-muted)]">
            Se eliminarán todas las puntuaciones guardadas. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost"  size="md" fullWidth onClick={() => setConfirmClear(false)}>Cancelar</Button>
            <Button variant="danger" size="md" fullWidth onClick={handleClear}>Borrar todo</Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
