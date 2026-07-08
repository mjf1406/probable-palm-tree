import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Rocket, Ship } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";
import {
  DEFAULT_QUESTION_TIME,
  GAME_TYPES,
  buildQuestionsSnapshot,
  generateJoinCode,
  parseShuffleMode,
  type GameType,
} from "@/lib/game";
import { launchGame } from "@/lib/useHostGameEngine";
import { cn } from "@/lib/utils";

export function LaunchDeckPage() {
  const { deckId } = useParams({ from: "/_host/l/$deckId" });
  const navigate = useNavigate();
  const { user } = db.useAuth();
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [questionTime, setQuestionTime] = useState(
    String(DEFAULT_QUESTION_TIME),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoading, data, error } = db.useQuery({
    decks: {
      $: { where: { id: deckId } },
      questions: {},
    },
  });

  const deck = data?.decks?.[0];
  const questions = deck?.questions ?? [];
  const canLaunch = Boolean(deck && questions.length > 0 && gameType && user);

  const handleLaunch = async () => {
    if (!user || !deck || !gameType || questions.length === 0) return;

    setIsSubmitting(true);
    try {
      const answerShuffleMode = parseShuffleMode(deck.answerShuffleMode);
      const questionShuffleMode = parseShuffleMode(deck.questionShuffleMode);
      const snapshot = buildQuestionsSnapshot(
        questions as {
          text: string;
          options: unknown;
          correctIndex: number;
          order: number;
          questionType?: unknown;
        }[],
        { answerShuffleMode, questionShuffleMode },
      );
      const code = generateJoinCode();
      await launchGame({
        hostId: user.id,
        code,
        gameType,
        questionsSnapshot: snapshot,
        questionTimeSeconds: Number(questionTime) || DEFAULT_QUESTION_TIME,
        deckTitle: deck.title,
        deckId: deck.id,
      });
      await navigate({ to: "/g/$code", params: { code } });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-muted-foreground">Loading deck...</p>
      </main>
    );
  }

  if (error || !deck) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Deck not found</CardTitle>
            <CardDescription>
              This deck may have been deleted or you don&apos;t have access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/">Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>{deck.title}</CardTitle>
            <CardDescription>
              This deck has no questions yet. Add some before launching.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            {!deck.isBuiltIn ? (
              <Button asChild>
                <Link to="/d/$deckId" params={{ deckId: deck.id }}>
                  Edit deck
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link to="/">Back</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline">Launch</Badge>
          <h1 className="text-3xl font-semibold tracking-tight">{deck.title}</h1>
          {deck.description ? (
            <p className="text-muted-foreground">{deck.description}</p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/">Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Choose a game</CardTitle>
          <CardDescription>
            Pick a cooperative game type, then set the timer and launch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {GAME_TYPES.map((type) => {
              const selected = gameType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setGameType(type.id)}
                  className={cn(
                    "rounded-xl border p-5 text-left transition-colors",
                    "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border",
                  )}
                >
                  <div className="mb-3 flex items-center gap-2">
                    {type.id === "submarine" ? (
                      <Ship className="size-5 text-primary" />
                    ) : (
                      <Rocket className="size-5 text-primary" />
                    )}
                    <span className="font-semibold">{type.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label htmlFor="question-time">Seconds per question</Label>
            <Input
              id="question-time"
              type="number"
              min={10}
              max={60}
              value={questionTime}
              onChange={(event) => setQuestionTime(event.target.value)}
              className="max-w-40"
            />
          </div>

          <Button
            size="lg"
            disabled={!canLaunch || isSubmitting}
            onClick={() => void handleLaunch()}
          >
            {isSubmitting ? "Launching..." : "Launch game"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
