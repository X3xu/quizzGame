'use client';

import { AnimatePresence } from 'framer-motion';
import StartScreen       from '@/components/StartScreen';
import QuizGame          from '@/components/QuizGame';
import ResultsScreen     from '@/components/ResultsScreen';
import Leaderboard       from '@/components/Leaderboard';
import AddQuestionScreen from '@/components/AddQuestionScreen';
import { useGameFlow }   from '@/hooks/useGameFlow';

export default function Home() {
  const {
    screen, playerName, avatar, questions, result, loading,
    startGame, finishGame, replayGame,
    goToLeaderboard, goToAddQuestion,
    backFromLeaderboard, backFromAddQuestion,
  } = useGameFlow();

  if (loading) {
    return (
      <div
        role="status"
        aria-label="Cargando preguntas"
        className="flex h-dvh flex-col items-center justify-center gap-3 bg-[var(--color-canvas)]"
      >
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
          onStart={startGame}
          onAddQuestion={goToAddQuestion}
          onLeaderboard={goToLeaderboard}
        />
      )}

      {screen === 'quiz' && (
        <QuizGame
          key="quiz"
          questions={questions}
          playerName={playerName}
          avatar={avatar}
          onFinish={finishGame}
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
          onReplay={replayGame}
          onLeaderboard={goToLeaderboard}
        />
      )}

      {screen === 'leaderboard' && (
        <Leaderboard
          key="leaderboard"
          onBack={backFromLeaderboard}
          highlightId={result?.savedId}
        />
      )}

      {screen === 'addQuestion' && (
        <AddQuestionScreen
          key="addQuestion"
          onBack={backFromAddQuestion}
        />
      )}
    </AnimatePresence>
  );
}
