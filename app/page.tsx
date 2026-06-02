'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import StartScreen       from '@/components/StartScreen';
import QuizGame          from '@/components/QuizGame';
import ResultsScreen     from '@/components/ResultsScreen';
import Leaderboard       from '@/components/Leaderboard';
import AddQuestionScreen from '@/components/AddQuestionScreen';
import { AnswerRecord, Question } from '@/lib/types';
import { getRandomQuestions }    from '@/lib/questions';
import { getQuestionsForGame }   from '@/lib/db-questions';
import { saveRanking, getRankPosition } from '@/lib/rankings';

type Screen = 'start' | 'quiz' | 'results' | 'leaderboard' | 'addQuestion';

interface GameResult {
  score:        number;
  maxStreak:    number;
  answers:      AnswerRecord[];
  duration:     number;
  rankPosition: number;
  savedId:      string;
}

export default function Home() {
  const [screen,     setScreen]     = useState<Screen>('start');
  const [playerName, setPlayerName] = useState('');
  const [avatar,     setAvatar]     = useState('🧠');
  const [questions,  setQuestions]  = useState<Question[]>([]);
  const [result,     setResult]     = useState<GameResult | null>(null);
  const [loading,    setLoading]    = useState(false);

  const handleStart = useCallback(async (name: string, av: string) => {
    setPlayerName(name);
    setAvatar(av);
    setLoading(true);

    // Try DB first, fall back to local questions automatically
    let qs: Question[];
    try {
      qs = await getQuestionsForGame(15);
    } catch {
      qs = getRandomQuestions(15);
    }

    setQuestions(qs);
    setLoading(false);
    setScreen('quiz');
  }, []);

  const handleFinish = useCallback((
    score:     number,
    maxStreak: number,
    answers:   AnswerRecord[],
    duration:  number,
  ) => {
    const correct     = answers.filter((a) => a.correct).length;
    const percentage  = Math.round((correct / answers.length) * 100);
    const rankPosition = getRankPosition(score);

    const saved = saveRanking({
      name: playerName, avatar, score,
      totalQuestions: answers.length, percentage,
      streak: maxStreak, duration,
    });

    setResult({ score, maxStreak, answers, duration, rankPosition, savedId: saved.id });
    setScreen('results');
  }, [playerName, avatar]);

  const handleReplay = useCallback(async () => {
    setLoading(true);
    let qs: Question[];
    try {
      qs = await getQuestionsForGame(15);
    } catch {
      qs = getRandomQuestions(15);
    }
    setQuestions(qs);
    setLoading(false);
    setResult(null);
    setScreen('quiz');
  }, []);

  // Show a brief loading overlay while fetching questions from DB
  if (loading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-[var(--color-canvas)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        <p className="text-sm text-[var(--color-muted)]">Cargando preguntas…</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {screen === 'start' && (
        <StartScreen
          key="start"
          onStart={handleStart}
          onAddQuestion={() => setScreen('addQuestion')}
        />
      )}

      {screen === 'quiz' && (
        <QuizGame
          key="quiz"
          questions={questions}
          playerName={playerName}
          avatar={avatar}
          onFinish={handleFinish}
        />
      )}

      {screen === 'results' && result && (
        <ResultsScreen
          key="results"
          playerName={playerName}
          avatar={avatar}
          score={result.score}
          maxStreak={result.maxStreak}
          answers={result.answers}
          duration={result.duration}
          rankPosition={result.rankPosition}
          onReplay={handleReplay}
          onLeaderboard={() => setScreen('leaderboard')}
        />
      )}

      {screen === 'leaderboard' && (
        <Leaderboard
          key="leaderboard"
          onBack={() => setScreen(result ? 'results' : 'start')}
          highlightId={result?.savedId}
        />
      )}

      {screen === 'addQuestion' && (
        <AddQuestionScreen
          key="addQuestion"
          onBack={() => setScreen('start')}
        />
      )}
    </AnimatePresence>
  );
}
