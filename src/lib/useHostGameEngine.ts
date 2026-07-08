import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import {
  buildPlayerQuestionsSnapshot,
  computeTotalDistance,
  getDeckShuffleConfig,
  needsPerPlayerSnapshot,
  parseDurationSeconds,
  parseQuestionsSnapshot,
} from "@/lib/game";
import type {
  AnswerRecord,
  GameRecord,
  QuestionSnapshot,
} from "@/lib/types";

async function upsertHighScore({
  deckId,
  gameType,
  distanceMeters,
  seaRouteKey,
  seaRouteDistanceMeters,
}: {
  deckId: string | null | undefined;
  gameType: string;
  distanceMeters: number;
  seaRouteKey?: string | null;
  seaRouteDistanceMeters?: number | null;
}) {
  if (!deckId || distanceMeters <= 0) return;

  const compareAsPercent =
    gameType === "seaSailors" &&
    seaRouteDistanceMeters !== undefined &&
    seaRouteDistanceMeters !== null &&
    seaRouteDistanceMeters > 0;

  const compareDistance = compareAsPercent
    ? distanceMeters / seaRouteDistanceMeters
    : distanceMeters;

  const { data } = await db.queryOnce({
    highScores: {
      $: {
        where: {
          "deck.id": deckId,
          gameType,
          ...(gameType === "seaSailors" && seaRouteKey
            ? { seaRouteKey }
            : {}),
        },
      },
    },
  });

  const existing = data.highScores?.[0];
  if (existing) {
    const existingCompare = compareAsPercent
      ? existing.distanceMeters / seaRouteDistanceMeters
      : existing.distanceMeters;
    if (existingCompare >= compareDistance) return;
  }

  const achievedAt = Date.now();
  if (existing) {
    await db.transact(
      db.tx.highScores[existing.id].update({
        distanceMeters,
        achievedAt,
        ...(gameType === "seaSailors" && seaRouteKey ? { seaRouteKey } : {}),
      }),
    );
    return;
  }

  const highScoreId = id();
  await db.transact(
    db.tx.highScores[highScoreId]
      .update({
        gameType,
        distanceMeters,
        achievedAt,
        ...(gameType === "seaSailors" && seaRouteKey ? { seaRouteKey } : {}),
      })
      .link({ deck: deckId }),
  );
}

export async function endGame(
  gameId: string,
  game: GameRecord,
  answers: AnswerRecord[],
) {
  const totalDistance = computeTotalDistance(answers);
  await db.transact(
    db.tx.games[gameId].update({
      status: "ended",
      endedAt: Date.now(),
    }),
  );
  await upsertHighScore({
    deckId: game.deckId,
    gameType: game.gameType,
    distanceMeters: totalDistance,
    seaRouteKey: game.seaRouteKey,
    seaRouteDistanceMeters: game.seaRouteDistanceMeters,
  });
}

export async function startGame(gameId: string) {
  const { data } = await db.queryOnce({
    games: { $: { where: { id: gameId } } },
  });
  const raw = data.games[0];
  if (!raw) return;

  const durationSeconds = parseDurationSeconds(raw.durationSeconds);
  const now = Date.now();
  await db.transact(
    db.tx.games[gameId].update({
      status: "playing",
      startedAt: now,
      endsAt: now + durationSeconds * 1000,
    }),
  );
}

export async function adjustGameTime(gameId: string, deltaSeconds: number) {
  const { data } = await db.queryOnce({
    games: { $: { where: { id: gameId } } },
  });
  const raw = data.games[0];
  if (!raw || raw.status !== "playing" || raw.endsAt == null) return;

  const durationSeconds = parseDurationSeconds(raw.durationSeconds);
  const now = Date.now();
  const newEndsAt = Math.max(now + 1000, raw.endsAt + deltaSeconds * 1000);
  const newDuration = Math.max(1, durationSeconds + deltaSeconds);

  await db.transact(
    db.tx.games[gameId].update({
      endsAt: newEndsAt,
      durationSeconds: newDuration,
    }),
  );
}

