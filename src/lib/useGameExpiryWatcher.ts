import { useCallback, useEffect, useRef } from "react";
import { getGameDeadline, isGameExpired } from "@/lib/game";
import { endGame } from "@/lib/useHostGameEngine";
import type { AnswerRecord, GameRecord } from "@/lib/types";

const END_RETRY_MS = 100;

async function attemptEndGame(
  game: GameRecord,
  answers: AnswerRecord[],
  isEndingRef: { current: boolean },
  retryCount = 0,
) {
  if (isEndingRef.current) return;
  if (
    !isGameExpired(
      game.startedAt,
      game.durationSeconds,
      Date.now(),
      game.endsAt,
    )
  ) {
    return;
  }

  isEndingRef.current = true;
  try {
    await endGame(game.id, game, answers);
  } catch {
    isEndingRef.current = false;
    if (retryCount < 10) {
      window.setTimeout(() => {
        void attemptEndGame(game, answers, isEndingRef, retryCount + 1);
      }, END_RETRY_MS);
    }
    return;
  }
  isEndingRef.current = false;
}

export function tryEndExpiredGame(
  game: GameRecord | null,
  answers: AnswerRecord[],
  isEndingRef: { current: boolean },
  now = Date.now(),
) {
  if (!game || game.status !== "playing" || !game.startedAt) return;

  const deadline = getGameDeadline(
    game.startedAt,
    game.durationSeconds,
    game.endsAt,
  );
  if (deadline == null || now < deadline) return;

  void attemptEndGame(game, answers, isEndingRef);
}

export function useGameExpiryWatcher(
  game: GameRecord | null,
  answers: AnswerRecord[],
  enabled: boolean,
) {
  const isEndingRef = useRef(false);
  const gameRef = useRef(game);
  const answersRef = useRef(answers);

  gameRef.current = game;
  answersRef.current = answers;

  const tryEndIfExpired = useCallback(
    (now = Date.now()) => {
      if (!enabled) return;
      tryEndExpiredGame(gameRef.current, answersRef.current, isEndingRef, now);
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled || !game || game.status !== "playing" || !game.startedAt) {
      return;
    }

    const deadline = getGameDeadline(
      game.startedAt,
      game.durationSeconds,
      game.endsAt,
    );
    if (deadline == null) return;

    const msUntilEnd = deadline - Date.now();
    if (msUntilEnd <= 0) {
      tryEndIfExpired();
      return;
    }

    const timeout = window.setTimeout(() => {
      tryEndIfExpired(deadline);
    }, msUntilEnd);

    return () => window.clearTimeout(timeout);
  }, [
    enabled,
    game?.durationSeconds,
    game?.endsAt,
    game?.id,
    game?.startedAt,
    game?.status,
    tryEndIfExpired,
  ]);

  return tryEndIfExpired;
}
