import { DistanceGameVisual } from "@/components/game/GameVisuals";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDistance } from "@/lib/game";
import type { GameRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

type HostPlayScreenProps = {
  game: GameRecord;
  playerProgress: {
    player: {
      id: string;
      nickname: string;
      iconId?: string | null;
      avatarColor?: string | null;
    };
    distance: number;
    streak: number;
    questionNumber: number;
    repetition: number;
    totalQuestions: number;
    hasAnsweredCurrent: boolean;
  }[];
  totalDistance: number;
  gameTimeRemaining: number;
  gameMeta?: { distanceLabel?: string; name?: string };
};

export function HostPlayScreen({
  game,
  playerProgress,
  totalDistance,
  gameTimeRemaining,
  gameMeta,
}: HostPlayScreenProps) {
  const { data: highScoreData } = db.useQuery(
    game.deckId
      ? {
          highScores: {
            $: {
              where: {
                "deck.id": game.deckId,
                gameType: game.gameType,
                ...(game.gameType === "seaSailors" && game.seaRouteKey
                  ? { seaRouteKey: game.seaRouteKey }
                  : {}),
              },
            },
          },
        }
      : null,
  );

  const bestDistance = highScoreData?.highScores?.[0]?.distanceMeters ?? null;

  return (
    <div className="space-y-6 p-6">
      <DistanceGameVisual
        gameType={game.gameType}
        distanceMeters={totalDistance}
        timeRemainingSeconds={gameTimeRemaining}
        durationSeconds={game.durationSeconds}
        bestDistanceMeters={bestDistance}
        distanceLabel={gameMeta?.distanceLabel ?? "Distance"}
        seaRouteDistanceMeters={game.seaRouteDistanceMeters}
      />

      <Card>
        <CardHeader>
          <CardTitle>Squad progress</CardTitle>
          <CardDescription>
            Each player advances at their own pace. Streaks multiply how far
            they push the squad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {playerProgress.map(
              ({
                player,
                distance,
                streak,
                questionNumber,
                repetition,
                totalQuestions,
                hasAnsweredCurrent,
              }) => (
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
                    <p className="text-xs text-muted-foreground">
                      Q{questionNumber}/{totalQuestions} · Run {repetition} ·{" "}
                      {formatDistance(distance)} pushed
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {streak > 0 ? (
                      <Badge variant="secondary">x{Math.min(streak, 10)}</Badge>
                    ) : null}
                    <Badge variant={hasAnsweredCurrent ? "secondary" : "outline"}>
                      {hasAnsweredCurrent ? "Answered" : "Playing"}
                    </Badge>
                  </div>
                </li>
              ),
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
