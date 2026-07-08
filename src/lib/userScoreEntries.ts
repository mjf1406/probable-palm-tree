import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import type { GameRecord } from "@/lib/types";

const MAX_DISPLAY_NAME_LENGTH = 40;

export function normalizeDisplayName(name: string): string {
  return name.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
}

export function validateDisplayName(name: string): string | null {
  const normalized = normalizeDisplayName(name);
  if (!normalized) {
    return "Enter a name for this score.";
  }
  return null;
}

export async function findUserScoreEntry(
  gameId: string,
  endedAt: number,
  userId: string,
) {
  const { data } = await db.queryOnce({
    userScoreEntries: {
      $: {
        where: {
          gameId,
          endedAt,
          "owner.id": userId,
        },
      },
    },
  });

  return data.userScoreEntries?.[0] ?? null;
}

export async function saveUserScoreEntry({
  displayName,
  game,
  totalDistance,
  userId,
}: {
  displayName: string;
  game: GameRecord;
  totalDistance: number;
  userId: string;
}) {
  const validationError = validateDisplayName(displayName);
  if (validationError) {
    throw new Error(validationError);
  }

  const endedAt = game.endedAt;
  if (!endedAt) {
    throw new Error("This game has not finished yet.");
  }

  const existing = await findUserScoreEntry(game.id, endedAt, userId);
  if (existing) {
    return existing;
  }

  const normalizedName = normalizeDisplayName(displayName);
  const achievedAt = Date.now();
  const entryId = id();

  await db.transact(
    db.tx.userScoreEntries[entryId]
      .update({
        displayName: normalizedName,
        distanceMeters: totalDistance,
        gameType: game.gameType,
        deckId: game.deckId ?? undefined,
        deckTitle: game.deckTitle ?? undefined,
        gameCode: game.code,
        gameId: game.id,
        endedAt,
        achievedAt,
        ...(game.gameType === "seaSailors" && game.seaRouteKey
          ? { seaRouteKey: game.seaRouteKey }
          : {}),
        ...(game.seaRouteDistanceMeters != null
          ? { seaRouteDistanceMeters: game.seaRouteDistanceMeters }
          : {}),
      })
      .link({ owner: userId }),
  );

  return {
    id: entryId,
    displayName: normalizedName,
    distanceMeters: totalDistance,
    gameType: game.gameType,
    deckId: game.deckId ?? null,
    deckTitle: game.deckTitle ?? null,
    seaRouteKey: game.seaRouteKey ?? null,
    seaRouteDistanceMeters: game.seaRouteDistanceMeters ?? null,
    gameCode: game.code,
    gameId: game.id,
    endedAt,
    achievedAt,
    owner: { id: userId },
  };
}

export async function deleteUserScoreEntry(entryId: string) {
  await db.transact(db.tx.userScoreEntries[entryId].delete());
}
