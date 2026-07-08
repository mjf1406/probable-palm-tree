// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    decks: i.entity({
      title: i.string(),
      description: i.string().optional(),
      isBuiltIn: i.boolean().indexed(),
      createdAt: i.number().indexed(),
      // "none" | "once" | "eachRepetition" — default handled in app as "eachRepetition"
      answerShuffleMode: i.string().optional(),
      questionShuffleMode: i.string().optional(),
      // "everyone" | "perPlayer" — default handled in app as "everyone"
      answerShuffleScope: i.string().optional(),
      questionShuffleScope: i.string().optional(),
      // default handled in app as DEFAULT_QUESTION_TIME (20)
      questionTimeSeconds: i.number().optional(),
    }),
    questions: i.entity({
      text: i.string(),
      options: i.json(),
      correctIndex: i.number(),
      order: i.number().indexed(),
      // "mc" | "tf" — default handled in app as "mc"
      questionType: i.string().optional(),
    }),
    games: i.entity({
      code: i.string().unique().indexed(),
      gameType: i.string().indexed(),
      status: i.string().indexed(),
      durationSeconds: i.number().optional(),
      startedAt: i.number().optional(),
      endsAt: i.number().indexed().optional(),
      questionTimeSeconds: i.number(),
      // default handled in app as DEFAULT_METERS_PER_CORRECT (10)
      metersPerCorrect: i.number().optional(),
      // Sea Sailors route selection (computed great-circle distance goal for % progress)
      seaOcean: i.string().indexed().optional(),
      seaFromCity: i.string().indexed().optional(),
      seaToCity: i.string().indexed().optional(),
      seaRouteDistanceMeters: i.number().optional(),
      seaRouteKey: i.string().indexed().optional(),
      questionsSnapshot: i.json(),
      answerShuffleMode: i.string().optional(),
      questionShuffleMode: i.string().optional(),
      answerShuffleScope: i.string().optional(),
      questionShuffleScope: i.string().optional(),
      createdAt: i.number().indexed(),
      deckTitle: i.string().optional(),
      deckId: i.string().optional(),
      endedAt: i.number().indexed().optional(),
    }),
    players: i.entity({
      nickname: i.string(),
      joinedAt: i.number().indexed(),
      iconId: i.string().optional(),
      avatarColor: i.string().optional(),
      questionsSnapshot: i.json().optional(),
      currentQuestionIndex: i.number().optional(),
      streak: i.number().optional(),
      repetition: i.number().optional(),
      questionStartedAt: i.number().optional(),
    }),
    answers: i.entity({
      questionIndex: i.number().indexed(),
      choiceIndex: i.number(),
      isCorrect: i.boolean(),
      answeredAt: i.number(),
      distanceGained: i.number().optional(),
    }),
    highScores: i.entity({
      gameType: i.string().indexed(),
      // Route identity for Sea Sailors (so highscores don’t collide across routes)
      seaRouteKey: i.string().indexed().optional(),
      distanceMeters: i.number(),
      achievedAt: i.number().indexed(),
    }),
    userScoreEntries: i.entity({
      displayName: i.string(),
      distanceMeters: i.number(),
      gameType: i.string().indexed(),
      deckId: i.string().optional(),
      deckTitle: i.string().optional(),
      seaRouteKey: i.string().indexed().optional(),
      seaRouteDistanceMeters: i.number().optional(),
      gameCode: i.string().optional(),
      gameId: i.string().indexed(),
      endedAt: i.number().indexed(),
      achievedAt: i.number().indexed(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    deckOwner: {
      forward: { on: "decks", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "decks" },
    },
    questionDeck: {
      forward: { on: "questions", has: "one", label: "deck" },
      reverse: { on: "decks", has: "many", label: "questions" },
    },
    gameHost: {
      forward: { on: "games", has: "one", label: "host" },
      reverse: { on: "$users", has: "many", label: "hostedGames" },
    },
    playerGame: {
      forward: { on: "players", has: "one", label: "game" },
      reverse: { on: "games", has: "many", label: "players" },
    },
    playerUser: {
      forward: { on: "players", has: "one", label: "user" },
      reverse: { on: "$users", has: "many", label: "playerSessions" },
    },
    answerGame: {
      forward: { on: "answers", has: "one", label: "game" },
      reverse: { on: "games", has: "many", label: "answers" },
    },
    answerPlayer: {
      forward: { on: "answers", has: "one", label: "player" },
      reverse: { on: "players", has: "many", label: "answers" },
    },
    highScoreDeck: {
      forward: { on: "highScores", has: "one", label: "deck" },
      reverse: { on: "decks", has: "many", label: "highScores" },
    },
    scoreEntryOwner: {
      forward: { on: "userScoreEntries", has: "one", label: "owner" },
      reverse: { on: "$users", has: "many", label: "scoreEntries" },
    },
  },
  rooms: {
    game: {
      presence: i.entity({
        nickname: i.string().optional(),
        playerId: i.string().optional(),
        isHost: i.boolean().optional(),
      }),
    },
  },
});

type _AppSchema = typeof _schema;
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
