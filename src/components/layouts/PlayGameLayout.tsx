import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { GameCodeDisplay } from "@/components/GameCodeDisplay";
import { DisconnectKickWatcher } from "@/components/game/DisconnectKickWatcher";
import { LeaveGameButton } from "@/components/game/LeaveGameButton";
import { GameHostPresence } from "@/components/game/GamePresence";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuestionTimer } from "@/hooks/useQuestionTimer";
import { clearStoredPlayerId } from "@/lib/auth";
import { STARTING_LIVES } from "@/lib/game";
import { joinSearchDefaults } from "@/lib/routes";
import { useCancelGame } from "@/lib/useCancelGame";
import { useGameSession } from "@/lib/useGameSession";
import { useLeaveGame } from "@/lib/useLeaveGame";

import type { AnswerRecord } from "@/lib/types";

function SquadPanel({
  players,
  currentAnswers,
  totalPlayers,
  timeRemaining,
  questionTimeSeconds,
}: {
  players: {
    id: string;
    nickname: string;
    iconId?: string | null;
    avatarColor?: string | null;
  }[];
  currentAnswers: AnswerRecord[];
  totalPlayers: number;
  timeRemaining: number;
  questionTimeSeconds: number;
}) {
  const answeredIds = new Set(
    currentAnswers.map((answer) => answer.player?.id).filter(Boolean),
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Timer
        </p>
        <p className="font-mono text-3xl font-bold tabular-nums text-primary">
          {Math.ceil(timeRemaining)}
        </p>
        <Progress
          value={(timeRemaining / questionTimeSeconds) * 100}
          className="mt-2 h-1.5"
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">
          Squad ({currentAnswers.length}/{totalPlayers} answered)
        </p>
        <ul className="space-y-2">
          {players.map((player) => {
            const hasAnswered = answeredIds.has(player.id);
            const status = hasAnswered ? "Answered" : "Waiting";

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
  const isMobile = useIsMobile();
  const [squadOpen, setSquadOpen] = useState(false);
  const { cancel, isCancelling } = useCancelGame();
  const {
    upperCode,
    game,
    players,
    gameMeta,
    currentAnswers,
    isLoading,
    isHost,
    currentPlayer,
  } = useGameSession(code, playerId);
  const { leave, isLeaving } = useLeaveGame(code);

  const timeRemaining = useQuestionTimer(
    game?.questionStartedAt ?? undefined,
    game?.questionTimeSeconds ?? 0,
    game?.status === "playing",
  );

  useEffect(() => {
    if (!isMobile) {
      setSquadOpen(true);
    }
  }, [isMobile]);

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

  const handleLeave = () => {
    if (!currentPlayer) return;
    void leave(currentPlayer.id);
  };

  const handleEndGame = () => {
    if (!game) return;
    void cancel(
      game.id,
      players.map((player) => player.id),
    );
  };

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
      currentAnswers={currentAnswers}
      totalPlayers={players.length}
      timeRemaining={timeRemaining}
      questionTimeSeconds={game.questionTimeSeconds}
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
                <p className="text-xs text-muted-foreground">
                  Question {game.currentQuestionIndex + 1} of{" "}
                  {game.questionsSnapshot.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {gameMeta?.resource ?? "Resource"}
                </p>
                <p className="text-lg font-semibold">
                  {game.lives} / {STARTING_LIVES}
                </p>
              </div>
              {isHost ? (
                <div>
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <Progress value={game.progress} className="mt-1 h-2" />
                  <p className="mt-1 text-sm font-medium">
                    {Math.round(game.progress)}%
                  </p>
                </div>
              ) : null}
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
                    {currentAnswers.length}/{players.length} players answered
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
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Ending..." : "End game"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End this game?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will immediately remove all players and invalidate
                      this join code. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isCancelling}>
                      Keep playing
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={isCancelling}
                      onClick={(event) => {
                        event.preventDefault();
                        handleEndGame();
                      }}
                    >
                      {isCancelling ? "Ending..." : "End game"}
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
