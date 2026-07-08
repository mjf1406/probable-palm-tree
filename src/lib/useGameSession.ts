import { useEffect, useState } from "react";
import { isGoogleUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  GAME_TYPES,
  computePlayerDistance,
  computeTotalDistance,
  getGameTimeRemaining,
  getStreakMultiplier,
  getTimeRemaining,
  parseDurationSeconds,
  parseGameType,
  parseMetersPerCorrect,
  parseQuestionsSnapshot,
  parseSettingScope,
  parseShuffleMode,
} from "@/lib/game";
import {
  decodeAnswerQuestionIndex,
  getAnswerQuestionIndex,
} from "@/lib/usePlayerGameEngine";
import { useGameExpiryWatcher } from "@/lib/useGameExpiryWatcher";
import type { AnswerRecord, GameRecord, PlayerRecord } from "@/lib/types";

export function normalizeGame(
  raw: Record<string, unknown> | undefined,
): GameRecord | null {
  if (!raw) return null;
  return {
    id: raw.id as string,
    code: raw.code as string,
    gameType: parseGameType(raw.gameType),
    status: raw.status as GameRecord["status"],
    durationSeconds: parseDurationSeconds(raw.durationSeconds),
    startedAt: raw.startedAt as number | undefined,
    endsAt: raw.endsAt as number | undefined,
    questionTimeSeconds: raw.questionTimeSeconds as number,
    metersPerCorrect: parseMetersPerCorrect(raw.metersPerCorrect),
    questionsSnapshot: parseQuestionsSnapshot(raw.questionsSnapshot),
    seaOcean: raw.seaOcean as string | undefined,
    seaFromCity: raw.seaFromCity as string | undefined,
    seaToCity: raw.seaToCity as string | undefined,
    seaRouteDistanceMeters: raw.seaRouteDistanceMeters as number | undefined,
    seaRouteKey: raw.seaRouteKey as string | undefined,
    answerShuffleMode: parseShuffleMode(raw.answerShuffleMode),
    questionShuffleMode: parseShuffleMode(raw.questionShuffleMode),
    answerShuffleScope: parseSettingScope(raw.answerShuffleScope),
    questionShuffleScope: parseSettingScope(raw.questionShuffleScope),
    createdAt: raw.createdAt as number,
    deckTitle: raw.deckTitle as string | undefined,
    deckId: raw.deckId as string | undefined,
    endedAt: raw.endedAt as number | undefined,
    host: (raw.host as { id: string } | undefined) ?? null,
  };
}

function normalizePlayer(raw: Record<string, unknown>): PlayerRecord {
  const snapshot = raw.questionsSnapshot;
  return {
    id: raw.id as string,
    nickname: raw.nickname as string,
    joinedAt: raw.joinedAt as number,
    iconId: raw.iconId as string | undefined,
    avatarColor: raw.avatarColor as string | undefined,
    questionsSnapshot: snapshot
      ? parseQuestionsSnapshot(snapshot)
      : null,
    currentQuestionIndex: (raw.currentQuestionIndex as number) ?? 0,
    streak: (raw.streak as number) ?? 0,
    repetition: (raw.repetition as number) ?? 0,
    questionStartedAt: raw.questionStartedAt as number | undefined,
    user: (raw.user as { id: string } | undefined) ?? null,
  };
}

function normalizeAnswer(raw: Record<string, unknown>): AnswerRecord {
  return {
    id: raw.id as string,
    questionIndex: raw.questionIndex as number,
    choiceIndex: raw.choiceIndex as number,
    isCorrect: raw.isCorrect as boolean,
    answeredAt: raw.answeredAt as number,
    distanceGained: (raw.distanceGained as number) ?? 0,
    player: (raw.player as { id: string; nickname: string } | undefined) ?? null,
  };
}

