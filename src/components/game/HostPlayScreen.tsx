import { RobotGame, SubmarineGame } from "@/components/game/GameVisuals";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { STARTING_LIVES } from "@/lib/game";
import type { AnswerRecord, GameRecord, PlayerRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type HostPlayScreenProps = {
  game: GameRecord;
  players: PlayerRecord[];
  currentAnswers: AnswerRecord[];
  revealing: boolean;
  gameMeta?: { resource?: string; name?: string };
};

function getPlayerStatus(
  player: PlayerRecord,
  currentAnswers: AnswerRecord[],
  revealing: boolean,
): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
  const answer = currentAnswers.find((item) => item.player?.id === player.id);
  if (!answer) {
    return { label: "Waiting", variant: "outline" };
  }
  if (!revealing) {
    return { label: "Answered", variant: "secondary" };
  }
  return answer.isCorrect
    ? { label: "Correct", variant: "default" }
    : { label: "Incorrect", variant: "destructive" };
}

export function HostPlayScreen({
  game,
  players,
  currentAnswers,
  revealing,
  gameMeta,
}: HostPlayScreenProps) {
  const timeRemaining = useQuestionTimer(
    game.questionStartedAt,
    game.questionTimeSeconds,
    game.status === "playing",
  );

  const GameVisual = game.gameType === "robot" ? RobotGame : SubmarineGame;
  const correctCount = currentAnswers.filter((answer) => answer.isCorrect).length;
  const questionNumber = game.currentQuestionIndex + 1;
  const questionTotal = game.questionsSnapshot.length;

  return (
    <div className="space-y-6 p-6">
      <GameVisual
        progress={game.progress}
        lives={game.lives}
        maxLives={STARTING_LIVES}
        resourceLabel={gameMeta?.resource ?? "Resource"}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Question</CardDescription>
            <CardTitle className="text-2xl">
              {questionNumber} / {questionTotal}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Timer</CardDescription>
            <CardTitle className="font-mono text-2xl tabular-nums">
              {Math.ceil(timeRemaining)}s
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress
              value={(timeRemaining / game.questionTimeSeconds) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Answered</CardDescription>
            <CardTitle className="text-2xl">
              {currentAnswers.length} / {players.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {revealing
                ? `${correctCount} correct this round`
                : "Waiting for the squad..."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Squad progress</CardTitle>
          <CardDescription>
            Track who has answered — question content stays hidden on the host
            screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {players.map((player) => {
              const status = getPlayerStatus(player, currentAnswers, revealing);
              return (
                <li
                  key={player.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3",
                  )}
                >
                  <PlayerAvatar
                    nickname={player.nickname}
                    iconId={player.iconId}
                    avatarColor={player.avatarColor}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{player.nickname}</p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{gameMeta?.resource ?? "Resource"}</CardDescription>
            <CardTitle>
              {game.lives} / {STARTING_LIVES}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress
              value={(game.lives / STARTING_LIVES) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Mission progress</CardDescription>
            <CardTitle>{Math.round(game.progress)}%</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Progress value={game.progress} className="h-2" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
