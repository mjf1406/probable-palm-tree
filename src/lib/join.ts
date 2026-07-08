import { db } from "@/lib/db";
import { CODE_LENGTH } from "@/lib/game";

export type JoinableGame = {
  id: string;
  code: string;
};
export async function lookupJoinableGame(code: string): Promise<{
  game: JoinableGame | null;
  error: string | null;
}> {
  const upperCode = code.toUpperCase();
  if (upperCode.length !== CODE_LENGTH) {
    return { game: null, error: null };
  }

  try {
    const { data } = await db.queryOnce({
      games: {
        $: { where: { code: upperCode } },
      },
    });

    const game = data.games[0];
    if (!game) {
      return { game: null, error: "No game found with that code." };
    }

    if (game.status === "ended") {
      return { game: null, error: "This game has already ended." };
    }

    return { game: { id: game.id, code: upperCode }, error: null };
  } catch {
    return {
      game: null,
      error: "Could not verify that code. Please try again.",
    };
  }
}

export async function playerExists(playerId: string): Promise<boolean> {
  try {
    const { data } = await db.queryOnce({
      players: {
        $: { where: { id: playerId } },
      },
    });
    return data.players.length > 0;
  } catch {
    return false;
  }
}
