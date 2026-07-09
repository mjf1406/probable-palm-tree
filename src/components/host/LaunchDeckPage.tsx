import { useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { Drill, Plane, Rocket, Sailboat, Ship, type LucideIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from "@/lib/db";
import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_METERS_PER_CORRECT,
  DURATION_PRESETS,
  DURATION_STEP_MINUTES,
  GAME_TYPES,
  GAME_LEVELS,
  MAX_DURATION_MINUTES,
  MAX_QUESTION_TIME,
  MIN_DURATION_MINUTES,
  MIN_METERS_PER_CORRECT,
  MIN_QUESTION_TIME,
  QUESTION_TIME_CTRL_SHIFT_STEP,
  QUESTION_TIME_CTRL_STEP,
  QUESTION_TIME_SHIFT_STEP,
  QUESTION_TIME_STEP,
  buildGameQuestionsSnapshot,
  formatGoalDistance,
  getGameDifficultyBadges,
  durationMinutesToSeconds,
  generateJoinCode,
  getMetersPerCorrectMax,
  parseDurationMinutes,
  parseMetersPerCorrect,
  parseQuestionTimeSeconds,
  parseSettingScope,
  parseShuffleMode,
  type GameType,
  type SettingScope,
  type ShuffleMode,
} from "@/lib/game";
import {
  clampSeaRoute,
  computeGreatCircleDistanceMeters,
  getDefaultSeaRoute,
  getSeaCitiesForOcean,
  getSeaCityById,
  getSeaOceans,
  seaRouteKey,
  type SeaCityId,
  type SeaOcean,
} from "@/lib/seaSailors";
import { ShuffleSettingField } from "@/components/host/ShuffleSettingField";
import { GoalEstimateTable } from "@/components/host/GoalEstimateTable";
import { MetersPerCorrectField } from "@/components/host/MetersPerCorrectField";
import { launchGame } from "@/lib/useHostGameEngine";
import { cn } from "@/lib/utils";

type LaunchStep = "gameType" | "settings";

type DeckRecord = {
  id: string;
  title: string;
  description?: string | null;
  isBuiltIn?: boolean | null;
  answerShuffleMode?: ShuffleMode | string | null;
  questionShuffleMode?: ShuffleMode | string | null;
  answerShuffleScope?: string | null;
  questionShuffleScope?: string | null;
  questionTimeSeconds?: number | null;
  questions: {
    text: string;
    options: unknown;
    correctIndex: number;
    order: number;
    questionType?: unknown;
  }[];
};

const GAME_ICONS: Record<GameType, LucideIcon> = {
  deepDivers: Ship,
  deepDrillers: Drill,
  highFlyers: Plane,
  seaSailors: Sailboat,
  spaceTravelers: Rocket,
};

const DEFAULT_SEA_ROUTE = getDefaultSeaRoute();

export function LaunchDeckPage() {
  const { deckId } = useParams({ from: "/_host/l/$deckId" });
  const navigate = useNavigate();
  const { user } = db.useAuth();
  const [step, setStep] = useState<LaunchStep>("gameType");
  const [gameType, setGameType] = useState<GameType | null>(null);

  const { isLoading, data, error } = db.useQuery({
    decks: {
      $: { where: { id: deckId } },
      questions: {},
    },
  });

  const deck = data?.decks?.[0];
  const questions = deck?.questions ?? [];

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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      {getGameDifficultyBadges(type.id).map((d) => (
                        <DifficultyBadge key={d} difficulty={d} />
                      ))}
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
      ) : gameType ? (
        <LaunchDeckSettingsStep
          key={deck.id}
          deck={deck}
          gameType={gameType}
          userId={user?.id}
          onBack={() => setStep("gameType")}
          onLaunched={(code) => void navigate({ to: "/g/$code", params: { code } })}
        />
      ) : null}
    </main>
  );
}

type LaunchDeckSettingsStepProps = {
  deck: DeckRecord;
  gameType: GameType;
  userId: string | undefined;
  onBack: () => void;
  onLaunched: (code: string) => void;
};

