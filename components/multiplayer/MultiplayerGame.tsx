'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Zap } from 'lucide-react';
import type { MatchRole, MatchState } from '@/lib/types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/questions';
import Card     from '../ui/Card';
import Badge    from '../ui/Badge';
import AppShell from '../AppShell';

const ROUND_TIME_MS = 15_000;

interface Props {
  match: MatchState;
  role:  MatchRole;
  /** server clock offset in ms: serverNow ≈ Date.now() + skew */
  skew:  number;
  onSubmit: (round: number, selected: string) => void;
}

type Phase = 'reveal' | 'answer';

export default function MultiplayerGame({ match, role, skew, onSubmit }: Props) {
  const [, force] = useState(0);                          // re-render on each clock tick
  // One record per answered round: { round, selected }. Reset is implicit —
  // a record for an old round simply doesn't match the current one.
  const [answered, setAnswered] = useState<{ round: number; selected: string } | null>(null);
  const expiredFor = useRef(-1);

  const round    = match.currentRound;
  const question = match.questions[round];
  const me       = role === 'host' ? match.host : match.guest!;
  const opp      = role === 'host' ? match.guest : match.host;

  const serverNow   = Date.now() + skew;
  const startMs     = match.roundStartedAt ? new Date(match.roundStartedAt).getTime() : 0;
  const deadlineMs  = match.roundDeadline  ? new Date(match.roundDeadline).getTime()  : 0;
  const inReveal    = startMs > 0 && serverNow < startMs && !!match.lastRound;
  const phase: Phase = inReveal ? 'reveal' : 'answer';
  const remainingMs = Math.max(0, deadlineMs - serverNow);
  const secondsLeft = Math.ceil(remainingMs / 1000);

  const hasAnswered = answered?.round === round;
  const mySelected  = hasAnswered ? answered!.selected : null;

  /* Latest values for the interval callback, without re-subscribing it. */
  const live = useRef({ round, phase, hasAnswered, deadlineMs, skew, onSubmit });
  live.current = { round, phase, hasAnswered, deadlineMs, skew, onSubmit };

  /* Single clock: ticks the UI and auto-submits an empty answer on timeout. */
  useEffect(() => {
    const id = setInterval(() => {
      force((n) => n + 1);
      const s = live.current;
      const expired = Date.now() + s.skew >= s.deadlineMs;
      if (s.phase === 'answer' && !s.hasAnswered && expired && expiredFor.current !== s.round) {
        expiredFor.current = s.round;
        setAnswered({ round: s.round, selected: '' });
        s.onSubmit(s.round, '');
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  function handlePick(option: string) {
    if (phase !== 'answer' || hasAnswered) return;
    setAnswered({ round, selected: option });
    onSubmit(round, option);
  }

  const pct = (secondsLeft / (ROUND_TIME_MS / 1000)) * 100;
  const danger = secondsLeft <= 3;
  const warning = secondsLeft <= 6;

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center px-4 py-6">
        <div className="flex w-full max-w-3xl flex-col">

          {/* ── Scoreboard ── */}
          <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <PlayerTag player={me}  label="Tú"   align="left"  highlight />
            <div className="text-center">
              <p className="font-mono text-2xl font-black tabular-nums text-[var(--color-ink)]">
                {me.score} <span className="text-[var(--color-subtle)]">·</span> {opp?.score ?? 0}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-[var(--color-subtle)]">
                Ronda {round + 1}/{match.totalRounds}
              </p>
            </div>
            <PlayerTag player={opp} label="Rival" align="right" />
          </div>

          {/* ── Timer bar ── */}
          <div className="timer-track mb-6" role="presentation">
            <div
              className="timer-fill"
              style={{
                width: `${phase === 'answer' ? pct : 100}%`,
                backgroundColor: danger ? '#ef4444' : warning ? '#f59e0b' : undefined,
                background: danger || warning ? undefined : 'linear-gradient(90deg, #7c3aed, #06b6d4)',
              }}
            />
          </div>

          {/* ── Question + options / reveal ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${round}-${phase}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              {phase === 'reveal' && match.lastRound ? (
                <RoundReveal match={match} role={role} />
              ) : (
                <Card padding="lg" as="article">
                  <div className="mb-5 flex flex-wrap items-center gap-3">
                    <Badge color="slate">
                      <span aria-hidden="true">{CATEGORY_ICONS[question.category]}</span>
                      {CATEGORY_LABELS[question.category]}
                    </Badge>
                    <span className={[
                      'ml-auto font-mono text-lg font-black tabular-nums',
                      danger ? 'text-red-400' : warning ? 'text-amber-400' : 'text-[var(--color-ink)]',
                    ].join(' ')}>
                      {secondsLeft}s
                    </span>
                  </div>

                  <h2 className="mb-8 text-2xl font-bold leading-snug text-[var(--color-ink)] sm:text-3xl">
                    {question.question}
                  </h2>

                  <div role="group" aria-label="Opciones de respuesta" className="flex flex-col gap-3">
                    {question.options.map((option, i) => {
                      const picked = mySelected === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          data-state={picked ? 'incorrect' : 'idle'}
                          className="answer-option"
                          onClick={() => handlePick(option)}
                          disabled={hasAnswered}
                          aria-pressed={picked}
                        >
                          <span aria-hidden="true"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                                       border border-[var(--color-border)] bg-white/5 text-xs font-bold text-[var(--color-muted)]">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="answer-label">{option}</span>
                          {picked && <Check className="ml-auto h-4 w-4 text-violet-400" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>

                  {hasAnswered && (
                    <p className="mt-5 flex items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
                      {mySelected ? 'Respondido — esperando al rival…' : 'Tiempo agotado — esperando…'}
                    </p>
                  )}
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

/* ─── Scoreboard player tag ──────────────────────────────────────────────── */

function PlayerTag({
  player, label, align, highlight = false,
}: {
  player: MatchState['host'] | null;
  label: string;
  align: 'left' | 'right';
  highlight?: boolean;
}) {
  return (
    <div className={[
      'flex items-center gap-2',
      align === 'right' ? 'flex-row-reverse text-right' : '',
    ].join(' ')}>
      <span aria-hidden="true" className="text-2xl leading-none">{player?.avatar ?? '⌛'}</span>
      <div className={align === 'right' ? 'text-right' : ''}>
        <p className={[
          'truncate text-sm font-semibold',
          highlight ? 'text-violet-300' : 'text-[var(--color-ink)]',
        ].join(' ')}>
          {player?.name ?? 'Esperando…'}
        </p>
        <p className="text-[10px] uppercase tracking-widest text-[var(--color-subtle)]">{label}</p>
      </div>
    </div>
  );
}

/* ─── Round reveal (synced 2s window between questions) ──────────────────── */

function RoundReveal({ match, role }: { match: MatchState; role: MatchRole }) {
  const lr   = match.lastRound!;
  const mine = role === 'host' ? lr.host  : lr.guest;
  const won  = lr.winner === role || lr.winner === 'tie';
  const noOne = lr.winner === null;

  const headline = noOne
    ? 'Ronda sin punto'
    : won ? '¡Punto para ti!' : 'Punto del rival';

  return (
    <Card padding="lg" className="text-center">
      <div aria-hidden="true" className={[
        'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border',
        won ? 'border-emerald-500/30 bg-emerald-500/15'
            : noOne ? 'border-slate-500/30 bg-slate-500/15'
                    : 'border-red-500/30 bg-red-500/15',
      ].join(' ')}>
        {won ? <Zap className="h-8 w-8 text-emerald-400" />
             : noOne ? <X className="h-8 w-8 text-slate-400" />
                     : <X className="h-8 w-8 text-red-400" />}
      </div>

      <h2 className="mb-1 text-2xl font-black text-[var(--color-ink)]">{headline}</h2>
      <p className="mb-5 text-sm text-[var(--color-muted)]">
        Respuesta correcta: <span className="font-semibold text-emerald-400">{lr.correctAnswer}</span>
      </p>

      <div className="flex items-center justify-center gap-6 text-sm">
        <RevealSide label="Tú"    result={mine} />
        <RevealSide label="Rival" result={role === 'host' ? lr.guest : lr.host} />
      </div>
    </Card>
  );
}

function RevealSide({ label, result }: { label: string; result: { correct: boolean; timeMs: number } | null }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] uppercase tracking-widest text-[var(--color-subtle)]">{label}</span>
      {result
        ? (
          <span className={[
            'flex items-center gap-1 font-semibold',
            result.correct ? 'text-emerald-400' : 'text-red-400',
          ].join(' ')}>
            {result.correct
              ? <Check className="h-4 w-4" aria-hidden="true" />
              : <X className="h-4 w-4" aria-hidden="true" />}
            {result.correct ? `${(result.timeMs / 1000).toFixed(1)}s` : '—'}
          </span>
        )
        : <span className="text-[var(--color-subtle)]">sin responder</span>}
    </div>
  );
}
