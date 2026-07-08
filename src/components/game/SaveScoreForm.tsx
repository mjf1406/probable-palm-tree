import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/db";
import { formatDistance } from "@/lib/game";
import { saveUserScoreEntry } from "@/lib/userScoreEntries";
import type { GameRecord } from "@/lib/types";

type SaveScoreFormProps = {
  game: GameRecord;
  totalDistance: number;
  userId: string;
};

export function SaveScoreForm({ game, totalDistance, userId }: SaveScoreFormProps) {
  const [displayName, setDisplayName] = useState(
    game.deckTitle?.trim() || "Squad run",
  );
  const [isSaving, setIsSaving] = useState(false);

  const { data, isLoading } = db.useQuery(
    game.endedAt
      ? {
          userScoreEntries: {
            $: {
              where: {
                gameId: game.id,
                endedAt: game.endedAt,
                "owner.id": userId,
              },
            },
          },
        }
      : null,
  );

  const savedEntry = data?.userScoreEntries?.[0] ?? null;

  async function handleSave() {
    if (isSaving || savedEntry) return;

    setIsSaving(true);
    try {
      await saveUserScoreEntry({
        displayName,
        game,
        totalDistance,
        userId,
      });
      toast.success("Saved to My high scores");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save this score.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border p-4 text-left">
        <p className="text-sm text-muted-foreground">Loading save options...</p>
      </div>
    );
  }

  if (savedEntry) {
    return (
      <div className="rounded-xl border p-4 text-left">
        <p className="text-sm font-medium">Saved to My high scores</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved as <span className="font-medium text-foreground">{savedEntry.displayName}</span>{" "}
          ({formatDistance(savedEntry.distanceMeters)})
        </p>
        <Button asChild variant="link" className="mt-2 h-auto px-0">
          <Link to="/high-scores">View My high scores</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-4 text-left">
      <p className="text-sm font-medium">Save to My high scores</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Name this run and keep {formatDistance(totalDistance)} in your personal
        score history.
      </p>
      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Score name"
          maxLength={40}
          disabled={isSaving}
          aria-label="Score name"
        />
        <Button
          type="submit"
          disabled={isSaving || !displayName.trim()}
          className="sm:shrink-0"
        >
          {isSaving ? "Saving..." : "Save to My high scores"}
        </Button>
      </form>
    </div>
  );
}
