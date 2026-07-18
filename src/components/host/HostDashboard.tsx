import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { id } from "@instantdb/react";
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  Credenza,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
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
import {
  DEFAULT_QUESTION_TIME,
  DEFAULT_SHUFFLE_MODE,
  DEFAULT_SETTING_SCOPE,
  getGameDeadline,
  parseDurationSeconds,
  parseQuestionType,
} from "@/lib/game";
import type { AnswerRecord, GameRecord } from "@/lib/types";
import { normalizeGame } from "@/lib/useGameSession";
import { endGame } from "@/lib/useHostGameEngine";
import { cn } from "@/lib/utils";
import { DeckExportMenuItems } from "@/components/host/DeckExportMenuItems";
import { ExportPreviewDialog } from "@/components/host/ExportPreviewDialog";
import { useDeckExport } from "@/components/host/useDeckExport";
import {
  createDeckFromImport,
  parseDeckFile,
  resolveImportedTitle,
  type DeckExportData,
} from "@/lib/deck-import-export";

const RECENT_GAME_MS = 24 * 60 * 60 * 1000;

type DeckWithQuestions = {
  id: string;
  title: string;
  description?: string | null;
  isBuiltIn: boolean;
  answerShuffleMode?: string | null;
  questionShuffleMode?: string | null;
  answerShuffleScope?: string | null;
  questionShuffleScope?: string | null;
  questionTimeSeconds?: number | null;
  owner?: { id: string } | null;
  questions: {
    id: string;
    text: string;
    options: unknown;
    correctIndex?: number;
    order: number;
    questionType?: unknown;
    answerConfig?: unknown;
  }[];
};

function toDeckExportData(deck: DeckWithQuestions): DeckExportData {
  return {
    title: deck.title,
    description: deck.description,
    answerShuffleMode: deck.answerShuffleMode,
    questionShuffleMode: deck.questionShuffleMode,
    answerShuffleScope: deck.answerShuffleScope,
    questionShuffleScope: deck.questionShuffleScope,
    questionTimeSeconds: deck.questionTimeSeconds,
    questions: [...deck.questions]
      .sort((a, b) => a.order - b.order)
      .map((question) => ({
        text: question.text,
        options: Array.isArray(question.options)
          ? question.options.map(String)
          : [],
        correctIndex: question.correctIndex,
        order: question.order,
        questionType: parseQuestionType(question.questionType),
        answerConfig:
          question.answerConfig && typeof question.answerConfig === "object"
            ? (question.answerConfig as DeckExportData["questions"][number]["answerConfig"])
            : null,
      })),
  };
}

function formatRelativeTime(timestamp: number, now: number) {
  const diffMs = now - timestamp;
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
  const exportDeck = toDeckExportData(deck);
  const {
    preview,
    previewOpen,
    pendingFormat,
    runExport,
    requestThirdPartyExport,
    confirmPendingExport,
    closePreview,
  } = useDeckExport(exportDeck);

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
                  <DeckExportMenuItems
                    onSquadGames={() => void runExport("squad-games")}
                    onKahoot={() => requestThirdPartyExport("kahoot")}
                    onBlooket={() => requestThirdPartyExport("blooket")}
                    onGimkit={() => requestThirdPartyExport("gimkit")}
                  />
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
        <>
          {pendingFormat ? (
            <ExportPreviewDialog
              open={previewOpen}
              onOpenChange={closePreview}
              format={pendingFormat}
              preview={preview}
              onConfirm={confirmPendingExport}
            />
          ) : null}
          <Credenza open={deleteOpen} onOpenChange={setDeleteOpen}>
          <CredenzaContent
            onClick={(event) => event.stopPropagation()}
          >
            <CredenzaHeader>
              <CredenzaTitle>Delete this deck?</CredenzaTitle>
              <CredenzaDescription>
                &ldquo;{deck.title}&rdquo; and all {deck.questions.length}{" "}
                question{deck.questions.length === 1 ? "" : "s"} will be
                permanently removed. This cannot be undone.
              </CredenzaDescription>
            </CredenzaHeader>
            <CredenzaFooter>
              <CredenzaClose asChild>
                <Button variant="outline" disabled={isDeleting}>
                  Cancel
                </Button>
              </CredenzaClose>
              <Button
                variant="destructive"
                disabled={isDeleting}
                onClick={() => {
                  void handleDelete();
                }}
              >
                {isDeleting ? "Deleting..." : "Delete deck"}
              </Button>
            </CredenzaFooter>
          </CredenzaContent>
        </Credenza>
        </>
      ) : null}
    </>
  );
}

