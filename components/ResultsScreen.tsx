'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flame, List, RotateCcw, Target, Trophy } from 'lucide-react';
import { AnswerRecord } from '@/lib/types';
import Button   from './ui/Button';
import Card     from './ui/Card';
import Badge    from './ui/Badge';
import AppShell from './AppShell';

interface ResultsScreenProps {
  playerName:    string;
  avatar:        string;
  score:         number;
  maxStreak:     number;
  answers:       AnswerRecord[];
  duration:      number;
  rankPosition:  number;
  onReplay:      () => void;
  onLeaderboard: () => void;
}

interface Grade { emoji: string; label: string; labelColor: string; }

function getGrade(pct: number): Grade {
  if (pct >= 90) return { emoji: '🏆', label: '¡Excelente!',         labelColor: 'text-amber-400'             };
  if (pct >= 70) return { emoji: '🌟', label: '¡Muy bien!',           labelColor: 'text-violet-400'            };
  if (pct >= 50) return { emoji: '💪', label: '¡Bien hecho!',         labelColor: 'text-cyan-400'              };
  return           { emoji: '📚', label: '¡Sigue practicando!', labelColor: 'text-[var(--color-muted)]' };
}

function useCountUp(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps    = 40;
    const stepSize = target / steps;
    const interval = durationMs / steps;
    let current    = 0;
    const id = setInterval(() => {
      current = Math.min(current + stepSize, target);
      setValue(Math.round(current));
      if (current >= target) clearInterval(id);
    }, interval);
    return () => clearInterval(id);
  }, [target, durationMs]);
  return value;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function ResultsScreen({
  playerName, avatar, score, maxStreak, answers, duration, rankPosition, onReplay, onLeaderboard,
}: ResultsScreenProps) {
  const correct  = answers.filter((a) => a.correct).length;
  const pct      = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const avgTime  = answers.length
    ? Math.round(answers.reduce((s, a) => s + a.timeSpent, 0) / answers.length)
    : 0;
  const grade    = getGrade(pct);
  const display  = useCountUp(score);

  const stats = [
    { icon: Target, label: 'Precisión',    value: `${pct}%`,              color: 'text-emerald-400' },
    { icon: Flame,  label: 'Racha máx.',   value: `×${maxStreak}`,        color: 'text-orange-400'  },
    { icon: Clock,  label: 'Tiempo medio', value: `${avgTime}s`,          color: 'text-cyan-400'    },
    { icon: Trophy, label: 'Tiempo total', value: formatDuration(duration), color: 'text-violet-400' },
  ];

  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl" aria-label="Resultados de la partida">

          {/* ── Grade header ── */}
          <div className="anim-fade-up mb-8 text-center" aria-live="polite">
            <p role="img" aria-label={grade.label} className="mb-3 text-6xl">{grade.emoji}</p>
            <h1 className={`text-3xl font-black ${grade.labelColor}`}>{grade.label}</h1>
            <p className="mt-1 text-[var(--color-muted)]" aria-label={`Jugador: ${playerName}`}>
              <span aria-hidden="true">{avatar}</span> {playerName}
            </p>
          </div>

          {/* ── Score + Stats: 2 columns on desktop ── */}
          <div className="anim-fade-up anim-delay-1 mb-6 flex flex-col gap-4 md:flex-row md:items-stretch md:gap-5">

            {/* Score card */}
            <Card padding="lg" className="text-center md:flex-1">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Puntuación final
              </p>
              <p
                className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text
                           text-7xl font-black tabular-nums text-transparent"
                aria-label={`${score} puntos`}
                aria-live="polite"
              >
                {display}
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted)]">
                {correct} de {answers.length} correctas · {pct}%
              </p>

              {rankPosition <= 10 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1   }}
                  transition={{ delay: 0.9, type: 'spring' }}
                  className="mt-4 flex justify-center"
                >
                  <Badge color="amber" icon={<Trophy className="h-3 w-3" aria-hidden="true" />}>
                    ¡Posición #{rankPosition} en el ranking!
                  </Badge>
                </motion.div>
              )}
            </Card>

            {/* Stats grid */}
            <div className="flex flex-col gap-4 md:flex-1">
              <ul role="list" className="grid grid-cols-2 gap-3 flex-1">
                {stats.map(({ icon: Icon, label, value, color }) => (
                  <li key={label}>
                    <Card padding="md" className="h-full text-center">
                      <Icon className={`mx-auto mb-1.5 h-5 w-5 ${color}`} aria-hidden="true" />
                      <p className={`text-xl font-black ${color}`}>{value}</p>
                      <p className="text-xs text-[var(--color-muted)]">{label}</p>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="anim-fade-up anim-delay-2 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={onReplay}
            >
              Jugar de nuevo
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              icon={<List className="h-4 w-4 text-violet-400" />}
              onClick={onLeaderboard}
            >
              Ver ranking completo
            </Button>
          </div>
      </div>
      </div>
    </AppShell>
  );
}
