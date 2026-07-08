// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const rules = {
  $users: {
    allow: {
      create: "true",
      view: "auth.id == data.id",
      update: "auth.id == data.id",
    },
  },
  decks: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
  questions: {
    allow: {
      view: "true",
      create: "auth.id in data.ref('deck.owner.id')",
      update: "auth.id in data.ref('deck.owner.id')",
      delete: "auth.id in data.ref('deck.owner.id')",
    },
  },
  games: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "isHost || isTimerExpiredEnd",
      delete: "auth.id in data.ref('host.id')",
    },
    bind: {
      isHost: "auth.id in data.ref('host.id')",
      isTimerExpiredEnd:
        "data.status == 'playing' && data.endsAt != null && " +
        "request.time >= timestamp(data.endsAt) && " +
        "(auth.id in data.ref('host.id') || auth.id in data.ref('players.user.id')) && " +
        "newData.status == 'ended' && " +
        "request.modifiedFields.all(field, field in ['status', 'endedAt'])",
    },
  },
  players: {
    allow: {
      view: "true",
      create: "auth.id in data.ref('user.id')",
      update:
        "auth.id in data.ref('user.id') || auth.id in data.ref('game.host.id')",
      delete:
        "auth.id in data.ref('user.id') || auth.id in data.ref('game.host.id')",
    },
  },
  answers: {
    allow: {
      view: "true",
      create: "auth.id in data.ref('player.user.id')",
      update: "false",
      delete: "auth.id in data.ref('game.host.id')",
    },
  },
  highScores: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  userScoreEntries: {
    allow: {
      view: "auth.id in data.ref('owner.id')",
      create: "auth.id != null",
      update: "auth.id in data.ref('owner.id')",
      delete: "auth.id in data.ref('owner.id')",
    },
  },
} satisfies InstantRules;

export default rules;
