import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { id } from "@instantdb/react";
import { ExternalLink, Plus, Rocket, Ship } from "lucide-react";
import { GameSetupDialog, toSnapshot } from "@/components/host/GameSetupDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { GAME_TYPES } from "@/lib/game";
import type { GameRecord } from "@/lib/types";

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
    case "won":
      return "Won";
    case "lost":
      return "Lost";
    default:
      return status;
  }
}

function DeckCard({
  deck,
  onLaunch,
}: {
  deck: DeckWithQuestions;
  onLaunch: (deck: DeckWithQuestions) => void;
}) {
  const snapshot = toSnapshot(deck.questions);
  const canLaunch = snapshot.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{deck.title}</CardTitle>
          {deck.isBuiltIn ? <Badge variant="secondary">Built-in</Badge> : null}
        </div>
        {deck.description ? (
          <CardDescription>{deck.description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {deck.questions.length} question
          {deck.questions.length === 1 ? "" : "s"}
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        {!deck.isBuiltIn ? (
          <Button asChild variant="outline" size="sm">
            <Link to="/d/$deckId" params={{ deckId: deck.id }}>
              Edit
            </Link>
          </Button>
        ) : null}
        <Button
          size="sm"
          disabled={!canLaunch}
          onClick={() => onLaunch(deck)}
        >
          Launch
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActiveGameCard({ game }: { game: GameRecord & { players?: { id: string }[] } }) {
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
  const [launchDeckId, setLaunchDeckId] = useState<string | null>(null);
  const [launchOpen, setLaunchOpen] = useState(false);
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

  const launchableDecks = useMemo(
    () =>
      [...myDecks, ...builtInDecks]
        .map((deck) => ({
          id: deck.id,
          title: deck.title,
          questions: toSnapshot(deck.questions),
        }))
        .filter((deck) => deck.questions.length > 0),
    [myDecks, builtInDecks],
  );

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
          })
          .link({ owner: user.id }),
      );
      setNewTitle("");
      await navigate({ to: "/d/$deckId", params: { deckId } });
    } finally {
      setIsCreating(false);
    }
  };

  const openLaunch = (deck: DeckWithQuestions) => {
    setLaunchDeckId(deck.id);
    setLaunchOpen(true);
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My decks</h1>
        <p className="text-muted-foreground">
          Build quiz decks or pick a built-in set, then launch a cooperative game.
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

      <div className="grid gap-4 sm:grid-cols-2">
        {GAME_TYPES.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {type.id === "submarine" ? (
                  <Ship className="size-5 text-primary" />
                ) : (
                  <Rocket className="size-5 text-primary" />
                )}
                {type.name}
              </CardTitle>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

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
                  <DeckCard key={deck.id} deck={deck} onLaunch={openLaunch} />
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
                  <DeckCard key={deck.id} deck={deck} onLaunch={openLaunch} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <GameSetupDialog
        open={launchOpen}
        onOpenChange={(open) => {
          setLaunchOpen(open);
          if (!open) setLaunchDeckId(null);
        }}
        mode="launch"
        decks={launchableDecks}
        initialDeckId={launchDeckId}
      />
    </main>
  );
}
