'use client';

import { FormEvent, useId, useState } from 'react';
import { Brain, Clock, Loader2, Plus, RefreshCw, Trophy, Zap } from 'lucide-react';
import { AVATARS } from '@/lib/questions';
import AppShell from './AppShell';
import Button   from './ui/Button';
import Card     from './ui/Card';

interface StartScreenProps {
  onStart:       (name: string, avatar: string) => void;
  onAddQuestion: () => void;
}

const FEATURES = [
  { icon: Brain,  label: '15 preguntas',   sublabel: 'aleatorias cada partida', color: 'text-violet-400' },
  { icon: Clock,  label: '15 seg',         sublabel: 'por pregunta',            color: 'text-cyan-400'   },
  { icon: Trophy, label: 'Ranking global', sublabel: 'compite con todos',       color: 'text-amber-400'  },
] as const;

export default function StartScreen({ onStart, onAddQuestion }: StartScreenProps) {
  const [name,        setName]        = useState('');
  const [avatar,      setAvatar]      = useState(AVATARS[0]);
  const [error,       setError]       = useState('');
  const [generating,  setGenerating]  = useState(false);
  const [genResult,   setGenResult]   = useState<{ ok: boolean; msg: string } | null>(null);

  const inputId       = useId();
  const errorId       = useId();
  const avatarGroupId = useId();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Escribe tu nombre para continuar');
      document.getElementById(inputId)?.focus();
      return;
    }
    onStart(trimmed, avatar);
  }

  async function handleGenerate() {
    setGenerating(true);
    setGenResult(null);
    try {
      const res  = await fetch('/api/questions/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error desconocido');
      setGenResult({ ok: true, msg: `✓ ${data.inserted} preguntas generadas y guardadas` });
    } catch (err: unknown) {
      setGenResult({ ok: false, msg: err instanceof Error ? err.message : 'Error al generar' });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <AppShell>
      <div className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-5xl">

        {/* ── Desktop: two columns / Mobile: stacked ── */}
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:gap-16">

          {/* ── Left: Hero + feature chips + actions ── */}
          <div className="flex-1 flex flex-col items-center text-center md:items-start md:text-left">

            {/* Hero */}
            <div className="anim-fade-up mb-8">
              <div
                aria-hidden="true"
                className="mb-6 mx-auto md:mx-0 flex h-20 w-20 items-center justify-center
                           rounded-2xl border border-violet-500/30 bg-violet-500/12
                           shadow-[0_0_50px_rgba(139,92,246,0.3)]"
                style={{ animation: 'float 3s ease-in-out 0.7s infinite' }}
              >
                <Brain className="h-10 w-10 text-violet-400" strokeWidth={1.4} />
              </div>
              <h2 className="text-5xl font-black tracking-tight sm:text-6xl">
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  ¿Listo para jugar?
                </span>
              </h2>
              <p className="mt-3 text-lg text-[var(--color-muted)]">¿Cuánto sabes realmente?</p>
              <p className="mt-2 max-w-xs text-sm text-[var(--color-subtle)] md:max-w-none">
                Pon a prueba tus conocimientos, mantén rachas y sube al ranking global.
              </p>
            </div>

            {/* Feature chips */}
            <ul role="list" className="anim-fade-up anim-delay-1 grid w-full grid-cols-3 gap-3">
              {FEATURES.map(({ icon: Icon, label, sublabel, color }) => (
                <li key={label}>
                  <Card padding="md" className="text-center">
                    <Icon className={`mx-auto mb-2 h-5 w-5 ${color}`} aria-hidden="true" strokeWidth={1.75} />
                    <p className="text-xs font-bold text-[var(--color-ink)]">{label}</p>
                    <p className="mt-0.5 text-[10px] text-[var(--color-muted)]">{sublabel}</p>
                  </Card>
                </li>
              ))}
            </ul>

            {/* ── Community actions ── */}
            <div className="anim-fade-up anim-delay-2 mt-5 flex flex-wrap items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={onAddQuestion}
              >
                Añadir pregunta
              </Button>

              <Button
                variant="ghost"
                size="sm"
                icon={
                  generating
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <RefreshCw className="h-3.5 w-3.5" />
                }
                onClick={handleGenerate}
                disabled={generating}
                aria-label="Generar 100 preguntas con IA"
              >
                {generating ? 'Generando…' : 'Generar preguntas con IA'}
              </Button>
            </div>

            {/* Generation result */}
            {genResult && (
              <p className={`mt-2 text-xs ${genResult.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {genResult.msg}
              </p>
            )}
          </div>

          {/* ── Right: Form card ── */}
          <div className="anim-fade-up anim-delay-2 w-full md:max-w-md md:shrink-0">
            <Card padding="lg" as="section" aria-label="Configurar perfil">
              <form onSubmit={handleSubmit} noValidate>

                {/* Avatar */}
                <fieldset className="mb-6">
                  <legend
                    id={avatarGroupId}
                    className="mb-3 text-sm font-medium text-[var(--color-muted)]"
                  >
                    Elige tu avatar
                  </legend>
                  <div
                    role="radiogroup"
                    aria-labelledby={avatarGroupId}
                    className="flex flex-wrap gap-2"
                  >
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
                            'flex h-11 w-11 items-center justify-center rounded-xl text-2xl',
                            'border transition-all duration-150',
                            selected
                              ? 'scale-110 border-violet-500 bg-violet-500/20 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-md)] hover:bg-[var(--color-surface-md)]',
                          ].join(' ')}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Name */}
                <div className="mb-6">
                  <label
                    htmlFor={inputId}
                    className="mb-2 block text-sm font-medium text-[var(--color-muted)]"
                  >
                    Tu nombre
                  </label>
                  <input
                    id={inputId}
                    type="text"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setError(''); }}
                    placeholder="¿Cómo te llamas?"
                    maxLength={20}
                    autoComplete="given-name"
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={!!error}
                    className="w-full rounded-[var(--radius-btn)] border border-[var(--color-border)]
                               bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink)]
                               placeholder:text-[var(--color-subtle)]
                               focus:border-violet-500 focus:bg-violet-500/5 focus:outline-none
                               transition-colors"
                  />
                  {error && (
                    <p
                      id={errorId}
                      role="alert"
                      className="mt-2 flex items-center gap-1.5 text-sm text-red-400"
                    >
                      <span aria-hidden="true">⚠</span>
                      {error}
                    </p>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<Zap className="h-4 w-4" />}
                  type="submit"
                >
                  Empezar el Quiz
                </Button>
              </form>
            </Card>
          </div>

        </div>
      </div>
      </div>
    </AppShell>
  );
}
