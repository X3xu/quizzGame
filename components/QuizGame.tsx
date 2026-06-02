'use client';

import { useCallback, useEffect, useId, useReducer, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { AnswerRecord, Question } from '@/lib/types';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/questions';
import Card     from './ui/Card';
import Badge    from './ui/Badge';
import Timer    from './Timer';
import AppShell from './AppShell';

const QUESTION_TIME = 15;

/* ─── State machine ─────────────────────────────────────────────────── */

type Phase = 'idle' | 'answered';

interface State {
  idx:            number;
  score:          number;
  streak:         number;
  maxStreak:      number;
  phase:          Phase;
  selected:       string | null;
  timerKey:       number;     // incrementing forces Timer reset
  timerRunning:   boolean;
  answers:        AnswerRecord[];
  showStreakToast: boolean;
}

type Action =
  | { type: 'ANSWER';   option: string; timeSpent: number; correctAnswer: string }
  | { type: 'EXPIRE';   questionId: number }
  | { type: 'ADVANCE';  total: number }
  | { type: 'HIDE_TOAST' };

function reducer(state: State, action: Action): State {
  switch (action.type) {

    case 'ANSWER': {
      const isCorrect   = action.option === action.correctAnswer;
      const newStreak   = isCorrect ? state.streak + 1 : 0;
      const newMax      = Math.max(state.maxStreak, newStreak);
      const points      = isCorrect ? (newStreak >= 3 ? 2 : 1) : 0;
      const record: AnswerRecord = {
        questionId: 0,        // set by caller who has question context
        selected:   action.option,
        correct:    isCorrect,
        timeSpent:  action.timeSpent,
      };
      return {
        ...state,
        phase:          'answered',
        selected:       action.option,
        timerRunning:   false,
        score:          state.score + points,
        streak:         newStreak,
        maxStreak:      newMax,
        answers:        [...state.answers, record],
        showStreakToast: isCorrect && newStreak >= 3,
      };
    }

    case 'EXPIRE': {
      const record: AnswerRecord = {
        questionId: action.questionId,
        selected:   '',
        correct:    false,
        timeSpent:  QUESTION_TIME,
      };
      return {
        ...state,
        phase:          'answered',
        timerRunning:   false,
        streak:         0,
        answers:        [...state.answers, record],
        showStreakToast: false,
      };
    }

    case 'ADVANCE':
      if (state.idx + 1 >= action.total) return state; // guard — caller handles finish
      return {
        ...state,
        idx:          state.idx + 1,
        phase:        'idle',
        selected:     null,
        timerKey:     state.timerKey + 1,
        timerRunning: true,
      };

    case 'HIDE_TOAST':
      return { ...state, showStreakToast: false };

    default:
      return state;
  }
}

const INITIAL: State = {
  idx: 0, score: 0, streak: 0, maxStreak: 0,
  phase: 'idle', selected: null,
  timerKey: 0, timerRunning: true,
  answers: [], showStreakToast: false,
};

/* ─── Props ──────────────────────────────────────────────────────────── */

interface QuizGameProps {
  questions:  Question[];
  playerName: string;
  avatar:     string;
  onFinish:   (score: number, maxStreak: number, answers: AnswerRecord[], duration: number) => void;
}

/* ─── Option state helpers ───────────────────────────────────────────── */

type OptionState = 'idle' | 'correct' | 'incorrect' | 'revealed';

function getOptionState(
  option:      string,
  selected:    string | null,
  phase:       Phase,
  correctAnswer: string,
): OptionState {
  if (phase === 'idle') return 'idle';
  if (option === correctAnswer)       return selected === option ? 'correct' : 'revealed';
  if (option === selected)            return 'incorrect';
  return 'idle';
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function QuizGame({ questions, playerName, avatar, onFinish }: QuizGameProps) {
  const [state, dispatch]   = useReducer(reducer, INITIAL);
  const startTimeRef        = useRef(Date.now());
  const questionStartRef    = useRef(Date.now());
  const liveRef             = useRef<HTMLParagraphElement>(null);
  const questionLabelId     = useId();
  const liveFeedbackId      = useId();

  const current = questions[state.idx];
  const total   = questions.length;

  /* Reset question timer on each new question */
  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [state.idx]);

  /* Announce answer feedback to screen readers */
  useEffect(() => {
    if (state.phase !== 'answered' || !liveRef.current) return;
    const wasCorrect = state.answers.at(-1)?.correct;
    liveRef.current.textContent = wasCorrect ? '¡Correcto!' : 'Incorrecto.';
  }, [state.phase, state.answers]);

  /* Auto-advance after feedback window */
  useEffect(() => {
    if (state.phase !== 'answered') return;
    const id = setTimeout(() => {
      dispatch({ type: 'HIDE_TOAST' });
      if (state.idx + 1 >= total) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        onFinish(state.score, state.maxStreak, state.answers, duration);
      } else {
        dispatch({ type: 'ADVANCE', total });
      }
    }, 1100);
    return () => clearTimeout(id);
  }, [state.phase, state.idx, total, state.score, state.maxStreak, state.answers, onFinish]);

  const handleAnswer = useCallback((option: string) => {
    if (state.phase !== 'idle') return;
    const timeSpent = Math.round((Date.now() - questionStartRef.current) / 1000);
    dispatch({ type: 'ANSWER', option, timeSpent, correctAnswer: current.correctAnswer });
  }, [state.phase, current.correctAnswer]);

  const handleExpire = useCallback(() => {
    if (state.phase !== 'idle') return;
    dispatch({ type: 'EXPIRE', questionId: current.id });
  }, [state.phase, current.id]);

  return (
    <AppShell>
      {/* SR-only live region for answer feedback */}
      <p
        ref={liveRef}
        id={liveFeedbackId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-3xl flex flex-col">

          {/* ── Top bar ── */}
          <header className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="text-2xl leading-none">{avatar}</span>
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{playerName}</p>
                <p className="text-xs text-[var(--color-muted)]">{state.score} puntos</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {state.streak >= 2 && (
                <Badge color="orange" icon={<Flame className="h-3 w-3" aria-hidden="true" />}>
                  <span aria-label={`Racha de ${state.streak}`}>×{state.streak}</span>
                </Badge>
              )}
              <span className="font-mono text-sm text-[var(--color-muted)]" aria-label={`Pregunta ${state.idx + 1} de ${total}`}>
                {state.idx + 1}/{total}
              </span>
            </div>
          </header>

          {/* ── Progress bar ── */}
          <div
            role="progressbar"
            aria-valuenow={state.idx + 1}
            aria-valuemin={1}
            aria-valuemax={total}
            aria-label="Progreso del quiz"
            className="mb-6 flex gap-1"
          >
            {questions.map((_, i) => {
              const ans = state.answers[i];
              let cls = 'h-1.5 flex-1 rounded-full transition-colors duration-300 ';
              if      (i < state.idx) cls += ans?.correct ? 'bg-emerald-500' : 'bg-red-500';
              else if (i === state.idx) cls += 'bg-violet-400';
              else                      cls += 'bg-white/10';
              return <div key={i} className={cls} />;
            })}
          </div>

          {/* ── Question card ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.idx}
              className=""
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0  }}
              exit   ={{ opacity: 0, x: -48 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card padding="lg" as="article" aria-labelledby={questionLabelId}
                    className="flex flex-col">

                {/* Category + timer row */}
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <Badge color="slate">
                    <span aria-hidden="true">{CATEGORY_ICONS[current.category]}</span>
                    {CATEGORY_LABELS[current.category]}
                  </Badge>
                  <div className="flex-1 min-w-[120px]">
                    <Timer
                      key={state.timerKey}
                      duration={QUESTION_TIME}
                      running={state.timerRunning}
                      onExpire={handleExpire}
                    />
                  </div>
                </div>

                {/* Question text */}
                <h2
                  id={questionLabelId}
                  className="mb-8 text-2xl font-bold leading-snug text-[var(--color-ink)] sm:text-3xl"
                >
                  {current.question}
                </h2>

                {/* Options — pushed to bottom with mt-auto */}
                <div
                  role="group"
                  aria-label="Opciones de respuesta"
                  aria-describedby={liveFeedbackId}
                  className="mt-6 flex flex-col gap-3"
                >
                  {current.options.map((option, i) => {
                    const optState = getOptionState(option, state.selected, state.phase, current.correctAnswer);
                    const labels: Record<OptionState, string> = {
                      idle:      '',
                      correct:   ' — Correcto',
                      incorrect: ' — Incorrecto',
                      revealed:  ' — Respuesta correcta',
                    };
                    return (
                      <button
                        key={option}
                        type="button"
                        data-state={optState}
                        className="answer-option"
                        onClick={() => handleAnswer(option)}
                        disabled={state.phase !== 'idle'}
                        aria-label={`${option}${labels[optState]}`}
                      >
                        <span
                          aria-hidden="true"
                          className="flex h-7 w-7 shrink-0 items-center justify-center
                                     rounded-lg border border-[var(--color-border)]
                                     bg-white/5 text-xs font-bold text-[var(--color-muted)]"
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="answer-label">{option}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
      </div>
      </div>

      {/* ── Streak toast ── */}
      <AnimatePresence>
        {state.showStreakToast && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit   ={{ opacity: 0, y: -16, scale: 0.9  }}
            transition={{ type: 'spring', bounce: 0.35 }}
            className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2
                       flex items-center gap-2 rounded-full
                       bg-orange-500 px-5 py-2.5
                       text-sm font-bold text-white shadow-xl shadow-orange-500/30"
          >
            <Flame className="h-4 w-4" aria-hidden="true" />
            ¡Racha ×{state.streak}! +2 puntos
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
