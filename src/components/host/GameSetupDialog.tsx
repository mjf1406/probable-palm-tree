/** @format */

import { useEffect, useState } from "react";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import {
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
        correctIndex: number;
        order: number;
        questionType?: unknown;
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
    decks,
    initialDeckId,
    initialGameType = "deepDivers",
    initialQuestionTime = DEFAULT_QUESTION_TIME,
    initialDurationSeconds = DEFAULT_DURATION_MINUTES * 60,
    initialMetersPerCorrect = DEFAULT_METERS_PER_CORRECT,
    rematchGame,
    players = [],
    answerIds = [],
}: GameSetupDialogProps) {
    const { user } = db.useAuth();
    const [deckId, setDeckId] = useState(initialDeckId ?? decks[0]?.id ?? "");
    const [gameType, setGameType] = useState<GameType>(initialGameType);
    const [questionTime, setQuestionTime] = useState(
        String(initialQuestionTime),
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

    useEffect(() => {
        if (!open) return;
        setDeckId(initialDeckId ?? decks[0]?.id ?? "");
        setGameType(initialGameType);
        setDurationMinutes(
            String(secondsToDurationMinutes(initialDurationSeconds)),
        );
        setMetersPerCorrect(
            String(parseMetersPerCorrect(initialMetersPerCorrect)),
        );
        setSeaOcean(
            (rematchGame?.seaOcean as SeaOcean | undefined | null) ??
                DEFAULT_SEA_ROUTE.ocean,
        );
        setSeaFromCityId(
            (rematchGame?.seaFromCity as SeaCityId | undefined | null) ??
                DEFAULT_SEA_ROUTE.fromCityId,
        );
        setSeaToCityId(
            (rematchGame?.seaToCity as SeaCityId | undefined | null) ??
                DEFAULT_SEA_ROUTE.toCityId,
        );
        const initialDeck = decks.find(
            (deck) => deck.id === (initialDeckId ?? decks[0]?.id ?? ""),
        );
        setQuestionTime(
            String(
                initialDeck
                    ? parseQuestionTimeSeconds(initialDeck.questionTimeSeconds)
                    : initialQuestionTime,
            ),
        );
    }, [
        open,
        initialDeckId,
        decks,
        initialGameType,
        initialQuestionTime,
        initialDurationSeconds,
        initialMetersPerCorrect,
        rematchGame,
    ]);

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

    useEffect(() => {
        if (gameType !== "seaSailors") return;

        const cities = getSeaCitiesForOcean(seaOcean);
        if (cities.length === 0) return;

        setSeaFromCityId((prev) => {
            const stillInOcean = cities.some((c) => c.id === prev);
            return stillInOcean ? prev : cities[0]!.id;
        });
        setSeaToCityId((prev) => {
            const stillInOcean = cities.some((c) => c.id === prev);
            return stillInOcean ? prev : (cities[1]?.id ?? cities[0]!.id);
        });
    }, [gameType, seaOcean]);

    useEffect(() => {
        if (gameType !== "seaSailors") return;
        if (seaToCityId !== seaFromCityId) return;

        const cities = getSeaCitiesForOcean(seaOcean);
        const next = cities.find((c) => c.id !== seaFromCityId)?.id;
        if (next) setSeaToCityId(next);
    }, [gameType, seaOcean, seaFromCityId, seaToCityId]);

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
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Play again</DialogTitle>
                    <DialogDescription>
                        Pick a deck for the next run. Everyone stays in the
                        lobby.
                    </DialogDescription>
                </DialogHeader>

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
                                {GAME_TYPES.map((type) => {
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
                                        setSeaOcean(value as SeaOcean)
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
                                    onValueChange={(value) =>
                                        setSeaFromCityId(value)
                                    }
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
                        <Label htmlFor="meters-per-correct">
                            Distance per correct answer (meters)
                        </Label>
                        <NumberInput
                            id="meters-per-correct"
                            value={metersPerCorrect}
                            onChange={(value) => {
                                if (value.trim() === "") {
                                    setMetersPerCorrect(value);
                                    return;
                                }
                                const n = Number(value);
                                if (!Number.isFinite(n)) {
                                    setMetersPerCorrect(value);
                                    return;
                                }
                                setMetersPerCorrect(
                                    String(Math.min(n, metersPerCorrectMax)),
                                );
                            }}
                            min={MIN_METERS_PER_CORRECT}
                            max={metersPerCorrectMax}
                            step={1}
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

                <DialogFooter>
                    <Button
                        onClick={() => void handleSubmit()}
                        disabled={
                            isSubmitting || !hasQuestions || !seaRouteReady
                        }
                    >
                        {isSubmitting ? "Saving..." : "Launch game"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** Authored deck → snapshot without shuffling (for listing / rematch deck options). */
export function toSnapshot(
    questions: {
        text: string;
        options: unknown;
        correctIndex: number;
        order: number;
        questionType?: unknown;
    }[],
): QuestionSnapshot[] {
    return buildGameQuestionsSnapshot(questions, {
        answerShuffleMode: "none",
        questionShuffleMode: "none",
        answerShuffleScope: "everyone",
        questionShuffleScope: "everyone",
    });
}