export async function launchGame({
  hostId,
  code,
  gameType,
  questionsSnapshot,
  questionTimeSeconds,
  durationSeconds,
  metersPerCorrect,
  deckTitle,
  deckId,
  answerShuffleMode,
  questionShuffleMode,
  answerShuffleScope,
  questionShuffleScope,
  seaOcean,
  seaFromCity,
  seaToCity,
  seaRouteDistanceMeters,
  seaRouteKey,
}: {
  hostId: string;
  code: string;
  gameType: string;
  questionsSnapshot: unknown;
  questionTimeSeconds: number;
  durationSeconds: number;
  metersPerCorrect: number;
  deckTitle?: string;
  deckId?: string;
  answerShuffleMode: string;
  questionShuffleMode: string;
  answerShuffleScope: string;
  questionShuffleScope: string;
  seaOcean?: string;
  seaFromCity?: string;
  seaToCity?: string;
  seaRouteDistanceMeters?: number;
  seaRouteKey?: string;
}) {
  const gameId = id();
  await db.transact(
    db.tx.games[gameId]
      .update({
        code,
        gameType,
        status: "lobby",
        durationSeconds,
        questionTimeSeconds,
        metersPerCorrect,
        questionsSnapshot,
        answerShuffleMode,
        questionShuffleMode,
        answerShuffleScope,
        questionShuffleScope,
        createdAt: Date.now(),
        deckTitle,
        deckId,
        ...(gameType === "seaSailors"
          ? {
              seaOcean,
              seaFromCity,
              seaToCity,
              seaRouteDistanceMeters,
              seaRouteKey,
            }
          : {}),
      })
      .link({ host: hostId }),
  );
  return { gameId, code };
}

function buildInitialPlayerSnapshot(
  gameSnapshot: QuestionSnapshot[],
  settings: ReturnType<typeof getDeckShuffleConfig>,
  playerId: string,
): QuestionSnapshot[] {
  if (needsPerPlayerSnapshot(settings)) {
    return buildPlayerQuestionsSnapshot(gameSnapshot, settings, playerId);
  }
  return [...gameSnapshot];
}

async function buildPlayerSnapshotForGame(
  gameId: string,
  playerId: string,
): Promise<QuestionSnapshot[]> {
  const { data } = await db.queryOnce({
    games: {
      $: { where: { id: gameId } },
    },
  });
  const game = data.games[0];
  if (!game) return [];

  const settings = getDeckShuffleConfig(game);
  const baseSnapshot = parseQuestionsSnapshot(game.questionsSnapshot);
  return buildInitialPlayerSnapshot(baseSnapshot, settings, playerId);
}

export async function joinGame({
  gameId,
  userId,
  nickname,
}: {
  gameId: string;
  userId: string;
  nickname: string;
}) {
  const playerId = id();
  const playerSnapshot = await buildPlayerSnapshotForGame(gameId, playerId);

  await db.transact(
    db.tx.players[playerId]
      .update({
        nickname: nickname.trim(),
        joinedAt: Date.now(),
        questionsSnapshot: playerSnapshot,
        currentQuestionIndex: 0,
        streak: 0,
        repetition: 0,
      })
      .link({ game: gameId, user: userId }),
  );
  return playerId;
}

export async function leaveGame(playerId: string) {
  await db.transact(db.tx.players[playerId].delete());
}

export async function cancelGame(gameId: string, playerIds: string[]) {
  await db.transact([
    ...playerIds.map((playerId) => db.tx.players[playerId].delete()),
    db.tx.games[gameId].delete(),
  ]);
}

