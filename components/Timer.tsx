'use client';

import { useEffect, useRef, useState } from 'react';

interface TimerProps {
  duration: number;
  running: boolean;
  onExpire: () => void;
}

export default function Timer({ duration, running, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef  = useRef(onExpire);
  onExpireRef.current = onExpire;   // always up-to-date without re-running effect

  /* Reset when duration changes (new question) */
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (!running) {
      clearInterval(intervalRef.current ?? undefined);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current ?? undefined);
  }, [running]);

  const pct       = (timeLeft / duration) * 100;
  const isDanger  = timeLeft <= 3;
  const isWarning = timeLeft <= 6;

  const fillColor = isDanger
    ? '#ef4444'
    : isWarning
    ? '#f59e0b'
    : 'linear-gradient(90deg, #7c3aed, #06b6d4)';

  const fillStyle = isDanger || isWarning
    ? { width: `${pct}%`, backgroundColor: fillColor }
    : { width: `${pct}%`, background: fillColor };

  return (
    <div className="flex items-center gap-3" role="timer" aria-label={`${timeLeft} segundos restantes`}>
      <span
        aria-hidden="true"
        className={[
          'w-7 text-right text-xl font-black tabular-nums leading-none transition-colors',
          isDanger ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-[var(--color-ink)]',
        ].join(' ')}
      >
        {timeLeft}
      </span>

      <div className="timer-track flex-1" role="presentation">
        <div className="timer-fill" style={fillStyle} />
      </div>

      {/* Screen-reader-only live announcement at warning thresholds */}
      <span className="sr-only" aria-live="assertive" aria-atomic="true">
        {isDanger ? `¡Solo ${timeLeft} segundos!` : ''}
      </span>
    </div>
  );
}
