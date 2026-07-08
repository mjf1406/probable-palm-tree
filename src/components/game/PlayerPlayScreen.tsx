import { id } from "@instantdb/react";
import {
  AnswerOption,
  AnswerOptionGrid,
  AnswerStatusFooter,
} from "@/components/game/AnswerOption";
import { Progress } from "@/components/ui/progress";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { db } from "@/lib/db";
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
  onAnswer,
}: PlayerPlayScreenProps) {
  const timeRemaining = useQuestionTimer(
    game.questionStartedAt,
    game.questionTimeSeconds,
    game.status === "playing",
  );

  const options = (currentQuestion?.options ?? []).slice(0, 8);
  const optionCount = options.length;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-4xl flex-col items-center gap-6">
        <div className="flex w-full max-w-xs flex-col items-center">
          <div className="font-mono text-5xl font-bold tabular-nums text-primary md:text-6xl">
            {Math.ceil(timeRemaining)}
          </div>
          <Progress
            value={(timeRemaining / game.questionTimeSeconds) * 100}
            className="mt-3 h-1.5 w-full"
          />
        </div>

        <h1 className="w-full text-center text-3xl font-semibold leading-snug md:text-4xl">
          {currentQuestion?.text ?? "Loading question..."}
        </h1>

        <AnswerOptionGrid optionCount={optionCount} className="w-full">
          {options.map((option, index) => (
            <AnswerOption
              key={index}
              index={index}
              text={option}
              variant="interactive"
              disabled={Boolean(myAnswer) || revealing}
              onClick={() => onAnswer(index)}
            />
          ))}
        </AnswerOptionGrid>

        <AnswerStatusFooter
          message={
            myAnswer ? "Answer submitted — waiting for the squad..." : null
          }
        />
      </div>
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
