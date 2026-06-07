'use client';

import { Home, Loader2, RefreshCw, Trophy } from 'lucide-react';
import type { MatchRole, MatchState } from '@/lib/types';
import Button   from '../ui/Button';
import Card     from '../ui/Card';
import AppShell from '../AppShell';

interface Props {
  match: MatchState;
  role:  MatchRole;
  rematching: boolean;
  onRematch:  () => void;
  onHome:     () => void;
}

export default function MultiplayerResults({ match, role, rematching, onRematch, onHome }: Props) {
  const me  = role === 'host' ? match.host : match.guest!;
  const opp = role === 'host' ? match.guest! : match.host;
  const iWon = match.winner === role;
  const tie  = match.winner === 'tie';

  const headline = tie ? '¡Empate!' : iWon ? '¡Has ganado! 🎉' : 'Has perdido';
  const opponentWantsRematch = !!match.rematchId;

  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <Card padding="lg" className="w-full max-w-md text-center">
          <div aria-hidden="true" className={[
            'mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border',
            iWon ? 'border-amber-500/40 bg-amber-500/15 shadow-[0_0_50px_rgba(245,158,11,0.3)]'
                 : tie ? 'border-slate-500/30 bg-slate-500/15'
                       : 'border-[var(--color-border)] bg-[var(--color-surface)]',
          ].join(' ')}>
            <Trophy className={iWon ? 'h-10 w-10 text-amber-400' : 'h-10 w-10 text-[var(--color-subtle)]'} strokeWidth={1.4} />
          </div>

          <h1 className="mb-6 text-3xl font-black text-[var(--color-ink)]">{headline}</h1>

          {/* Final score */}
          <div className="mb-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <ScoreCol avatar={me.avatar}  name="Tú"        score={me.score}  win={iWon} />
            <span className="text-lg font-black text-[var(--color-subtle)]">vs</span>
            <ScoreCol avatar={opp.avatar} name={opp.name}  score={opp.score} win={!iWon && !tie} />
          </div>

          {opponentWantsRematch && (
            <p className="mb-3 text-sm font-medium text-violet-300">
              Tu rival quiere la revancha 👀
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              variant="primary" size="lg" fullWidth disabled={rematching}
              icon={rematching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              onClick={onRematch}
            >
              {opponentWantsRematch ? 'Unirse a la revancha' : 'Revancha'}
            </Button>
            <Button variant="ghost" size="md" fullWidth icon={<Home className="h-4 w-4" />} onClick={onHome}>
              Volver al inicio
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function ScoreCol({ avatar, name, score, win }: { avatar: string; name: string; score: number; win: boolean }) {
  return (
    <div className={[
      'rounded-[var(--radius-card)] border p-3',
      win ? 'border-amber-500/40 bg-amber-500/10' : 'border-[var(--color-border)]',
    ].join(' ')}>
      <p aria-hidden="true" className="mb-1 text-3xl leading-none">{avatar}</p>
      <p className="truncate text-xs font-semibold text-[var(--color-ink)]" title={name}>{name}</p>
      <p className={['text-2xl font-black', win ? 'text-amber-400' : 'text-[var(--color-ink)]'].join(' ')}>{score}</p>
    </div>
  );
}
