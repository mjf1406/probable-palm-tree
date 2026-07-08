import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Drill, Plane, Ship } from "lucide-react";
import { DifficultyBadge } from "@/components/game/DifficultyBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { db } from "@/lib/db";
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_QUESTION_TIME,
  DURATION_PRESETS,
  DURATION_STEP_MINUTES,
  GAME_TYPES,
  MAX_DURATION_MINUTES,
  MAX_QUESTION_TIME,
  MIN_DURATION_MINUTES,
  MIN_QUESTION_TIME,
  QUESTION_TIME_CTRL_SHIFT_STEP,
  QUESTION_TIME_CTRL_STEP,
  QUESTION_TIME_SHIFT_STEP,
  QUESTION_TIME_STEP,
  buildGameQuestionsSnapshot,
  durationMinutesToSeconds,
  generateJoinCode,
  parseDurationMinutes,
  parseQuestionTimeSeconds,
  parseSettingScope,
  parseShuffleMode,
  type GameType,
  type SettingScope,
  type ShuffleMode,
} from "@/lib/game";
import { ShuffleSettingField } from "@/components/host/ShuffleSettingField";
import { launchGame } from "@/lib/useHostGameEngine";
import { cn } from "@/lib/utils";

type LaunchStep = "gameType" | "settings";

const GAME_ICONS = {
  deepDivers: Ship,
  deepDrillers: Drill,
  highFlyers: Plane,
} as const;

export function LaunchDeckPage() {
  const { deckId } = useParams({ from: "/_host/l/$deckId" });
  const navigate = useNavigate();
  const { user } = db.useAuth();
  const [step, setStep] = useState<LaunchStep>("gameType");
  const [gameType, setGameType] = useState<GameType | null>(null);
  const [answerShuffleMode, setAnswerShuffleMode] = useState<ShuffleMode>(
    "eachRepetition",
  );
  const [questionShuffleMode, setQuestionShuffleMode] = useState<ShuffleMode>(
    "eachRepetition",
  );
  const [answerShuffleScope, setAnswerShuffleScope] =
    useState<SettingScope>("everyone");
  const [questionShuffleScope, setQuestionShuffleScope] =
    useState<SettingScope>("everyone");
  const [questionTime, setQuestionTime] = useState(
    String(DEFAULT_QUESTION_TIME),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(DEFAULT_DURATION_MINUTES),
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

  useEffect(() => {
    if (!deck) return;
    setAnswerShuffleMode(parseShuffleMode(deck.answerShuffleMode));
    setQuestionShuffleMode(parseShuffleMode(deck.questionShuffleMode));
    setAnswerShuffleScope(parseSettingScope(deck.answerShuffleScope));
    setQuestionShuffleScope(parseSettingScope(deck.questionShuffleScope));
    setQuestionTime(String(parseQuestionTimeSeconds(deck.questionTimeSeconds)));
  }, [deck]);

  const handleLaunch = async () => {
    if (!user || !deck || !gameType || questions.length === 0) return;

    setIsSubmitting(true);
    try {
      const shuffleSettings = {
        answerShuffleMode,
        questionShuffleMode,
        answerShuffleScope,
        questionShuffleScope,
      };
      const snapshot = buildGameQuestionsSnapshot(
        questions as {
          text: string;
          options: unknown;
          correctIndex: number;
          order: number;
          questionType?: unknown;
        }[],
        shuffleSettings,
      );
      const code = generateJoinCode();
      await launchGame({
        hostId: user.id,
        code,
        gameType,
        questionsSnapshot: snapshot,
        questionTimeSeconds: parseQuestionTimeSeconds(questionTime),
        durationSeconds: durationMinutesToSeconds(durationMinutes),
        deckTitle: deck.title,
        deckId: deck.id,
        ...shuffleSettings,
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

      {step === "gameType" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Choose a game</CardTitle>
            <CardDescription>
              Pick a distance challenge. Correct answers push the squad forward —
              streaks multiply your push.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {GAME_TYPES.map((type) => {
                const selected = gameType === type.id;
                const Icon = GAME_ICONS[type.id];
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
                      <Icon className="size-5 text-primary" />
                      <span className="font-semibold">{type.name}</span>
                      <DifficultyBadge difficulty={type.difficulty} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <Button
              size="lg"
              disabled={!gameType}
              onClick={() => setStep("settings")}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game settings</CardTitle>
            <CardDescription>
              These apply only to this game and won&apos;t change your saved deck
              defaults.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ShuffleSettingField
              label="Answer option order"
              mode={answerShuffleMode}
              scope={answerShuffleScope}
              onModeChange={setAnswerShuffleMode}
              onScopeChange={setAnswerShuffleScope}
            />

            <ShuffleSettingField
              label="Question order"
              mode={questionShuffleMode}
              scope={questionShuffleScope}
              onModeChange={setQuestionShuffleMode}
              onScopeChange={setQuestionShuffleScope}
            />

            <div className="space-y-2">
              <Label htmlFor="question-time">Seconds per question</Label>
              <NumberInput
                id="question-time"
                value={questionTime}
                onChange={setQuestionTime}
                min={MIN_QUESTION_TIME}
                max={MAX_QUESTION_TIME}
                step={QUESTION_TIME_STEP}
                ctrlStep={QUESTION_TIME_CTRL_STEP}
                shiftStep={QUESTION_TIME_SHIFT_STEP}
                ctrlShiftStep={QUESTION_TIME_CTRL_SHIFT_STEP}
                inputClassName="max-w-40"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="game-duration">Game duration (minutes)</Label>
              <NumberInput
                id="game-duration"
                value={durationMinutes}
                onChange={setDurationMinutes}
                min={MIN_DURATION_MINUTES}
                max={MAX_DURATION_MINUTES}
                step={DURATION_STEP_MINUTES}
                inputClassName="max-w-40"
              />
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.minutes}
                    type="button"
                    size="sm"
                    variant={
                      parseDurationMinutes(durationMinutes) === preset.minutes
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setDurationMinutes(String(preset.minutes))
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setStep("gameType")}>
                Back
              </Button>
              <Button
                size="lg"
                disabled={!canLaunch || isSubmitting}
                onClick={() => void handleLaunch()}
              >
                {isSubmitting ? "Launching..." : "Launch game"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
