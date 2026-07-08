import { useEffect, useRef } from "react";
import { id } from "@instantdb/react";
import { db } from "@/lib/db";
import {
  buildLoopSnapshot,
  getDeckShuffleConfig,
  getDistanceGainForCorrect,
  isQuestionExpired,
  parseMetersPerCorrect,
  parseQuestionsSnapshot,
} from "@/lib/game";
import type {
  AnswerRecord,
  GameRecord,
  PlayerRecord,
  QuestionSnapshot,
} from "@/lib/types";

function getPlayerSnapshot(
  player: PlayerRecord,
  game: GameRecord,
): QuestionSnapshot[] {
  return player.questionsSnapshot ?? game.questionsSnapshot;
}

function hasAnsweredQuestion(
  answers: AnswerRecord[],
  playerId: string,
  questionIndex: number,
  repetition: number,
): boolean {
  const answerKey = repetition * 10_000 + questionIndex;
  return answers.some(
    (answer) =>
      answer.player?.id === playerId &&
      answer.questionIndex === answerKey,
  );
}

export function getAnswerQuestionIndex(
  questionIndex: number,
  repetition: number,
): number {
  return repetition * 10_000 + questionIndex;
}

export function decodeAnswerQuestionIndex(answerQuestionIndex: number): {
  repetition: number;
  questionIndex: number;
} {
  return {
    repetition: Math.floor(answerQuestionIndex / 10_000),
    questionIndex: answerQuestionIndex % 10_000,
  };
}

async function advancePlayerAfterAnswer({
  game,
  player,
  isCorrect,
  choiceIndex,
}: {
  game: GameRecord;
  player: PlayerRecord;
  isCorrect: boolean;
  choiceIndex: number;
}) {
  const settings = getDeckShuffleConfig(game);
  const snapshot = getPlayerSnapshot(player, game);
  const answerQuestionIndex = getAnswerQuestionIndex(
    player.currentQuestionIndex,
    player.repetition,
  );
  const nextStreak = isCorrect ? player.streak + 1 : 0;
  const distanceGained = isCorrect
    ? getDistanceGainForCorrect(
        nextStreak,
        parseMetersPerCorrect(game.metersPerCorrect),
      )
    : 0;
  const answerId = id();
  const now = Date.now();

  let nextIndex = player.currentQuestionIndex + 1;
  let nextRepetition = player.repetition;
  let nextSnapshot = player.questionsSnapshot;

  if (nextIndex >= snapshot.length) {
    nextIndex = 0;
    nextRepetition = player.repetition + 1;

    const shouldReshuffle =
      settings.questionShuffleMode === "eachRepetition" ||
      settings.answerShuffleMode === "eachRepetition";

    if (shouldReshuffle) {
      const baseSnapshot = parseQuestionsSnapshot(game.questionsSnapshot);
      nextSnapshot = buildLoopSnapshot(baseSnapshot, settings, {
        playerId: player.id,
        gameId: game.id,
        repetition: nextRepetition,
      });
    } else {
      nextSnapshot = snapshot;
    }
  }

  const playerUpdates: Record<string, unknown> = {
    currentQuestionIndex: nextIndex,
    streak: nextStreak,
    repetition: nextRepetition,
    questionStartedAt: now,
  };

  if (nextSnapshot) {
    playerUpdates.questionsSnapshot = nextSnapshot;
  }

  await db.transact([
    db.tx.answers[answerId]
      .update({
        questionIndex: answerQuestionIndex,
        choiceIndex,
        isCorrect,
        answeredAt: now,
        distanceGained,
      })
      .link({ game: game.id, player: player.id }),
    db.tx.players[player.id].update(playerUpdates),
  ]);
}

export async function submitPlayerAnswer({
  game,
  player,
  choiceIndex,
  correctIndex,
}: {
  game: GameRecord;
  player: PlayerRecord;
  choiceIndex: number;
  correctIndex: number;
}) {
  const isCorrect = choiceIndex === correctIndex;
  await advancePlayerAfterAnswer({
    game,
    player,
    isCorrect,
    choiceIndex,
  });
}

export async function submitPlayerTimeout({
  game,
  player,
}: {
  game: GameRecord;
  player: PlayerRecord;
}) {
  await advancePlayerAfterAnswer({
    game,
    player,
    isCorrect: false,
    choiceIndex: -1,
  });
}

export function usePlayerGameEngine(
  game: GameRecord | null,
  player: PlayerRecord | null,
  answers: AnswerRecord[],
) {
  const isHandlingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (!game || !player || game.status !== "playing") {
      hasInitializedRef.current = false;
      return;
    }

    if (player.questionStartedAt != null || hasInitializedRef.current) return;

    hasInitializedRef.current = true;
    void db.transact(
      db.tx.players[player.id].update({
        currentQuestionIndex: 0,
        streak: 0,
        repetition: 0,
        questionStartedAt: Date.now(),
      }),
    );
  }, [game, player]);

  useEffect(() => {
    if (!game || !player || game.status !== "playing") return;

    const interval = window.setInterval(() => {
      if (isHandlingRef.current) return;
      if (!player.questionStartedAt) return;

      const answered = hasAnsweredQuestion(
        answers,
        player.id,
        player.currentQuestionIndex,
        player.repetition,
      );
      if (answered) return;

      if (
        !isQuestionExpired(
          player.questionStartedAt,
          game.questionTimeSeconds,
        )
      ) {
        return;
      }

      isHandlingRef.current = true;
      void submitPlayerTimeout({ game, player }).finally(() => {
        isHandlingRef.current = false;
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, [answers, game, player]);
}
