import { db } from "@/lib/db";

/** Subscribe to room peers without publishing presence (host publishes via GameHostPresence). */
export function useGameRoomPeers(gameId: string) {
  const room = db.room("game", gameId);
  const { peers } = db.rooms.usePresence(room, {
    user: false,
  });

  return peers;
}
