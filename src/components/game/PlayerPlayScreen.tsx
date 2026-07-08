import { id } from "@instantdb/react";
import { RobotGame, SubmarineGame } from "@/components/game/GameVisuals";
import {
  AnswerOption,
  AnswerOptionGrid,
  AnswerStatusFooter,
} from "@/components/game/AnswerOption";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { db } from "@/lib/db";
import { STARTING_LIVES } from "@/lib/game";
import type {
  AnswerRecord,
  GameRecord,
  QuestionSnapshot,
} from "@/lib/types";

type PlayerPlayScreenProps = {
  game: GameRecord;
  currentQuestion: QuestionSnapshot | null;
  myAnswer: AnswerRecord | null;
  revealing: boolean;
  gameMeta?: { resource?: string };
  onAnswer: (choiceIndex: number) => void;
};

export function PlayerPlayScreen({
  game,
  currentQuestion,
  myAnswer,
  revealing,
  gameMeta,
  onAnswer,
}: PlayerPlayScreenProps) {
  const timeRemaining = useQuestionTimer(
    game.questionStartedAt,
    game.questionTimeSeconds,
    game.status === "playing",
  );

  const GameVisual = game.gameType === "robot" ? RobotGame : SubmarineGame;

  return (
    <div className="space-y-6 p-6">
      <GameVisual
        progress={game.progress}
        lives={game.lives}
        maxLives={STARTING_LIVES}
        resourceLabel={gameMeta?.resource ?? "Resource"}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg leading-snug">
              {currentQuestion?.text ?? "Loading question..."}
            </CardTitle>
            <span className="shrink-0 font-mono text-2xl font-bold tabular-nums text-primary">
              {Math.ceil(timeRemaining)}
            </span>
          </div>
          <Progress
            value={(timeRemaining / game.questionTimeSeconds) * 100}
            className="h-1.5"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="min-h-6" aria-hidden />

          <AnswerOptionGrid>
            {currentQuestion?.options.map((option, index) => (
              <AnswerOption
                key={index}
                index={index}
                text={option}
                variant="interactive"
                disabled={Boolean(myAnswer) || revealing}
                onClick={() => onAnswer(index)}
              />
            ))}
            <AnswerStatusFooter
              message={
                myAnswer
                  ? "Answer submitted — waiting for the squad..."
                  : null
              }
            />
          </AnswerOptionGrid>
        </CardContent>
      </Card>
    </div>
  );
}

export function submitAnswer({
  gameId,
  playerId,
  questionIndex,
  choiceIndex,
  correctIndex,
}: {
  gameId: string;
  playerId: string;
  questionIndex: number;
  choiceIndex: number;
  correctIndex: number;
}) {
  const answerId = id();
  return db.transact(
    db.tx.answers[answerId]
      .update({
        questionIndex,
        choiceIndex,
        isCorrect: choiceIndex === correctIndex,
        answeredAt: Date.now(),
      })
      .link({ game: gameId, player: playerId }),
  );
}
