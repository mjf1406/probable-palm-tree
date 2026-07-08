import { isGoogleUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { GAME_TYPES, parseQuestionsSnapshot } from "@/lib/game";
import type { AnswerRecord, GameRecord, PlayerRecord } from "@/lib/types";

export function normalizeGame(
  raw: Record<string, unknown> | undefined,
): GameRecord | null {
  if (!raw) return null;
  return {
    id: raw.id as string,
    code: raw.code as string,
    gameType: raw.gameType as GameRecord["gameType"],
    status: raw.status as GameRecord["status"],
    currentQuestionIndex: raw.currentQuestionIndex as number,
    questionStartedAt: raw.questionStartedAt as number | undefined,
    progress: raw.progress as number,
    lives: raw.lives as number,
    questionTimeSeconds: raw.questionTimeSeconds as number,
    questionsSnapshot: parseQuestionsSnapshot(raw.questionsSnapshot),
    createdAt: raw.createdAt as number,
    deckTitle: raw.deckTitle as string | undefined,
    deckId: raw.deckId as string | undefined,
    endedAt: raw.endedAt as number | undefined,
    host: (raw.host as { id: string } | undefined) ?? null,
  };
}

export function useGameSession(code: string, playerId: string | null) {
  const { user, isLoading: authIsLoading } = db.useAuth();
  const upperCode = code.toUpperCase();

  const { isLoading, data, error } = db.useQuery({
    games: {
      $: { where: { code: upperCode } },
      host: {},
      players: { user: {} },
      answers: { player: {} },
    },
  });

  const game = normalizeGame(data?.games?.[0] as Record<string, unknown>);
  const players = (game ? (data?.games?.[0]?.players ?? []) : []) as PlayerRecord[];
  const answers = (game ? (data?.games?.[0]?.answers ?? []) : []) as AnswerRecord[];

  const isHost = Boolean(
    user && game?.host?.id === user.id && isGoogleUser(user),
  );
  const currentPlayer = playerId
    ? players.find((player) => player.id === playerId)
    : null;
  const gameMeta = GAME_TYPES.find((type) => type.id === game?.gameType);
  const currentQuestion =
    game?.questionsSnapshot[game.currentQuestionIndex] ?? null;
  const currentAnswers = answers.filter(
    (answer) => answer.questionIndex === game?.currentQuestionIndex,
  );
  const myAnswer = currentPlayer
    ? currentAnswers.find((answer) => answer.player?.id === currentPlayer.id)
    : null;

  return {
    upperCode,
    isLoading: isLoading || authIsLoading,
    error,
    game,
    players,
    answers,
    isHost,
    currentPlayer,
    gameMeta,
    currentQuestion,
    currentAnswers,
    myAnswer,
  };
}
