'use client';

import { Brain } from 'lucide-react';
import { ReactNode } from 'react';
import PageBackground from './PageBackground';

interface AppShellProps {
  children: ReactNode;
  /** Extra classes on the <main> element (e.g. flex/grid overrides) */
  mainClassName?: string;
}

export default function AppShell({ children, mainClassName = '' }: AppShellProps) {
  return (
    <div className="flex h-dvh flex-col">
      <PageBackground />

      {/* ── Global header ── */}
      <header className="relative z-20 flex items-center justify-between
                         border-b border-[var(--color-border)] px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center
                       rounded-lg border border-violet-500/30 bg-violet-500/15"
          >
            <Brain className="h-4 w-4 text-violet-400" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-bold tracking-tight text-[var(--color-ink)]">
            Quiz<span className="text-violet-400">Game</span>
          </span>
        </div>
        <span className="rounded-full border border-violet-500/25 bg-violet-500/10
                         px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-violet-400">
          Quiz
        </span>
      </header>

      {/* ── Page content ── */}
      <main className={`relative z-10 flex-1 flex flex-col ${mainClassName}`}>
        {children}
      </main>

      {/* ── Minimal footer ── */}
      <footer className="relative z-20 border-t border-[var(--color-border)] px-6 py-3 text-center">
        <p className="text-[11px] text-[var(--color-subtle)]">
          Responde rápido · Mantén rachas · Sube al ranking
        </p>
      </footer>
    </div>
  );
}
