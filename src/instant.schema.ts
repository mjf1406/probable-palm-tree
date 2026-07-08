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
    }),
    questions: i.entity({
      text: i.string(),
      options: i.json(),
      correctIndex: i.number(),
      order: i.number().indexed(),
    }),
    games: i.entity({
      code: i.string().unique().indexed(),
      gameType: i.string().indexed(),
      status: i.string().indexed(),
      currentQuestionIndex: i.number(),
      questionStartedAt: i.number().optional(),
      progress: i.number(),
      lives: i.number(),
      questionTimeSeconds: i.number(),
      questionsSnapshot: i.json(),
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
    }),
    answers: i.entity({
      questionIndex: i.number().indexed(),
      choiceIndex: i.number(),
      isCorrect: i.boolean(),
      answeredAt: i.number(),
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
