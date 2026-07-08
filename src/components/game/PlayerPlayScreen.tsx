import {
  AnswerOption,
  AnswerOptionGrid,
  AnswerStatusFooter,
} from "@/components/game/AnswerOption";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { formatDistance } from "@/lib/game";
import type { AnswerRecord, GameRecord, QuestionSnapshot } from "@/lib/types";

type PlayerPlayScreenProps = {
  game: GameRecord;
  currentQuestion: QuestionSnapshot | null;
  myAnswer: AnswerRecord | null;
  myStreak: number;
  myStreakMultiplier: number;
  myDistance: number;
  totalDistance: number;
  questionStartedAt?: number | null;
  onAnswer: (choiceIndex: number) => void;
};

export function PlayerPlayScreen({
  game,
  currentQuestion,
  myAnswer,
  myStreak,
  myStreakMultiplier,
  myDistance,
  totalDistance,
  questionStartedAt,
  onAnswer,
}: PlayerPlayScreenProps) {
  const timeRemaining = useQuestionTimer(
    questionStartedAt,
    game.questionTimeSeconds,
    game.status === "playing" && !myAnswer,
  );
  const options = (currentQuestion?.options ?? []).slice(0, 8);
  const optionCount = options.length;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-4xl flex-col items-center gap-6">
        <div className="flex w-full max-w-2xl flex-wrap items-center justify-center gap-3">
          <Badge variant="secondary" className="text-sm">
            Squad: {formatDistance(totalDistance)}
          </Badge>
          <Badge variant="outline" className="text-sm">
            You: {formatDistance(myDistance)}
          </Badge>
          {myStreak > 0 ? (
            <Badge className="text-sm">
              Streak x{myStreakMultiplier} on next correct
            </Badge>
          ) : (
            <Badge variant="outline" className="text-sm">
              Next correct: 1 m
            </Badge>
          )}
        </div>

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
              disabled={Boolean(myAnswer)}
              onClick={() => onAnswer(index)}
            />
          ))}
        </AnswerOptionGrid>

        <AnswerStatusFooter
          message={
            myAnswer
              ? myAnswer.isCorrect
                ? `+${myAnswer.distanceGained} m — keep the streak going!`
                : "Wrong — streak reset. Next question..."
              : null
          }
        />
      </div>
    </div>
  );
}
