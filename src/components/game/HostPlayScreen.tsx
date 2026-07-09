import { useState } from "react";
import { DistanceGameVisual } from "@/components/game/GameVisuals";
import { JoinCodeQrSheet } from "@/components/game/JoinCodeQrSheet";
import { db } from "@/lib/db";
import type { GameRecord } from "@/lib/types";
import { adjustGameTime } from "@/lib/useHostGameEngine";

type HostPlayScreenProps = {
  game: GameRecord;
  totalDistance: number;
  gameTimeRemaining: number;
  gameMeta?: { distanceLabel?: string; name?: string };
};

export function HostPlayScreen({
  game,
  totalDistance,
  gameTimeRemaining,
  gameMeta,
}: HostPlayScreenProps) {
  const [qrOpen, setQrOpen] = useState(false);

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

  const handleAdjustGameTime =
    game.status === "playing"
      ? (deltaSeconds: number) => {
          void adjustGameTime(game.id, deltaSeconds);
        }
      : undefined;

  return (
    <div className="relative h-dvh w-full">
      <DistanceGameVisual
        layout="fullscreen"
        gameType={game.gameType}
        distanceMeters={totalDistance}
        timeRemainingSeconds={gameTimeRemaining}
        durationSeconds={game.durationSeconds}
        bestDistanceMeters={bestDistance}
        distanceLabel={gameMeta?.distanceLabel ?? "Distance"}
        seaRouteDistanceMeters={game.seaRouteDistanceMeters}
        onAdjustGameTime={handleAdjustGameTime}
        joinCode={game.code}
        onJoinCodeClick={() => setQrOpen(true)}
      />
      <JoinCodeQrSheet
        code={game.code}
        open={qrOpen}
        onOpenChange={setQrOpen}
      />
    </div>
  );
}
