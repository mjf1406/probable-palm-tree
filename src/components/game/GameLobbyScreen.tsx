import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { DisconnectKickWatcher } from "@/components/game/DisconnectKickWatcher";
import { LobbyView } from "@/components/game/LobbyView";
import {
  GameHostPresence,
  GamePlayerPresence,
} from "@/components/game/GamePresence";
import { RobotGame, SubmarineGame } from "@/components/game/GameVisuals";
import { GameSetupDialog, toSnapshot } from "@/components/host/GameSetupDialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { clearStoredPlayerId } from "@/lib/auth";
import { db } from "@/lib/db";
import { STARTING_LIVES, formatCode } from "@/lib/game";
import { joinSearchDefaults } from "@/lib/routes";
import { useGameSession } from "@/lib/useGameSession";
import { startGame } from "@/lib/useHostGameEngine";
import { useCancelGame } from "@/lib/useCancelGame";
import { useLeaveGame } from "@/lib/useLeaveGame";
import { useAutoLeaveOnClose } from "@/hooks/useAutoLeaveOnClose";

type GameLobbyScreenProps = {
  code: string;
  playerId: string | null;
};

export function GameLobbyScreen({ code, playerId }: GameLobbyScreenProps) {
  const navigate = useNavigate();
  const [rematchOpen, setRematchOpen] = useState(false);
  const {
    upperCode,
    isLoading,
    error,
    game,
    players,
    answers,
    isHost,
    currentPlayer,
    gameMeta,
  } = useGameSession(code, playerId);
  const { user } = db.useAuth();
  const { data: decksData } = db.useQuery(
    isHost && user
      ? {
          decks: {
            questions: {},
            owner: {},
          },
        }
      : null,
  );
  const { leave, isLeaving, hasLeftRef } = useLeaveGame(upperCode);
  const { cancel, isCancelling } = useCancelGame();
  const hadLobbyGameRef = useRef(false);

  useAutoLeaveOnClose({
    code: upperCode,
    playerId,
    enabled: !isHost && Boolean(currentPlayer),
    hasLeftRef,
  });

  useEffect(() => {
    if (game?.status === "lobby") {
      hadLobbyGameRef.current = true;
    }
  }, [game?.status]);

  useEffect(() => {
    if (isLoading || game || isHost || !currentPlayer) return;
    if (!hadLobbyGameRef.current) return;

    hadLobbyGameRef.current = false;
    clearStoredPlayerId(upperCode);
    toast.error("The host cancelled this game.");
    void navigate({ to: "/join", search: joinSearchDefaults });
  }, [currentPlayer, game, isHost, isLoading, navigate, upperCode]);

  useEffect(() => {
    if (isLoading || !game) return;
    if (game.status === "playing") {
      void navigate({
        to: "/g/$code/play",
        params: { code: upperCode },
      });
    }
  }, [game, isLoading, navigate, upperCode]);

  useEffect(() => {
    if (isLoading || !game || !playerId || isHost) return;
    if (game.status !== "lobby") return;
    if (currentPlayer) return;

    clearStoredPlayerId(upperCode);
    toast.error("You were removed from the lobby.");
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

  const handleStart = async () => {
    if (!game) return;
    if (players.length === 0) {
      toast.error("Wait for at least one player to join.");
      return;
    }
    await startGame(game.id);
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-muted-foreground">Loading game...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Game not found</CardTitle>
            <CardDescription>
              No game exists with code{" "}
              <span className="font-mono">{formatCode(upperCode)}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/join" search={joinSearchDefaults}>
                Join a game
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const GameVisual =
    game.gameType === "robot" ? RobotGame : SubmarineGame;

  const launchableDecks = (decksData?.decks ?? [])
    .map((deck) => ({
      id: deck.id as string,
      title: deck.title as string,
      questions: toSnapshot(
        (deck.questions ?? []) as {
          text: string;
          options: unknown;
          correctIndex: number;
          order: number;
        }[],
      ),
    }))
    .filter((deck) => deck.questions.length > 0);

  if (game.status === "won" || game.status === "lost") {
    return (
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl">
              {game.status === "won" ? "Victory!" : "Game Over"}
            </CardTitle>
            <CardDescription>
              {game.status === "won"
                ? "Your squad completed the mission together!"
                : "You ran out of resources. Try again!"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <GameVisual
              progress={game.progress}
              lives={game.lives}
              maxLives={STARTING_LIVES}
              resourceLabel={gameMeta?.resource ?? "Resource"}
            />
            {isHost ? (
              <>
                <Button onClick={() => setRematchOpen(true)}>Play again</Button>
                <GameSetupDialog
                  open={rematchOpen}
                  onOpenChange={setRematchOpen}
                  mode="rematch"
                  decks={launchableDecks}
                  initialDeckId={game.deckId}
                  initialGameType={game.gameType}
                  initialQuestionTime={game.questionTimeSeconds}
                  rematchGame={game}
                  answerIds={answers.map((answer) => answer.id)}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Waiting for the host to start the next round...
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  if (game.status === "lobby") {
    return (
      <>
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
        {currentPlayer ? (
          <GamePlayerPresence
            gameId={game.id}
            playerId={currentPlayer.id}
            nickname={currentPlayer.nickname}
          />
        ) : null}
        <LobbyView
        code={game.code}
        gameTypeName={gameMeta?.name ?? "Game"}
        players={players}
        isHost={isHost}
        currentPlayer={currentPlayer}
        currentPlayerNickname={currentPlayer?.nickname}
        onStart={() => void handleStart()}
        onCancel={
          isHost
            ? () => void cancel(game.id, players.map((player) => player.id))
            : undefined
        }
        onLeave={
          !isHost && currentPlayer
            ? () => void leave(currentPlayer.id)
            : undefined
        }
        isLeaving={isLeaving}
        isCancelling={isCancelling}
      />
      </>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-muted-foreground">Starting game...</p>
    </main>
  );
}
