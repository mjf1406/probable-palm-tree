import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { DisconnectKickWatcher } from "@/components/game/DisconnectKickWatcher";
import { LobbyView } from "@/components/game/LobbyView";
import {
  GameHostPresence,
  GamePlayerPresence,
} from "@/components/game/GamePresence";
import { DistanceGameVisual } from "@/components/game/GameVisuals";
import { GameSetupDialog } from "@/components/host/GameSetupDialog";
import { CancelGameButton } from "@/components/game/CancelGameButton";
import { SaveScoreForm } from "@/components/game/SaveScoreForm";
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
import {
  computePlayerDistance,
  formatCode,
  formatDistance,
  getLevelName,
} from "@/lib/game";
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
    totalDistance,
    playerProgress,
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
  const { data: highScoreData } = db.useQuery(
    game?.deckId && game.status === "ended"
      ? {
          highScores: {
            $: {
              where: {
                "deck.id": game.deckId,
                gameType: game.gameType,
              },
            },
          },
        }
      : null,
  );
  const { leave, isLeaving, hasLeftRef } = useLeaveGame(upperCode);
  const { cancel, isCancelling } = useCancelGame();
  const hadGameRef = useRef(false);

  useAutoLeaveOnClose({
    code: upperCode,
    playerId,
    enabled: !isHost && Boolean(currentPlayer),
    hasLeftRef,
  });

  useEffect(() => {
    if (game) {
      hadGameRef.current = true;
    }
  }, [game]);

  useEffect(() => {
    if (isLoading || game || isHost) return;
    if (!hadGameRef.current && !playerId) return;

    hadGameRef.current = false;
    clearStoredPlayerId(upperCode);
    toast.error("The host ended this game.");
    void navigate({ to: "/join", search: joinSearchDefaults });
  }, [game, isHost, isLoading, navigate, playerId, upperCode]);

  useEffect(() => {
    if (isLoading || !game) return;
    if (game.status === "playing") {
      void navigate({
        to: isHost ? "/g/$code/play" : "/p/$code",
        params: { code: upperCode },
      });
    }
  }, [game, isHost, isLoading, navigate, upperCode]);

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
    if (!isHost && playerId) {
      return (
        <main className="mx-auto max-w-4xl px-6 py-10">
          <p className="text-muted-foreground">Returning to join...</p>
        </main>
      );
    }

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

  const launchableDecks = (decksData?.decks ?? [])
    .map((deck) => ({
      id: deck.id as string,
      title: deck.title as string,
      answerShuffleMode: deck.answerShuffleMode as string | null | undefined,
      questionShuffleMode: deck.questionShuffleMode as
        | string
        | null
        | undefined,
      answerShuffleScope: deck.answerShuffleScope as string | null | undefined,
      questionShuffleScope: deck.questionShuffleScope as
        | string
        | null
        | undefined,
      questionTimeSeconds: deck.questionTimeSeconds as number | null | undefined,
      questions: (deck.questions ?? []) as {
        text: string;
        options: unknown;
        correctIndex?: number;
        order: number;
        questionType?: unknown;
        answerConfig?: unknown;
      }[],
    }))
    .filter((deck) => deck.questions.length > 0);

  const bestDistance = highScoreData?.highScores?.[0]?.distanceMeters ?? null;
  const isNewHighScore =
    game.status === "ended" &&
    bestDistance !== null &&
    totalDistance >= bestDistance &&
    totalDistance > 0;

  if (game.status === "ended") {
    const myAnswers = currentPlayer
      ? answers.filter((answer) => answer.player?.id === currentPlayer.id)
      : [];
    const myTotal = myAnswers.length;
    const myCorrect = myAnswers.filter((answer) => answer.isCorrect).length;
    const myPercent = myTotal > 0 ? (myCorrect / myTotal) * 100 : 0;

    return (
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl">Time&apos;s up!</CardTitle>
            <CardDescription>
              {isNewHighScore
                ? "New high score for this deck!"
                : "Here is how far the squad traveled."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <DistanceGameVisual
              gameType={game.gameType}
              distanceMeters={totalDistance}
              timeRemainingSeconds={0}
              durationSeconds={game.durationSeconds}
              bestDistanceMeters={bestDistance}
              distanceLabel={gameMeta?.distanceLabel ?? "Distance"}
          seaRouteDistanceMeters={game.seaRouteDistanceMeters}
            />

            {game.gameType === "seaSailors" ? (
              <div className="rounded-xl border p-4 text-left">
                <p className="text-sm text-muted-foreground">Route progress</p>
                <p className="text-lg font-semibold">
                  {game.seaRouteDistanceMeters
                    ? `${Math.min(100, Math.round((totalDistance / game.seaRouteDistanceMeters) * 100))}%`
                    : "--"}
                </p>
                <p className="mt-1 text-sm text-white/70">
                  {formatDistance(totalDistance)} sailed
                </p>
              </div>
            ) : (
              <div className="rounded-xl border p-4 text-left">
                <p className="text-sm text-muted-foreground">
                  Deepest level reached
                </p>
                <p className="text-lg font-semibold">
                  {getLevelName(game.gameType, totalDistance)}
                </p>
              </div>
            )}

            {currentPlayer ? (
              <div className="rounded-xl border p-4 text-left">
                <p className="text-sm text-muted-foreground">Your accuracy</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {myCorrect} / {myTotal} correct ({myPercent.toFixed(1)}%)
                </p>
              </div>
            ) : null}

            <div className="rounded-xl border p-4 text-left">
              <p className="mb-3 text-sm font-medium">Player contributions</p>
              <ul className="space-y-2">
                {playerProgress.map(({ player }) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{player.nickname}</span>
                    <span className="font-mono">
                      {formatDistance(
                        computePlayerDistance(answers, player.id),
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {isHost && user ? (
              <SaveScoreForm
                key={`${game.id}-${game.endedAt ?? "pending"}`}
                game={game}
                totalDistance={totalDistance}
                userId={user.id}
              />
            ) : null}

            {isHost ? (
              <div className="flex flex-col items-center gap-3">
                <Button onClick={() => setRematchOpen(true)}>Play again</Button>
                <CancelGameButton
                  label="Terminate session"
                  title="Terminate this session?"
                  description="This will remove all players and invalidate this join code. This cannot be undone."
                  confirmLabel="Terminate session"
                  isCancelling={isCancelling}
                  onCancel={() =>
                    void cancel(
                      game.id,
                      players.map((player) => player.id),
                    )
                  }
                />
                <GameSetupDialog
                  open={rematchOpen}
                  onOpenChange={setRematchOpen}
                  mode="rematch"
                  decks={launchableDecks}
                  initialDeckId={game.deckId}
                  initialGameType={game.gameType}
                  initialQuestionTime={game.questionTimeSeconds}
                  initialDurationSeconds={game.durationSeconds}
                  initialMetersPerCorrect={game.metersPerCorrect}
                  rematchGame={game}
                  players={players}
                  answerIds={answers.map((answer) => answer.id)}
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Waiting for the host to start the next run...
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
