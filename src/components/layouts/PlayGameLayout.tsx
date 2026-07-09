import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { GameCodeDisplay } from "@/components/GameCodeDisplay";
import { DisconnectKickWatcher } from "@/components/game/DisconnectKickWatcher";
import { GameTimeControls } from "@/components/game/GameTimeControls";
import { LeaveGameButton } from "@/components/game/LeaveGameButton";
import { GameHostPresence } from "@/components/game/GamePresence";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { clearStoredPlayerId } from "@/lib/auth";
import { formatDistance } from "@/lib/game";
import { joinSearchDefaults } from "@/lib/routes";
import { adjustGameTime, endGame } from "@/lib/useHostGameEngine";
import { useGameSession } from "@/lib/useGameSession";
import { useLeaveGame } from "@/lib/useLeaveGame";

function SquadPanel({
  players,
  playerProgress,
  totalDistance,
  gameTimeRemaining,
  durationSeconds,
  onAdjustGameTime,
}: {
  players: {
    id: string;
    nickname: string;
    iconId?: string | null;
    avatarColor?: string | null;
  }[];
  playerProgress: {
    player: { id: string };
    hasAnsweredCurrent: boolean;
    distance: number;
    streak: number;
  }[];
  totalDistance: number;
  gameTimeRemaining: number;
  durationSeconds: number;
  onAdjustGameTime?: (deltaSeconds: number) => void;
}) {
  const progressByPlayer = new Map(
    playerProgress.map((item) => [item.player.id, item]),
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <GameTimeControls
        timeRemainingSeconds={gameTimeRemaining}
        durationSeconds={durationSeconds}
        onAdjustGameTime={onAdjustGameTime}
        timeClassName="text-primary"
      />
      <div>
        <p className="text-xs text-muted-foreground">Squad distance</p>
        <p className="font-mono text-xl font-bold">
          {formatDistance(totalDistance)}
        </p>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Squad</p>
        <ul className="space-y-2">
          {players.map((player) => {
            const progress = progressByPlayer.get(player.id);
            const hasAnswered = progress?.hasAnsweredCurrent ?? false;
            const status = hasAnswered ? "Answered" : "Playing";

            return (
              <li
                key={player.id}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <PlayerAvatar
                  nickname={player.nickname}
                  iconId={player.iconId}
                  avatarColor={player.avatarColor}
                  className="size-7"
                  iconClassName="size-3.5"
                />
                <span className="min-w-0 flex-1 truncate font-medium">
                  {player.nickname}
                </span>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {status}
                </Badge>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

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

  const squadPanel = (
    <SquadPanel
      players={players}
      playerProgress={playerProgress}
      totalDistance={totalDistance}
      gameTimeRemaining={gameTimeRemaining}
      durationSeconds={game.durationSeconds}
      onAdjustGameTime={handleAdjustGameTime}
    />
  );

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
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader className="border-b p-4">
            <Badge variant="secondary" className="w-fit">
              {gameMeta?.name ?? "Game"}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">Join code</p>
            <GameCodeDisplay code={game.code} size="md" className="mt-1" />
          </SidebarHeader>
          <SidebarContent className="p-4">
            <div className="space-y-4">
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
            </div>
            {showLeaveButton ? (
              <LeaveGameButton
                className="mt-6 hidden w-full xl:inline-flex"
                isLeaving={isLeaving}
                onLeave={handleLeave}
              />
            ) : null}
          </SidebarContent>
          <SidebarFooter className="space-y-2 border-t p-4 xl:hidden">
            <Sheet open={squadOpen} onOpenChange={setSquadOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Users className="size-4" />
                  View squad
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Squad</SheetTitle>
                  <SheetDescription>
                    {formatDistance(totalDistance)} traveled together
                  </SheetDescription>
                </SheetHeader>
                {squadPanel}
              </SheetContent>
            </Sheet>
            {isHost ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isEnding}
                  >
                    {isEnding ? "Ending..." : "End game"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End this game?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will stop the timer immediately and show the final
                      results screen to everyone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isEnding}>
                      Keep playing
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isEnding}
                      onClick={(event) => {
                        event.preventDefault();
                        handleEndGame();
                      }}
                    >
                      {isEnding ? "Ending..." : "End game"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            {showLeaveButton ? (
              <LeaveGameButton
                className="w-full xl:hidden"
                isLeaving={isLeaving}
                onLeave={handleLeave}
              />
            ) : null}
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="flex min-h-svh">
          <div className="flex flex-1 min-w-0">{children}</div>

          {isHost ? (
            <aside className="hidden w-72 shrink-0 border-l bg-card xl:block">
              <div className="sticky top-0 p-4">
                <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Users className="size-4" />
                  Squad
                </p>
                {squadPanel}
              </div>
            </aside>
          ) : null}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