export function useGameSession(code: string, playerId: string | null) {
  const { user, isLoading: authIsLoading } = db.useAuth();
  const upperCode = code.toUpperCase();

  const [tickNow, setTickNow] = useState(() => Date.now());

  const { isLoading, data, error } = db.useQuery({
    games: {
      $: { where: { code: upperCode } },
      host: {},
      players: { user: {} },
      answers: { player: {} },
    },
  });

  const game = normalizeGame(data?.games?.[0] as Record<string, unknown>);
  const gameId = game?.id;
  const gameStatus = game?.status;
  const gameStartedAt = game?.startedAt;
  useEffect(() => {
    // Drive the timer UI while the game is actively playing.
    // InstantDB doesn't update "every tick", so we need a local clock.
    if (gameId == null || gameStatus !== "playing" || gameStartedAt == null) return;

    const interval = window.setInterval(() => {
      setTickNow(Date.now());
    }, 250);

    return () => window.clearInterval(interval);
  }, [gameId, gameStatus, gameStartedAt]);

  const players = (game
    ? (data?.games?.[0]?.players ?? []).map((player) =>
        normalizePlayer(player as Record<string, unknown>),
      )
    : []) as PlayerRecord[];
  const answers = (game
    ? (data?.games?.[0]?.answers ?? []).map((answer) =>
        normalizeAnswer(answer as Record<string, unknown>),
      )
    : []) as AnswerRecord[];

  const isHost = Boolean(
    user && game?.host?.id === user.id && isGoogleUser(user),
  );
  const currentPlayer = playerId
    ? players.find((player) => player.id === playerId)
    : null;

  const tryEndIfExpired = useGameExpiryWatcher(
    game?.status === "playing" ? game : null,
    answers,
    isHost || Boolean(currentPlayer),
  );

  useEffect(() => {
    if (game?.status !== "playing") return;
    tryEndIfExpired(tickNow);
  }, [game?.status, tickNow, tryEndIfExpired]);

  const gameMeta = GAME_TYPES.find((type) => type.id === game?.gameType);

  const playerSnapshot =
    currentPlayer?.questionsSnapshot ?? game?.questionsSnapshot ?? [];
  const playerQuestionIndex = currentPlayer?.currentQuestionIndex ?? 0;
  const currentQuestion = playerSnapshot[playerQuestionIndex] ?? null;

  const answerQuestionIndex = currentPlayer
    ? getAnswerQuestionIndex(
        currentPlayer.currentQuestionIndex,
        currentPlayer.repetition,
      )
    : null;

  const myAnswer =
    currentPlayer && answerQuestionIndex !== null
      ? answers.find(
          (answer) =>
            answer.player?.id === currentPlayer.id &&
            answer.questionIndex === answerQuestionIndex,
        )
      : null;

  const totalDistance = computeTotalDistance(answers);
  const myDistance = currentPlayer
    ? computePlayerDistance(answers, currentPlayer.id)
    : 0;
  const myStreak = currentPlayer?.streak ?? 0;
  const myStreakMultiplier = getStreakMultiplier(myStreak + 1);
  const questionTimeRemaining =
    currentPlayer && game
      ? getTimeRemaining(
          currentPlayer.questionStartedAt,
          game.questionTimeSeconds,
        )
      : 0;
  const gameTimeRemaining = game
    ? getGameTimeRemaining(
        game.startedAt,
        game.durationSeconds,
        tickNow,
        game.endsAt,
      )
    : 0;

  const playerProgress = players.map((player) => {
    const snapshot = player.questionsSnapshot ?? game?.questionsSnapshot ?? [];
    const { repetition, questionIndex } = decodeAnswerQuestionIndex(
      getAnswerQuestionIndex(player.currentQuestionIndex, player.repetition),
    );
    return {
      player,
      distance: computePlayerDistance(answers, player.id),
      streak: player.streak,
      questionNumber: questionIndex + 1,
      repetition: repetition + 1,
      totalQuestions: snapshot.length,
      hasAnsweredCurrent: answers.some(
        (answer) =>
          answer.player?.id === player.id &&
          answer.questionIndex ===
            getAnswerQuestionIndex(
              player.currentQuestionIndex,
              player.repetition,
            ),
      ),
    };
  });

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
    myAnswer,
    totalDistance,
    myDistance,
    myStreak,
    myStreakMultiplier,
    questionTimeRemaining,
    gameTimeRemaining,
    playerProgress,
  };
}
