import { useState } from "react";
import {
  Drill,
  Plane,
  Rocket,
  Sailboat,
  Ship,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDistance, GAME_TYPES, type GameType } from "@/lib/game";
import { deleteUserScoreEntry } from "@/lib/userScoreEntries";
import type { UserScoreEntryRecord } from "@/lib/types";

const GAME_ICONS: Record<GameType, LucideIcon> = {
  deepDivers: Ship,
  deepDrillers: Drill,
  highFlyers: Plane,
  seaSailors: Sailboat,
  spaceTravelers: Rocket,
};

function formatSavedDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function getGameTypeName(gameType: GameType) {
  return GAME_TYPES.find((type) => type.id === gameType)?.name ?? gameType;
}

function getRouteProgress(entry: UserScoreEntryRecord) {
  if (
    entry.gameType !== "seaSailors" ||
    !entry.seaRouteDistanceMeters ||
    entry.seaRouteDistanceMeters <= 0
  ) {
    return null;
  }

  return Math.min(
    100,
    Math.round((entry.distanceMeters / entry.seaRouteDistanceMeters) * 100),
  );
}

function ScoreEntryCard({
  entry,
  onDelete,
}: {
  entry: UserScoreEntryRecord;
  onDelete: (entryId: string) => Promise<void>;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const Icon = GAME_ICONS[entry.gameType];
  const routeProgress = getRouteProgress(entry);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await onDelete(entry.id);
      toast.success("Score removed");
      setDeleteOpen(false);
    } catch {
      toast.error("Could not remove this score.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <Icon className="size-5 text-primary" />
              {entry.displayName}
            </CardTitle>
            <CardDescription>
              {getGameTypeName(entry.gameType)}
              {entry.deckTitle ? ` · ${entry.deckTitle}` : null}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Delete ${entry.displayName}`}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Squad distance</span>
            <span className="font-mono font-semibold tabular-nums">
              {formatDistance(entry.distanceMeters)}
            </span>
          </div>
          {routeProgress !== null ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Route progress</span>
              <span className="font-semibold">{routeProgress}%</span>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Saved</span>
            <span>{formatSavedDate(entry.achievedAt)}</span>
          </div>
          {entry.gameCode ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-muted-foreground">Game code</span>
              <span className="font-mono uppercase">{entry.gameCode}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this score?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &quot;{entry.displayName}&quot; from My high scores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function HighScoresPage() {
  const { user } = db.useAuth();
  const { data, isLoading, error } = db.useQuery(
    user
      ? {
          userScoreEntries: {
            $: {
              where: { "owner.id": user.id },
              order: { achievedAt: "desc" },
            },
          },
        }
      : null,
  );

  const entries = (data?.userScoreEntries ?? []) as UserScoreEntryRecord[];

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My high scores</h1>
        <p className="max-w-2xl text-muted-foreground">
          Named runs you saved after hosting a game. Every distance counts, even
          when the squad does not beat the deck record.
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading your scores...</p>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load scores</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No saved scores yet</CardTitle>
            <CardDescription>
              When you host a game and time runs out, name the run on the
              results screen to keep it here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <ScoreEntryCard
              key={entry.id}
              entry={entry}
              onDelete={deleteUserScoreEntry}
            />
          ))}
        </div>
      )}
    </main>
  );
}