function LaunchDeckSettingsStep({
  deck,
  gameType,
  userId,
  onBack,
  onLaunched,
}: LaunchDeckSettingsStepProps) {
  const questions = deck.questions;
  const [answerShuffleMode, setAnswerShuffleMode] = useState<ShuffleMode>(
    parseShuffleMode(deck.answerShuffleMode),
  );
  const [questionShuffleMode, setQuestionShuffleMode] = useState<ShuffleMode>(
    parseShuffleMode(deck.questionShuffleMode),
  );
  const [answerShuffleScope, setAnswerShuffleScope] = useState<SettingScope>(
    parseSettingScope(deck.answerShuffleScope),
  );
  const [questionShuffleScope, setQuestionShuffleScope] =
    useState<SettingScope>(parseSettingScope(deck.questionShuffleScope));
  const [questionTime, setQuestionTime] = useState(
    String(parseQuestionTimeSeconds(deck.questionTimeSeconds)),
  );
  const [durationMinutes, setDurationMinutes] = useState(
    String(DEFAULT_DURATION_MINUTES),
  );
  const [metersPerCorrect, setMetersPerCorrect] = useState(
    String(DEFAULT_METERS_PER_CORRECT),
  );
  const [seaOcean, setSeaOcean] = useState<SeaOcean>(DEFAULT_SEA_ROUTE.ocean);
  const [seaFromCityId, setSeaFromCityId] = useState<SeaCityId>(
    DEFAULT_SEA_ROUTE.fromCityId,
  );
  const [seaToCityId, setSeaToCityId] = useState<SeaCityId>(
    DEFAULT_SEA_ROUTE.toCityId,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const seaFromCity = getSeaCityById(seaFromCityId);
  const seaToCity = getSeaCityById(seaToCityId);
  const seaRouteDistanceMeters =
    seaFromCity && seaToCity
      ? computeGreatCircleDistanceMeters(seaFromCity, seaToCity)
      : null;
  const seaRouteKeyValue =
    gameType === "seaSailors"
      ? seaRouteKey(seaOcean, seaFromCityId, seaToCityId)
      : null;

  const isSeaSailors = gameType === "seaSailors";
  const seaRouteReady =
    !isSeaSailors ||
    (seaRouteDistanceMeters !== null && seaFromCityId !== seaToCityId);

  const baseGoalMeters = GAME_LEVELS[gameType].goalMeters;
  const metersPerCorrectGoalMeters =
    gameType === "seaSailors"
      ? seaRouteDistanceMeters ?? baseGoalMeters
      : baseGoalMeters;
  const metersPerCorrectMax =
    getMetersPerCorrectMax(metersPerCorrectGoalMeters);

  const canLaunch = Boolean(
    questions.length > 0 && userId && seaRouteReady,
  );

  const handleSeaOceanChange = (ocean: SeaOcean) => {
    const clamped = clampSeaRoute(ocean, seaFromCityId, seaToCityId);
    setSeaOcean(ocean);
    setSeaFromCityId(clamped.fromCityId);
    setSeaToCityId(clamped.toCityId);
  };

  const handleSeaFromCityChange = (fromCityId: SeaCityId) => {
    setSeaFromCityId(fromCityId);
    if (seaToCityId === fromCityId) {
      const cities = getSeaCitiesForOcean(seaOcean);
      const next = cities.find((city) => city.id !== fromCityId)?.id;
      if (next) {
        setSeaToCityId(next);
      }
    }
  };

  const handleLaunch = async () => {
    if (!userId || questions.length === 0) return;

    setIsSubmitting(true);
    try {
      const shuffleSettings = {
        answerShuffleMode,
        questionShuffleMode,
        answerShuffleScope,
        questionShuffleScope,
      };
      const snapshot = buildGameQuestionsSnapshot(questions, shuffleSettings);
      const code = generateJoinCode();
      await launchGame({
        hostId: userId,
        code,
        gameType,
        questionsSnapshot: snapshot,
        questionTimeSeconds: parseQuestionTimeSeconds(questionTime),
        durationSeconds: durationMinutesToSeconds(durationMinutes),
        metersPerCorrect: parseMetersPerCorrect(metersPerCorrect),
        deckTitle: deck.title,
        deckId: deck.id,
        ...shuffleSettings,
        ...(gameType === "seaSailors" &&
        seaRouteDistanceMeters !== null &&
        seaRouteKeyValue
          ? {
              seaOcean,
              seaFromCity: seaFromCityId,
              seaToCity: seaToCityId,
              seaRouteDistanceMeters,
              seaRouteKey: seaRouteKeyValue,
            }
          : {}),
      });
      onLaunched(code);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

        {gameType === "seaSailors" ? (
          <div className="space-y-3 rounded-xl border border-border/50 bg-card p-4">
            <div className="space-y-2">
              <Label>Ocean</Label>
              <Select
                value={seaOcean}
                onValueChange={(value) =>
                  handleSeaOceanChange(value as SeaOcean)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an ocean" />
                </SelectTrigger>
                <SelectContent>
                  {getSeaOceans().map((ocean) => (
                    <SelectItem key={ocean} value={ocean}>
                      {ocean}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departure city</Label>
              <Select
                value={seaFromCityId}
                onValueChange={handleSeaFromCityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a departure city" />
                </SelectTrigger>
                <SelectContent>
                  {getSeaCitiesForOcean(seaOcean).map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destination city</Label>
              <Select
                value={seaToCityId}
                onValueChange={(value) => setSeaToCityId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a destination city" />
                </SelectTrigger>
                <SelectContent>
                  {getSeaCitiesForOcean(seaOcean)
                    .filter((city) => city.id !== seaFromCityId)
                    .map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">
              Route goal:{" "}
              <span className="font-mono text-foreground">
                {seaRouteDistanceMeters !== null
                  ? formatGoalDistance(seaRouteDistanceMeters)
                  : "--"}
              </span>
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <MetersPerCorrectField
            value={metersPerCorrect}
            onChange={setMetersPerCorrect}
            goalMeters={metersPerCorrectGoalMeters}
            minMeters={MIN_METERS_PER_CORRECT}
            maxMeters={metersPerCorrectMax}
            inputClassName="max-w-40"
          />
          <GoalEstimateTable
            gameType={gameType}
            metersPerCorrect={metersPerCorrect}
            goalMetersOverride={
              gameType === "seaSailors" ? seaRouteDistanceMeters : undefined
            }
          />
        </div>

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
          <Button variant="outline" onClick={onBack}>
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
  );
}