export async function updatePlayerAppearance(
  playerId: string,
  {
    iconId,
    avatarColor,
  }: {
    iconId?: string | null;
    avatarColor?: string | null;
  },
) {
  const updates: { iconId?: string; avatarColor?: string } = {};
  if (iconId !== undefined && iconId !== null) updates.iconId = iconId;
  if (avatarColor !== undefined && avatarColor !== null) {
    updates.avatarColor = avatarColor;
  }
  if (Object.keys(updates).length === 0) return;
  await db.transact(db.tx.players[playerId].update(updates));
}

export async function resetGameForRematch({
  gameId,
  answerIds,
  gameType,
  questionsSnapshot,
  questionTimeSeconds,
  durationSeconds,
  metersPerCorrect,
  deckTitle,
  deckId,
  answerShuffleMode,
  questionShuffleMode,
  answerShuffleScope,
  questionShuffleScope,
  playerSnapshotUpdates,
  seaOcean,
  seaFromCity,
  seaToCity,
  seaRouteDistanceMeters,
  seaRouteKey,
}: {
  gameId: string;
  answerIds: string[];
  gameType?: string;
  questionsSnapshot?: unknown;
  questionTimeSeconds?: number;
  durationSeconds?: number;
  metersPerCorrect?: number;
  deckTitle?: string;
  deckId?: string;
  answerShuffleMode?: string;
  questionShuffleMode?: string;
  answerShuffleScope?: string;
  questionShuffleScope?: string;
  playerSnapshotUpdates?: {
    playerId: string;
    questionsSnapshot: QuestionSnapshot[] | null;
  }[];
  seaOcean?: string;
  seaFromCity?: string;
  seaToCity?: string;
  seaRouteDistanceMeters?: number;
  seaRouteKey?: string;
}) {
  const gameUpdates: Record<string, unknown> = {
    status: "lobby",
    startedAt: null,
    endsAt: null,
    endedAt: null,
  };

  if (gameType !== undefined) gameUpdates.gameType = gameType;
  if (questionsSnapshot !== undefined) {
    gameUpdates.questionsSnapshot = questionsSnapshot;
  }
  if (questionTimeSeconds !== undefined) {
    gameUpdates.questionTimeSeconds = questionTimeSeconds;
  }
  if (durationSeconds !== undefined) {
    gameUpdates.durationSeconds = durationSeconds;
  }
  if (metersPerCorrect !== undefined) {
    gameUpdates.metersPerCorrect = metersPerCorrect;
  }
  if (deckTitle !== undefined) gameUpdates.deckTitle = deckTitle;
  if (deckId !== undefined) gameUpdates.deckId = deckId;
  if (answerShuffleMode !== undefined) {
    gameUpdates.answerShuffleMode = answerShuffleMode;
  }
  if (questionShuffleMode !== undefined) {
    gameUpdates.questionShuffleMode = questionShuffleMode;
  }
  if (answerShuffleScope !== undefined) {
    gameUpdates.answerShuffleScope = answerShuffleScope;
  }
  if (questionShuffleScope !== undefined) {
    gameUpdates.questionShuffleScope = questionShuffleScope;
  }

  if (gameType === "seaSailors") {
    gameUpdates.seaOcean = seaOcean;
    gameUpdates.seaFromCity = seaFromCity;
    gameUpdates.seaToCity = seaToCity;
    gameUpdates.seaRouteDistanceMeters = seaRouteDistanceMeters;
    gameUpdates.seaRouteKey = seaRouteKey;
  }

  const playerTxes =
    playerSnapshotUpdates?.map(({ playerId, questionsSnapshot: snapshot }) =>
      db.tx.players[playerId].update({
        questionsSnapshot: snapshot,
        currentQuestionIndex: 0,
        streak: 0,
        repetition: 0,
        questionStartedAt: null,
      }),
    ) ?? [];

  await db.transact([
    ...answerIds.map((answerId) => db.tx.answers[answerId].delete()),
    ...playerTxes,
    db.tx.games[gameId].update(gameUpdates),
  ]);
}
