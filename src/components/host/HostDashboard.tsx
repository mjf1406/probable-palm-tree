import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { id } from "@instantdb/react";
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { DEFAULT_QUESTION_TIME, DEFAULT_SHUFFLE_MODE, DEFAULT_SETTING_SCOPE } from "@/lib/game";
import type { GameRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const RECENT_GAME_MS = 24 * 60 * 60 * 1000;

type DeckWithQuestions = {
  id: string;
  title: string;
  description?: string | null;
  isBuiltIn: boolean;
  owner?: { id: string } | null;
  questions: {
    id: string;
    text: string;
    options: unknown;
    correctIndex: number;
    order: number;
  }[];
};

function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function statusLabel(status: GameRecord["status"]) {
  switch (status) {
    case "lobby":
      return "Lobby";
    case "playing":
      return "Playing";
    case "ended":
      return "Ended";
    default:
      return status;
  }
}

function DeckCard({ deck }: { deck: DeckWithQuestions }) {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canLaunch = deck.questions.length > 0;

  const handleLaunch = () => {
    void navigate({ to: "/l/$deckId", params: { deckId: deck.id } });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await db.transact([
        ...deck.questions.map((question) => db.tx.questions[question.id].delete()),
        db.tx.decks[deck.id].delete(),
      ]);
      toast.success("Deck deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Could not delete deck. Try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        className={cn(
          "cursor-pointer transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !canLaunch && "opacity-80",
        )}
        onClick={handleLaunch}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleLaunch();
          }
        }}
      >
        <CardHeader>
          <CardTitle className="text-lg">{deck.title}</CardTitle>
          {deck.isBuiltIn ? (
            <Badge variant="secondary" className="col-start-1 row-start-2 w-fit">
              Built-in
            </Badge>
          ) : (
            <CardAction>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground"
                    aria-label={`Actions for ${deck.title}`}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onClick={(event) => event.stopPropagation()}
                >
                  <DropdownMenuItem
                    onSelect={() =>
                      void navigate({
                        to: "/d/$deckId",
                        params: { deckId: deck.id },
                      })
                    }
                  >
                    <Pencil />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteOpen(true)}
                  >
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardAction>
          )}
          {deck.description ? (
            <CardDescription className="col-span-2">
              {deck.description}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {deck.questions.length} question
            {deck.questions.length === 1 ? "" : "s"}
            {!canLaunch ? " · Add questions to launch" : null}
          </p>
        </CardContent>
      </Card>

      {!deck.isBuiltIn ? (
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent
            onClick={(event) => event.stopPropagation()}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this deck?</AlertDialogTitle>
              <AlertDialogDescription>
                &ldquo;{deck.title}&rdquo; and all {deck.questions.length}{" "}
                question{deck.questions.length === 1 ? "" : "s"} will be
                permanently removed. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                {isDeleting ? "Deleting..." : "Delete deck"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}

function ActiveGameCard({
  game,
}: {
  game: GameRecord & { players?: { id: string }[] };
}) {
  const isActive = game.status === "lobby" || game.status === "playing";
  const playerCount = game.players?.length ?? 0;

  return (
    <Card className={isActive ? "border-primary/40" : "opacity-80"}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="font-mono text-lg tracking-wider">
            {game.code}
          </CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>
            {statusLabel(game.status)}
          </Badge>
        </div>
        <CardDescription>
          {game.deckTitle ?? "Untitled deck"} · {playerCount} player
          {playerCount === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-xs text-muted-foreground">
          {game.endedAt
            ? `Ended ${formatRelativeTime(game.endedAt)}`
            : `Started ${formatRelativeTime(game.createdAt)}`}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild size="sm" className="w-full">
          <Link to="/g/$code" params={{ code: game.code }}>
            <ExternalLink className="size-4" />
            Open
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function HostDashboard() {
  const navigate = useNavigate();
  const { user } = db.useAuth();
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const { data, isLoading: decksLoading } = db.useQuery(
    user
      ? {
          decks: {
            questions: {},
            owner: {},
          },
          $users: {
            $: { where: { id: user.id } },
            hostedGames: {
              $: { order: { createdAt: "desc" } },
              players: {},
            },
          },
        }
      : null,
  );

  const allDecks = (data?.decks ?? []) as DeckWithQuestions[];
  const myDecks = allDecks.filter(
    (deck) => !deck.isBuiltIn && deck.owner?.id === user?.id,
  );
  const builtInDecks = allDecks.filter((deck) => deck.isBuiltIn);

  const activeGames = useMemo(() => {
    const games = (data?.$users?.[0]?.hostedGames ?? []) as (GameRecord & {
      players?: { id: string }[];
    })[];
    const cutoff = Date.now() - RECENT_GAME_MS;
    return games.filter(
      (game) =>
        game.status === "lobby" ||
        game.status === "playing" ||
        (game.endedAt != null && game.endedAt >= cutoff),
    );
  }, [data?.$users]);

  const handleCreateDeck = async () => {
    if (!user || !newTitle.trim()) return;
    setIsCreating(true);
    try {
      const deckId = id();
      await db.transact(
        db.tx.decks[deckId]
          .update({
            title: newTitle.trim(),
            description: "",
            isBuiltIn: false,
            createdAt: Date.now(),
            answerShuffleMode: DEFAULT_SHUFFLE_MODE,
            questionShuffleMode: DEFAULT_SHUFFLE_MODE,
            answerShuffleScope: DEFAULT_SETTING_SCOPE,
            questionShuffleScope: DEFAULT_SETTING_SCOPE,
            questionTimeSeconds: DEFAULT_QUESTION_TIME,
          })
          .link({ owner: user.id }),
      );
      setNewTitle("");
      await navigate({ to: "/d/$deckId", params: { deckId } });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My decks</h1>
        <p className="text-muted-foreground">
          Build quiz decks or pick a built-in set, then launch a game.
        </p>
      </div>

      {activeGames.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Active games</h2>
            <p className="text-sm text-muted-foreground">
              In-progress sessions and games from the last 24 hours.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeGames.map((game) => (
              <ActiveGameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create a deck</CardTitle>
          <CardDescription>
            Build your own question set for any game type.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1 space-y-2">
            <Label htmlFor="deck-title">Deck title</Label>
            <Input
              id="deck-title"
              placeholder="My trivia deck"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
            />
          </div>
          <Button
            className="sm:self-end"
            onClick={() => void handleCreateDeck()}
            disabled={isCreating || !newTitle.trim()}
          >
            <Plus className="size-4" />
            Create deck
          </Button>
        </CardContent>
      </Card>

      {decksLoading ? (
        <p className="text-muted-foreground">Loading decks...</p>
      ) : (
        <Tabs defaultValue="mine">
          <TabsList>
            <TabsTrigger value="mine">My decks ({myDecks.length})</TabsTrigger>
            <TabsTrigger value="builtin">
              Built-in ({builtInDecks.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="mine" className="mt-4">
            {myDecks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No decks yet. Create one above to get started.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {myDecks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="builtin" className="mt-4">
            {builtInDecks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Built-in decks will appear here after seeding.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {builtInDecks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}
