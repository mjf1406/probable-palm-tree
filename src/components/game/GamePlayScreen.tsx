import { HostPlayScreen } from "@/components/game/HostPlayScreen";
import {
  PlayerPlayScreen,
  submitAnswer,
} from "@/components/game/PlayerPlayScreen";
import { useGameSession } from "@/lib/useGameSession";
import { useHostGameEngine } from "@/lib/useHostGameEngine";

type GamePlayScreenProps = {
  code: string;
  playerId: string | null;
};

export function GamePlayScreen({ code, playerId }: GamePlayScreenProps) {
  const {
    game,
    players,
    answers,
    isHost,
    currentPlayer,
    gameMeta,
    currentQuestion,
    currentAnswers,
    myAnswer,
  } = useGameSession(code, playerId);

  const { revealing } = useHostGameEngine(
    isHost ? game : null,
    players,
    answers,
  );

  const handleAnswer = (choiceIndex: number) => {
    if (!game || !currentPlayer || !currentQuestion || myAnswer) return;
    if (game.status !== "playing" || revealing) return;

    void submitAnswer({
      gameId: game.id,
      playerId: currentPlayer.id,
      questionIndex: game.currentQuestionIndex,
      choiceIndex,
      correctIndex: currentQuestion.correctIndex,
    });
  };

  if (!game) return null;

  if (isHost) {
    return (
      <HostPlayScreen
        game={game}
        players={players}
        currentAnswers={currentAnswers}
        revealing={revealing}
        gameMeta={gameMeta}
      />
    );
  }

  return (
    <PlayerPlayScreen
      game={game}
      currentQuestion={currentQuestion}
      myAnswer={myAnswer ?? null}
      revealing={revealing}
      gameMeta={gameMeta}
      onAnswer={handleAnswer}
    />
  );
}
