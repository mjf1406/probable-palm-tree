import { HostPlayScreen } from "@/components/game/HostPlayScreen";
import { PlayerPlayScreen } from "@/components/game/PlayerPlayScreen";
import { useGameSession } from "@/lib/useGameSession";
import {
  submitPlayerAnswer,
  usePlayerGameEngine,
} from "@/lib/usePlayerGameEngine";

type GamePlayScreenProps = {
  code: string;
  playerId: string | null;
};

export function GamePlayScreen({ code, playerId }: GamePlayScreenProps) {
  const {
    game,
    answers,
    isHost,
    currentPlayer,
    gameMeta,
    currentQuestion,
    myAnswer,
    totalDistance,
    myDistance,
    myStreak,
    myStreakMultiplier,
    gameTimeRemaining,
    playerProgress,
  } = useGameSession(code, playerId);

  usePlayerGameEngine(
    !isHost ? game : null,
    !isHost ? (currentPlayer ?? null) : null,
    answers,
  );

  const handleAnswer = (choiceIndex: number) => {
    if (!game || !currentPlayer || !currentQuestion || myAnswer) return;
    if (game.status !== "playing") return;

    void submitPlayerAnswer({
      game,
      player: currentPlayer,
      choiceIndex,
      correctIndex: currentQuestion.correctIndex,
    });
  };

  if (!game) return null;

  if (isHost) {
    return (
      <HostPlayScreen
        game={game}
        playerProgress={playerProgress}
        totalDistance={totalDistance}
        gameTimeRemaining={gameTimeRemaining}
        gameMeta={gameMeta}
      />
    );
  }

  return (
    <PlayerPlayScreen
      game={game}
      currentQuestion={currentQuestion}
      myAnswer={myAnswer ?? null}
      myStreak={myStreak}
      myStreakMultiplier={myStreakMultiplier}
      myDistance={myDistance}
      totalDistance={totalDistance}
      questionStartedAt={currentPlayer?.questionStartedAt}
      onAnswer={handleAnswer}
    />
  );
}
