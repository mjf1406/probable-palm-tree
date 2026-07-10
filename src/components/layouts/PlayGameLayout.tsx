import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PanelLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { DisconnectKickWatcher } from "@/components/game/DisconnectKickWatcher";
import { GameTimeControls } from "@/components/game/GameTimeControls";
import { GameHostPresence } from "@/components/game/GamePresence";
import { HostSquadProgressList } from "@/components/game/HostSquadProgressList";
import { LeaveGameButton } from "@/components/game/LeaveGameButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Credenza,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { TooltipProvider } from "@/components/ui/tooltip";
import { clearStoredPlayerId } from "@/lib/auth";
import { formatDistance } from "@/lib/game";
import { joinSearchDefaults } from "@/lib/routes";
import { adjustGameTime, endGame } from "@/lib/useHostGameEngine";
import { useGameSession } from "@/lib/useGameSession";
import { useLeaveGame } from "@/lib/useLeaveGame";

type PlayGameLayoutProps = {
  code: string;
  playerId: string | null;
  children: ReactNode;
};

export function PlayGameLayout({
  code,
  playerId,
  children,
}: PlayGameLayoutProps) {
  const navigate = useNavigate();
  const [controlsOpen, setControlsOpen] = useState(false);
  const [squadOpen, setSquadOpen] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const {
    upperCode,
    game,
    players,
    gameMeta,
    answers,
    isLoading,
    isHost,
    currentPlayer,
    totalDistance,
    gameTimeRemaining,
    playerProgress,
  } = useGameSession(code, playerId);
  const { leave, isLeaving } = useLeaveGame(code);

  useEffect(() => {
    if (isLoading || isHost) return;
    if (game) return;
    if (!playerId) return;

    clearStoredPlayerId(upperCode);
    toast.error("The host ended this game.");
    void navigate({ to: "/join", search: joinSearchDefaults });
  }, [game, isHost, isLoading, navigate, playerId, upperCode]);

  useEffect(() => {
    if (isLoading || !game || !playerId || isHost) return;
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

  useEffect(() => {
    if (isLoading || !game) return;
    if (game.status === "ended") {
      void navigate({ to: "/g/$code", params: { code: upperCode } });
    }
  }, [game, isLoading, navigate, upperCode]);

  const handleLeave = () => {
    if (!currentPlayer) return;
    void leave(currentPlayer.id);
  };

  const handleEndGame = () => {
    if (!game) return;
    if (isEnding) return;
    setIsEnding(true);
    void endGame(game.id, game, answers).finally(() => {
      setIsEnding(false);
    });
  };

  const handleAdjustGameTime =
    isHost && game?.status === "playing"
      ? (deltaSeconds: number) => {
          if (!game) return;
          void adjustGameTime(game.id, deltaSeconds);
        }
      : undefined;

  const showLeaveButton = !isHost && Boolean(currentPlayer);

  if (isLoading || !game) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">
          {!isLoading && !game && playerId && !isHost
            ? "Returning to join..."
            : "Loading game..."}
        </p>
      </main>
    );
  }

  return (
    <TooltipProvider>
      {isHost ? (
        <>
          <GameHostPresence gameId={game.id} />
          <DisconnectKickWatcher
            game={game}
            players={players}
            isHost={isHost}
          />
        </>
      ) : null}

      <div className="relative h-dvh w-full overflow-hidden">
        <div className="h-full w-full">{children}</div>

        {isHost ? (
          <>
            <Sheet open={controlsOpen} onOpenChange={setControlsOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="fixed left-4 top-4 z-40 size-12 rounded-full shadow-lg"
                  aria-label="Open game controls"
                >
                  <PanelLeft className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Game controls</SheetTitle>
                  <SheetDescription>
                    Adjust time, view squad distance, or end the game.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 px-4">
                  <Badge variant="secondary" className="w-fit">
                    {gameMeta?.name ?? "Game"}
                  </Badge>
                  <div>
                    <p className="text-xs text-muted-foreground">Squad distance</p>
                    <p className="text-lg font-semibold">
                      {formatDistance(totalDistance)}
                    </p>
                  </div>
                  <GameTimeControls
                    label="Time remaining"
                    timeRemainingSeconds={gameTimeRemaining}
                    durationSeconds={game.durationSeconds}
                    onAdjustGameTime={handleAdjustGameTime}
                    labelClassName="normal-case tracking-normal text-muted-foreground"
                    timeClassName="text-lg font-semibold"
                  />
                  <Credenza>
                    <CredenzaTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={isEnding}
                      >
                        {isEnding ? "Ending..." : "End game"}
                      </Button>
                    </CredenzaTrigger>
                    <CredenzaContent>
                      <CredenzaHeader>
                        <CredenzaTitle>End this game?</CredenzaTitle>
                        <CredenzaDescription>
                          This will stop the timer immediately and show the final
                          results screen to everyone.
                        </CredenzaDescription>
                      </CredenzaHeader>
                      <CredenzaFooter>
                        <CredenzaClose asChild>
                          <Button variant="outline" disabled={isEnding}>
                            Keep playing
                          </Button>
                        </CredenzaClose>
                        <Button
                          variant="destructive"
                          disabled={isEnding}
                          onClick={handleEndGame}
                        >
                          {isEnding ? "Ending..." : "End game"}
                        </Button>
                      </CredenzaFooter>
                    </CredenzaContent>
                  </Credenza>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={squadOpen} onOpenChange={setSquadOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="fixed right-4 top-4 z-40 size-12 rounded-full shadow-lg"
                  aria-label="Open squad progress"
                >
                  <Users className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Squad progress</SheetTitle>
                  <SheetDescription>
                    Each player advances at their own pace. Streaks multiply how
                    far they push the squad.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4">
                  <HostSquadProgressList playerProgress={playerProgress} />
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          showLeaveButton ? (
            <div className="fixed bottom-4 right-4 z-30">
              <LeaveGameButton isLeaving={isLeaving} onLeave={handleLeave} />
            </div>
          ) : null
        )}
      </div>
    </TooltipProvider>
  );
}
