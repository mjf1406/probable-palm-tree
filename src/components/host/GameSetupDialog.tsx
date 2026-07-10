/** @format */

import { useState } from "react";
import {
    Drill,
    Plane,
    Rocket,
    Sailboat,
    Ship,
    type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Credenza,
    CredenzaContent,
    CredenzaDescription,
    CredenzaFooter,
    CredenzaHeader,
    CredenzaTitle,
} from "@/components/ui/credenza";
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
    DEFAULT_QUESTION_TIME,
    DURATION_PRESETS,
    DURATION_STEP_MINUTES,
    GAME_TYPES,
  SELECTABLE_GAME_TYPES,
  resolveSelectableGameType,
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
    buildPlayerQuestionsSnapshot,
    durationMinutesToSeconds,
    getDeckShuffleConfig,
    formatGoalDistance,
    getMetersPerCorrectMax,
    needsPerPlayerSnapshot,
    parseDurationMinutes,
    parseMetersPerCorrect,
    parseQuestionTimeSeconds,
    reshuffleForRepetition,
    secondsToDurationMinutes,
    type DeckShuffleConfig,
    type GameType,
    type ShuffleMode,
} from "@/lib/game";
import type { GameRecord, PlayerRecord, QuestionSnapshot } from "@/lib/types";
import { resetGameForRematch } from "@/lib/useHostGameEngine";
import { GoalEstimateTable } from "@/components/host/GoalEstimateTable";
import { MetersPerCorrectField } from "@/components/host/MetersPerCorrectField";
import {
    clampSeaRoute,
    computeGreatCircleDistanceMeters,
    getDefaultSeaRoute,
    getSeaCityById,
    getSeaCitiesForOcean,
    getSeaOceans,
    seaRouteKey,
    type SeaCityId,
    type SeaOcean,
} from "@/lib/seaSailors";

const DEFAULT_SEA_ROUTE = getDefaultSeaRoute();

type DeckOption = {
    id: string;
    title: string;
    questions: {
        text: string;
        options: unknown;
        correctIndex?: number;
        order: number;
        questionType?: unknown;
        answerConfig?: unknown;
    }[];
    answerShuffleMode?: ShuffleMode | string | null;
    questionShuffleMode?: ShuffleMode | string | null;
    answerShuffleScope?: string | null;
    questionShuffleScope?: string | null;
    questionTimeSeconds?: number | null;
};

type GameSetupDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: "rematch";
    decks: DeckOption[];
    initialDeckId?: string | null;
    initialGameType?: GameType;
    initialQuestionTime?: number;
    initialDurationSeconds?: number;
    initialMetersPerCorrect?: number;
    rematchGame?: GameRecord | null;
    players?: PlayerRecord[];
    answerIds?: string[];
};

type GameSetupFormProps = Omit<GameSetupDialogProps, "open" | "onOpenChange"> & {
    onClose: () => void;
};

const GAME_ICONS: Record<GameType, LucideIcon> = {
    deepDivers: Ship,
    deepDrillers: Drill,
    highFlyers: Plane,
    seaSailors: Sailboat,
    spaceTravelers: Rocket,
};

function buildPlayerSnapshotUpdates(
    players: PlayerRecord[],
    gameSnapshot: QuestionSnapshot[],
    settings: DeckShuffleConfig,
    sameDeck: boolean,
): { playerId: string; questionsSnapshot: QuestionSnapshot[] | null }[] {
    return players.map((player) => {
        if (sameDeck && player.questionsSnapshot) {
            return {
                playerId: player.id,
                questionsSnapshot: reshuffleForRepetition(
                    player.questionsSnapshot,
                    settings,
                    "perPlayer",
                    player.id,
                ),
            };
        }

        if (needsPerPlayerSnapshot(settings)) {
            return {
                playerId: player.id,
                questionsSnapshot: buildPlayerQuestionsSnapshot(
                    gameSnapshot,
                    settings,
                    player.id,
                ),
            };
        }

        return {
            playerId: player.id,
            questionsSnapshot: [...gameSnapshot],
        };
    });
}

