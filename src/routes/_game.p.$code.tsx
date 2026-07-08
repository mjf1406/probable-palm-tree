import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GamePlayScreen } from "@/components/game/GamePlayScreen";
import { PlayerPlayEffects } from "@/components/game/PlayerPlayEffects";
import { getStoredPlayerId } from "@/lib/auth";
import { useGameSession } from "@/lib/useGameSession";

export const Route = createFileRoute("/_game/p/$code")({
  component: PlayerPlayRoute,
});

function PlayerPlayRoute() {
  const { code } = Route.useParams();
  const playerId = getStoredPlayerId(code);
  const navigate = useNavigate();
  const { upperCode, isLoading, game, isHost } = useGameSession(
    code,
    playerId,
  );

  useEffect(() => {
    if (isLoading) return;
    if (!game || !playerId || game.status !== "playing") {
      void navigate({
        to: "/g/$code",
        params: { code: upperCode },
      });
      return;
    }
    if (isHost) {
      void navigate({
        to: "/g/$code/play",
        params: { code: upperCode },
      });
    }
  }, [game, isHost, isLoading, navigate, playerId, upperCode]);

  if (isLoading || !game || !playerId || game.status !== "playing" || isHost) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Loading game...</p>
      </main>
    );
  }

  return (
    <PlayerPlayEffects code={code} playerId={playerId}>
      <GamePlayScreen code={code} playerId={playerId} />
    </PlayerPlayEffects>
  );
}
