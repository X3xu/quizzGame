'use client';

import { FormEvent, useId, useState } from 'react';
import { Loader2, Swords } from 'lucide-react';
import { AVATARS } from '@/lib/questions';
import { getPlayerProfile } from '@/lib/multiplayer';
import Button   from '../ui/Button';
import Card     from '../ui/Card';
import AppShell from '../AppShell';

interface Props {
  hostName: string;
  joining:  boolean;
  error:    string | null;
  onJoin:   (name: string, avatar: string) => void;
}

export default function JoinForm({ hostName, joining, error, onJoin }: Props) {
  const profile = getPlayerProfile();
  const [name,   setName]   = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState(profile?.avatar ?? AVATARS[1]);
  const [localError, setLocalError] = useState('');
  const inputId = useId();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setLocalError('Escribe tu nombre para continuar'); return; }
    onJoin(trimmed, avatar);
  }

  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <Card padding="lg" className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div aria-hidden="true"
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl
                         border border-violet-500/30 bg-violet-500/12">
              <Swords className="h-7 w-7 text-violet-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-black text-[var(--color-ink)]">Reto 1 vs 1</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              <span className="font-semibold text-violet-300">{hostName}</span> te reta a un duelo de 10 preguntas.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <fieldset className="mb-5">
              <legend className="mb-3 text-sm font-medium text-[var(--color-muted)]">Elige tu avatar</legend>
              <div role="radiogroup" className="flex flex-wrap gap-2">
                {AVATARS.map((emoji) => {
                  const selected = emoji === avatar;
                  return (
                    <button
                      key={emoji}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Avatar ${emoji}`}
                      onClick={() => setAvatar(emoji)}
                      className={[
                        'flex h-11 w-11 items-center justify-center rounded-xl text-2xl border transition-all duration-150',
                        selected
                          ? 'scale-110 border-violet-500 bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-md)]',
                      ].join(' ')}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="mb-5">
              <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-[var(--color-muted)]">
                Tu nombre
              </label>
              <input
                id={inputId}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setLocalError(''); }}
                placeholder="¿Cómo te llamas?"
                maxLength={20}
                className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)]
                           bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]
                           placeholder:text-[var(--color-subtle)]
                           focus:border-violet-500 focus:bg-violet-500/5 focus:outline-none transition-colors"
              />
              {(localError || error) && (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
                  <span aria-hidden="true">⚠</span>{localError || error}
                </p>
              )}
            </div>

            <Button
              variant="primary" size="lg" fullWidth type="submit" disabled={joining}
              icon={joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />}
            >
              {joining ? 'Entrando…' : 'Aceptar reto'}
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