export function GameSetupDialog({
    open,
    onOpenChange,
    ...formProps
}: GameSetupDialogProps) {
    return (
        <Credenza
            open={open}
            onOpenChange={onOpenChange}
        >
            {open ? (
                <GameSetupForm
                    {...formProps}
                    onClose={() => onOpenChange(false)}
                />
            ) : null}
        </Credenza>
    );
}

function GameSetupForm({
    decks,
    initialDeckId,
    initialGameType = "deepDivers",
    initialQuestionTime = DEFAULT_QUESTION_TIME,
    initialDurationSeconds = DEFAULT_DURATION_MINUTES * 60,
    initialMetersPerCorrect = DEFAULT_METERS_PER_CORRECT,
    rematchGame,
    players = [],
    answerIds = [],
    onClose,
}: GameSetupFormProps) {
    const { user } = db.useAuth();
    const resolvedDeckId = initialDeckId ?? decks[0]?.id ?? "";
    const initialDeck = decks.find((deck) => deck.id === resolvedDeckId);

    const [deckId, setDeckId] = useState(resolvedDeckId);
    const [gameType, setGameType] = useState<GameType>(
        resolveSelectableGameType(initialGameType),
    );
    const [questionTime, setQuestionTime] = useState(
        String(
            initialDeck
                ? parseQuestionTimeSeconds(initialDeck.questionTimeSeconds)
                : initialQuestionTime,
        ),
    );
    const [durationMinutes, setDurationMinutes] = useState(
        String(secondsToDurationMinutes(initialDurationSeconds)),
    );
    const [metersPerCorrect, setMetersPerCorrect] = useState(
        String(parseMetersPerCorrect(initialMetersPerCorrect)),
    );

    const [seaOcean, setSeaOcean] = useState<SeaOcean>(
        (rematchGame?.seaOcean as SeaOcean | undefined | null) ??
            DEFAULT_SEA_ROUTE.ocean,
    );
    const [seaFromCityId, setSeaFromCityId] = useState<SeaCityId>(
        (rematchGame?.seaFromCity as SeaCityId | undefined | null) ??
            DEFAULT_SEA_ROUTE.fromCityId,
    );
    const [seaToCityId, setSeaToCityId] = useState<SeaCityId>(
        (rematchGame?.seaToCity as SeaCityId | undefined | null) ??
            DEFAULT_SEA_ROUTE.toCityId,
    );

    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedDeck = decks.find((deck) => deck.id === deckId);
    const shuffleSettings = getDeckShuffleConfig(
        rematchGame?.deckId === selectedDeck?.id ? rematchGame : selectedDeck,
    );
    const selectedGame = GAME_TYPES.find((type) => type.id === gameType);
    const hasQuestions = (selectedDeck?.questions.length ?? 0) > 0;

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

    const metersPerCorrectGoalMeters =
        gameType === "seaSailors"
            ? (seaRouteDistanceMeters ?? GAME_LEVELS[gameType].goalMeters)
            : GAME_LEVELS[gameType].goalMeters;
    const metersPerCorrectMax = getMetersPerCorrectMax(
        metersPerCorrectGoalMeters,
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

    const handleSubmit = async () => {
        if (!user || !rematchGame || !selectedDeck || !hasQuestions) return;
        if (!seaRouteReady) return;

        setIsSubmitting(true);
        try {
            const sameDeck = rematchGame.deckId === selectedDeck.id;
            const questionsSnapshot = sameDeck
                ? reshuffleForRepetition(
                      rematchGame.questionsSnapshot,
                      shuffleSettings,
                      "everyone",
                  )
                : buildGameQuestionsSnapshot(
                      selectedDeck.questions,
                      shuffleSettings,
                  );

            const playerSnapshotUpdates = buildPlayerSnapshotUpdates(
                players,
                questionsSnapshot,
                shuffleSettings,
                sameDeck,
            );

            await resetGameForRematch({
                gameId: rematchGame.id,
                answerIds,
                gameType,
                questionsSnapshot,
                questionTimeSeconds: parseQuestionTimeSeconds(questionTime),
                durationSeconds: durationMinutesToSeconds(durationMinutes),
                metersPerCorrect: parseMetersPerCorrect(metersPerCorrect),
                deckTitle: selectedDeck.title,
                deckId: selectedDeck.id,
                ...shuffleSettings,
                playerSnapshotUpdates,
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
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CredenzaContent className="sm:max-w-md">
            <CredenzaHeader>
                <CredenzaTitle>Play again</CredenzaTitle>
                <CredenzaDescription>
                    Pick a deck for the next run. Everyone stays in the
                    lobby.
                </CredenzaDescription>
            </CredenzaHeader>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Deck</Label>
                    <Select
                        value={deckId}
                        onValueChange={(value) => {
                            setDeckId(value);
                            const deck = decks.find(
                                (item) => item.id === value,
                            );
                            if (deck) {
                                setQuestionTime(
                                    String(
                                        parseQuestionTimeSeconds(
                                            deck.questionTimeSeconds,
                                        ),
                                    ),
                                );
                            }
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a deck" />
                        </SelectTrigger>
                        <SelectContent>
                            {decks.map((deck) => (
                                <SelectItem
                                    key={deck.id}
                                    value={deck.id}
                                >
                                    {deck.title} ({deck.questions.length}{" "}
                                    questions)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Game type</Label>
                    <Select
                        value={gameType}
                        onValueChange={(value) =>
                            setGameType(value as GameType)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SELECTABLE_GAME_TYPES.map((type) => {
                                const Icon = GAME_ICONS[type.id];
                                return (
                                    <SelectItem
                                        key={type.id}
                                        value={type.id}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Icon className="size-4" />
                                            {type.name}
                                        </span>
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    {selectedGame ? (
                        <p className="text-xs text-muted-foreground">
                            {selectedGame.description}
                        </p>
                    ) : null}
                </div>

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
                                        <SelectItem
                                            key={ocean}
                                            value={ocean}
                                        >
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
                                    {getSeaCitiesForOcean(seaOcean).map(
                                        (city) => (
                                            <SelectItem
                                                key={city.id}
                                                value={city.id}
                                            >
                                                {city.name}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Destination city</Label>
                            <Select
                                value={seaToCityId}
                                onValueChange={(value) =>
                                    setSeaToCityId(value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a destination city" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getSeaCitiesForOcean(seaOcean)
                                        .filter(
                                            (city) =>
                                                city.id !== seaFromCityId,
                                        )
                                        .map((city) => (
                                            <SelectItem
                                                key={city.id}
                                                value={city.id}
                                            >
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
                                    ? formatGoalDistance(
                                          seaRouteDistanceMeters,
                                      )
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
                    />
                    <GoalEstimateTable
                        gameType={gameType}
                        metersPerCorrect={metersPerCorrect}
                        goalMetersOverride={
                            gameType === "seaSailors"
                                ? seaRouteDistanceMeters
                                : undefined
                        }
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="question-time">
                        Seconds per question
                    </Label>
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
                    />
                </div>

                <div className="space-y-3">
                    <Label htmlFor="game-duration">
                        Game duration (minutes)
                    </Label>
                    <NumberInput
                        id="game-duration"
                        value={durationMinutes}
                        onChange={setDurationMinutes}
                        min={MIN_DURATION_MINUTES}
                        max={MAX_DURATION_MINUTES}
                        step={DURATION_STEP_MINUTES}
                    />
                    <div className="flex flex-wrap gap-2">
                        {DURATION_PRESETS.map((preset) => (
                            <Button
                                key={preset.minutes}
                                type="button"
                                size="sm"
                                variant={
                                    parseDurationMinutes(
                                        durationMinutes,
                                    ) === preset.minutes
                                        ? "default"
                                        : "outline"
                                }
                                onClick={() =>
                                    setDurationMinutes(
                                        String(preset.minutes),
                                    )
                                }
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <CredenzaFooter>
                <Button
                    onClick={() => void handleSubmit()}
                    disabled={
                        isSubmitting || !hasQuestions || !seaRouteReady
                    }
                >
                    {isSubmitting ? "Saving..." : "Launch game"}
                </Button>
            </CredenzaFooter>
        </CredenzaContent>
    );
}
