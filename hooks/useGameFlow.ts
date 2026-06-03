'use client';

import { useState, useCallback } from 'react';
import { AnswerRecord, Question } from '@/lib/types';
import { getRandomQuestions }  from '@/lib/questions';
import { getQuestionsForGame } from '@/lib/db-questions';
import { getRankings }         from '@/lib/rankings';
import { getDeviceId }         from '@/lib/device-id';

export type Screen = 'start' | 'quiz' | 'results' | 'leaderboard' | 'addQuestion';

export interface GameResult {
  score:        number;
  maxStreak:    number;
  answers:      AnswerRecord[];
  duration:     number;
  rankPosition: number;
  savedId:      string;
}

async function fetchQuestions(): Promise<Question[]> {
  try { return await getQuestionsForGame(15); }
  catch { return getRandomQuestions(15); }
}

export function useGameFlow() {
  const [screen,     setScreen]     = useState<Screen>('start');
  const [playerName, setPlayerName] = useState('');
  const [avatar,     setAvatar]     = useState('🧠');
  const [questions,  setQuestions]  = useState<Question[]>([]);
  const [result,     setResult]     = useState<GameResult | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const startGame = useCallback(async (name: string, av: string) => {
    setPlayerName(name);
    setAvatar(av);
    setLoading(true);
    setError(null);
    setQuestions(await fetchQuestions());
    setLoading(false);
    setScreen('quiz');
  }, []);

  const finishGame = useCallback(async (
    score:     number,
    maxStreak: number,
    answers:   AnswerRecord[],
    duration:  number,
  ) => {
    const correct    = answers.filter(a => a.correct).length;
    const percentage = Math.round((correct / answers.length) * 100);

    // Save via server-side API (validates, rate-limits, runs moderation)
    let savedId = crypto.randomUUID();
    let rankPosition = 1;

    try {
      const [saveRes, posRes] = await Promise.all([
        fetch('/api/rankings', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: playerName, avatar, score,
            totalQuestions: answers.length, percentage,
            streak: maxStreak, duration,
            deviceId: getDeviceId(),
            answers: answers.map(a => ({ correct: a.correct, timeSpent: a.timeSpent })),
          }),
        }),
        fetch(`/api/rankings?position_for_score=${score}`),
      ]);

      if (saveRes.ok) {
        const saved = await saveRes.json();
        savedId = saved.id;
      }
      if (posRes.ok) {
        const pos = await posRes.json();
        rankPosition = pos.position ?? 1;
      }
    } catch (err) {
      console.warn('[useGameFlow] Could not save ranking:', err);
    }

    setResult({ score, maxStreak, answers, duration, rankPosition, savedId });
    setScreen('results');
  }, [playerName, avatar]);

  const replayGame = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setQuestions(await fetchQuestions());
    setLoading(false);
    setScreen('quiz');
  }, []);

  return {
    // State
    screen, playerName, avatar, questions, result, loading, error,
    // Actions
    startGame,
    finishGame,
    replayGame,
    goToLeaderboard:      () => setScreen('leaderboard'),
    goToAddQuestion:      () => setScreen('addQuestion'),
    backFromLeaderboard:  () => setScreen(result ? 'results' : 'start'),
    backFromAddQuestion:  () => setScreen('start'),
  };
}
