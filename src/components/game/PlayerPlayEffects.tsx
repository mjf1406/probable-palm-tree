import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { DisconnectKickWatcher } from "@/components/game/DisconnectKickWatcher";
import { GamePlayerPresence } from "@/components/game/GamePresence";
import { useAutoLeaveOnClose } from "@/hooks/useAutoLeaveOnClose";
import { clearStoredPlayerId } from "@/lib/auth";
import { joinSearchDefaults } from "@/lib/routes";
import { useGameSession } from "@/lib/useGameSession";
import { useLeaveGame } from "@/lib/useLeaveGame";

type PlayerPlayEffectsProps = {
  code: string;
  playerId: string | null;
  children: ReactNode;
};

/** Presence, kick detection, and auto-leave for players — no chrome. */
export function PlayerPlayEffects({
  code,
  playerId,
  children,
}: PlayerPlayEffectsProps) {
  const navigate = useNavigate();
  const {
    upperCode,
    game,
    players,
    isLoading,
    isHost,
    currentPlayer,
  } = useGameSession(code, playerId);
  const { hasLeftRef } = useLeaveGame(code);

  useAutoLeaveOnClose({
    code: upperCode,
    playerId,
    enabled: !isHost && Boolean(currentPlayer),
    hasLeftRef,
  });

  useEffect(() => {
    if (isLoading || isHost) return;

    // Host deleted/cancelled the game while the player was still on play.
    if (!game && playerId) {
      clearStoredPlayerId(upperCode);
      toast.error("The host ended this game.");
      void navigate({ to: "/join", search: joinSearchDefaults });
      return;
    }

    if (!game || !playerId) return;
    if (currentPlayer) return;

    clearStoredPlayerId(upperCode);
    toast.error("You were removed from the game.");
    void navigate({ to: "/join", search: joinSearchDefaults });
  }, [
    currentPlayer,
    game,
    isHost,
    isLoading,
    navigate,
    playerId,
    upperCode,
  ]);

  return (
    <>
      {game && currentPlayer ? (
        <GamePlayerPresence
          gameId={game.id}
          playerId={currentPlayer.id}
          nickname={currentPlayer.nickname}
        />
      ) : null}
      {game ? (
        <DisconnectKickWatcher
          game={game}
          players={players}
          isHost={false}
        />
      ) : null}
      {children}
    </>
  );
}
