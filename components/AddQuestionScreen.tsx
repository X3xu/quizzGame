'use client';

import { FormEvent, useId, useState } from 'react';
import { ArrowLeft, CheckCircle, Loader2, Plus, XCircle } from 'lucide-react';
import AppShell from './AppShell';
import Button   from './ui/Button';
import Card     from './ui/Card';

interface AddQuestionScreenProps {
  onBack: () => void;
}

const CATEGORIES = [
  { value: 'tecnologia',  label: 'Tecnología'    },
  { value: 'ciencia',     label: 'Ciencia'        },
  { value: 'historia',    label: 'Historia'       },
  { value: 'geografia',   label: 'Geografía'      },
  { value: 'deportes',    label: 'Deportes'       },
  { value: 'arte',        label: 'Arte y Cultura' },
  { value: 'naturaleza',  label: 'Naturaleza'     },
  { value: 'matematicas', label: 'Matemáticas'    },
];

type SubmitState = 'idle' | 'loading' | 'approved' | 'rejected' | 'error';

export default function AddQuestionScreen({ onBack }: AddQuestionScreenProps) {
  const [question,    setQuestion]    = useState('');
  const [options,     setOptions]     = useState(['', '', '', '']);
  const [correctIdx,  setCorrectIdx]  = useState<number | null>(null);
  const [category,    setCategory]    = useState('ciencia');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [resultNote,  setResultNote]  = useState('');
  const [errors,      setErrors]      = useState<string[]>([]);

  const qId   = useId();
  const catId = useId();

  function validate(): string[] {
    const errs: string[] = [];
    if (!question.trim())
      errs.push('Escribe el texto de la pregunta.');
    if (options.some((o) => !o.trim()))
      errs.push('Rellena las cuatro opciones de respuesta.');
    if (new Set(options.map((o) => o.trim().toLowerCase())).size < 4)
      errs.push('Las cuatro opciones deben ser diferentes.');
    if (correctIdx === null)
      errs.push('Haz clic en la letra de la opción correcta.');
    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }

    setErrors([]);
    setSubmitState('loading');

    try {
      const res = await fetch('/api/questions/submit', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question:       question.trim(),
          options:        options.map((o) => o.trim()),
          correct_answer: options[correctIdx!].trim(),
          category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitState('error');
        setResultNote(data.error ?? 'Error desconocido');
        return;
      }

      setSubmitState(data.approved ? 'approved' : 'rejected');
      setResultNote(data.note ?? '');

      if (data.approved) {
        setQuestion('');
        setOptions(['', '', '', '']);
        setCorrectIdx(null);
        setCategory('ciencia');
      }
    } catch (err: unknown) {
      setSubmitState('error');
      setResultNote(err instanceof Error ? err.message : 'Error de red');
    }
  }

  function reset() {
    setSubmitState('idle');
    setResultNote('');
  }

  /* ── Result screen ── */
  if (submitState !== 'idle' && submitState !== 'loading') {
    const approved = submitState === 'approved';
    const isError  = submitState === 'error';

    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
          <Card padding="lg" className="anim-fade-up w-full max-w-md text-center">
            {approved ? (
              <CheckCircle className="mx-auto mb-4 h-14 w-14 text-emerald-400" aria-hidden="true" />
            ) : (
              <XCircle className="mx-auto mb-4 h-14 w-14 text-red-400" aria-hidden="true" />
            )}

            <h2 className="mb-2 text-xl font-black text-[var(--color-ink)]">
              {approved ? '¡Pregunta aprobada!' : isError ? 'Error al enviar' : 'Pregunta rechazada'}
            </h2>
            <p className="mb-6 text-sm text-[var(--color-muted)]">{resultNote}</p>

            <div className="flex gap-3">
              <Button variant="ghost"   size="md" fullWidth onClick={onBack}>
                Volver
              </Button>
              <Button variant="primary" size="md" fullWidth onClick={reset}>
                Añadir otra
              </Button>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  /* ── Form ── */
  return (
    <AppShell>
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">

        {/* Header */}
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
          <div className="flex-1">
            <h1 className="text-xl font-black text-[var(--color-ink)]">Añadir pregunta</h1>
            <p className="text-xs text-[var(--color-muted)]">
              La IA revisará tu pregunta antes de publicarla
            </p>
          </div>
        </div>

        <Card padding="lg" as="section" aria-label="Formulario para añadir pregunta">
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

            {/* Validation errors */}
            {errors.length > 0 && (
              <ul
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 space-y-1"
              >
                {errors.map((e) => (
                  <li key={e} className="text-sm text-red-400">• {e}</li>
                ))}
              </ul>
            )}

            {/* Question text */}
            <div>
              <label
                htmlFor={qId}
                className="mb-2 block text-sm font-medium text-[var(--color-muted)]"
              >
                Pregunta
              </label>
              <textarea
                id={qId}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="¿Cuál es…?"
                rows={3}
                className="w-full resize-none rounded-[var(--radius-btn)]
                           border border-[var(--color-border)]
                           bg-[var(--color-surface)] px-4 py-3
                           text-sm text-[var(--color-ink)]
                           placeholder:text-[var(--color-subtle)]
                           focus:border-violet-500 focus:bg-violet-500/5 focus:outline-none
                           transition-colors"
              />
            </div>

            {/* Options */}
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-[var(--color-muted)]">
                Opciones{' '}
                <span className="font-normal text-[var(--color-subtle)]">
                  — haz clic en la letra para marcar la correcta
                </span>
              </legend>
              <div className="flex flex-col gap-2.5">
                {options.map((opt, i) => {
                  const isCorrect = correctIdx === i;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      {/* Letter toggle */}
                      <button
                        type="button"
                        onClick={() => setCorrectIdx(i)}
                        aria-label={`Marcar opción ${String.fromCharCode(65 + i)} como correcta`}
                        aria-pressed={isCorrect}
                        className={[
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          'border text-xs font-bold transition-all duration-150',
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 scale-110'
                            : 'border-[var(--color-border)] bg-white/5 text-[var(--color-muted)]' +
                              ' hover:border-violet-500/50 hover:text-violet-400',
                        ].join(' ')}
                      >
                        {String.fromCharCode(65 + i)}
                      </button>

                      {/* Text input */}
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...options];
                          next[i] = e.target.value;
                          setOptions(next);
                        }}
                        placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                        className={[
                          'flex-1 rounded-[var(--radius-btn)]',
                          'border px-4 py-2.5 text-sm text-[var(--color-ink)]',
                          'placeholder:text-[var(--color-subtle)]',
                          'focus:outline-none transition-colors',
                          isCorrect
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)]' +
                              ' focus:border-violet-500 focus:bg-violet-500/5',
                        ].join(' ')}
                      />
                    </div>
                  );
                })}
              </div>
            </fieldset>

            {/* Category */}
            <div>
              <label
                htmlFor={catId}
                className="mb-2 block text-sm font-medium text-[var(--color-muted)]"
              >
                Categoría
              </label>
              <select
                id={catId}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full appearance-none rounded-[var(--radius-btn)]
                           border border-[var(--color-border)]
                           bg-[var(--color-surface)] px-4 py-3
                           text-sm text-[var(--color-ink)]
                           focus:border-violet-500 focus:outline-none
                           transition-colors"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={submitState === 'loading'}
              icon={
                submitState === 'loading'
                  ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  : <Plus    className="h-4 w-4"               aria-hidden="true" />
              }
            >
              {submitState === 'loading' ? 'Revisando con IA…' : 'Enviar pregunta'}
            </Button>

          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-[var(--color-subtle)]">
          La IA verificará que la pregunta sea correcta, clara y original antes de publicarla.
        </p>

      </div>
      </div>
    </AppShell>
  );
}