function ActiveGameCard({
  game,
  now,
}: {
  game: GameRecord & { players?: { id: string }[] };
  now: number;
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
            ? `Ended ${formatRelativeTime(game.endedAt, now)}`
            : `Started ${formatRelativeTime(game.createdAt, now)}`}
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
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

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
    const cutoff = now - RECENT_GAME_MS;
    return games.filter(
      (game) =>
        game.status === "lobby" ||
        game.status === "playing" ||
        (game.endedAt != null && game.endedAt >= cutoff),
    );
  }, [data?.$users, now]);

  const endingGameIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const playingGames = activeGames.filter((game) => game.status === "playing");
    if (playingGames.length === 0) return;

    const timeouts: number[] = [];

    const endExpiredGame = (rawGame: GameRecord) => {
      if (endingGameIdsRef.current.has(rawGame.id)) return;

      endingGameIdsRef.current.add(rawGame.id);
      void (async () => {
        try {
          const { data: gameData } = await db.queryOnce({
            games: {
              $: { where: { id: rawGame.id } },
              answers: { player: {} },
            },
          });
          const game = normalizeGame(
            gameData.games[0] as Record<string, unknown> | undefined,
          );
          if (!game || game.status !== "playing") return;

          const answers = (gameData.games[0]?.answers ?? []).map(
            (answer) =>
              ({
                id: answer.id as string,
                questionIndex: answer.questionIndex as number,
                choiceIndex: answer.choiceIndex as number,
                isCorrect: answer.isCorrect as boolean,
                answeredAt: answer.answeredAt as number,
                distanceGained: (answer.distanceGained as number) ?? 0,
                player:
                  (answer.player as
                    | { id: string; nickname: string }
                    | undefined) ?? null,
              }) satisfies AnswerRecord,
          );

          await endGame(game.id, game, answers);
        } catch {
          // Another client may have already ended the game.
        } finally {
          endingGameIdsRef.current.delete(rawGame.id);
        }
      })();
    };

    for (const rawGame of playingGames) {
      const durationSeconds = parseDurationSeconds(rawGame.durationSeconds);
      const deadline = getGameDeadline(
        rawGame.startedAt,
        durationSeconds,
        rawGame.endsAt,
      );
      if (deadline == null) continue;

      const msUntilEnd = deadline - Date.now();
      if (msUntilEnd <= 0) {
        endExpiredGame(rawGame);
        continue;
      }

      timeouts.push(
        window.setTimeout(() => {
          endExpiredGame(rawGame);
        }, msUntilEnd),
      );
    }

    return () => {
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, [activeGames]);

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

  const handleImportDeck = async (file: File) => {
    if (!user) return;
    setIsImporting(true);
    try {
      const { deck: imported } = await parseDeckFile(file);
      const title = resolveImportedTitle(imported, file.name, newTitle);
      const deckId = await createDeckFromImport(imported, user.id, title);
      setNewTitle("");
      toast.success(`Imported ${imported.questions.length} questions`);
      await navigate({ to: "/d/$deckId", params: { deckId } });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not import deck.",
      );
    } finally {
      setIsImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
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
              <ActiveGameCard key={game.id} game={game} now={now} />
            ))}
          </div>
        </section>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create a deck</CardTitle>
          <CardDescription>
            Build your own question set or import from ClassUpGames, Kahoot,
            Blooket, or Gimkit.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
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
              disabled={isCreating || isImporting || !newTitle.trim()}
            >
              <Plus className="size-4" />
              Create deck
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={importInputRef}
              type="file"
              accept=".json,.csv,.xlsx"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImportDeck(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isCreating || isImporting}
              onClick={() => importInputRef.current?.click()}
            >
              <Upload className="size-4" />
              {isImporting ? "Importing..." : "Import deck"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Accepts .json, .csv, and .xlsx
            </p>
          </div>
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
