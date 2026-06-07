'use client';

import { useState } from 'react';
import { Check, Copy, Loader2, Swords, X } from 'lucide-react';
import type { MatchState } from '@/lib/types';
import { matchShareUrl } from '@/lib/multiplayer';
import Button   from '../ui/Button';
import Card     from '../ui/Card';
import AppShell from '../AppShell';

interface Props {
  match: MatchState;
  onCancel: () => void;
}

export default function MultiplayerLobby({ match, onCancel }: Props) {
  const [copied, setCopied]   = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const url = matchShareUrl(match.id);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the input is selectable as a fallback */
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <Card padding="lg" className="w-full max-w-md text-center">
          <div aria-hidden="true"
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl
                       border border-violet-500/30 bg-violet-500/12
                       shadow-[0_0_40px_rgba(139,92,246,0.3)]"
            style={{ animation: 'float 3s ease-in-out infinite' }}>
            <Swords className="h-8 w-8 text-violet-400" strokeWidth={1.5} />
          </div>

          <h1 className="mb-1 text-2xl font-black text-[var(--color-ink)]">Sala creada</h1>
          <p className="mb-6 text-sm text-[var(--color-muted)]">
            Comparte este enlace con tu rival. La partida empieza en cuanto se una.
          </p>

          <div className="mb-3 flex items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Enlace de la sala"
              className="min-w-0 flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)]
                         bg-[var(--color-surface)] px-3 py-2.5 text-xs text-[var(--color-muted)]"
            />
            <Button
              variant={copied ? 'primary' : 'ghost'}
              size="md"
              icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              onClick={copy}
              aria-label="Copiar enlace"
            >
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
          </div>

          <div className="mb-7 flex items-center justify-center gap-2 text-sm text-[var(--color-muted)]">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" aria-hidden="true" />
            Esperando a que se una tu rival…
          </div>

          <Button
            variant="danger"
            size="md"
            fullWidth
            icon={<X className="h-4 w-4" />}
            disabled={cancelling}
            onClick={() => { setCancelling(true); onCancel(); }}
          >
            Cancelar sala
          </Button>
        </Card>
      </div>
    </AppShell>
  );
}
