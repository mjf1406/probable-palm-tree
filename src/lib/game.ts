/** @format */

import type { LucideIcon } from "lucide-react";
import {
    Circle,
    Diamond,
    Hexagon,
    Heart,
    Octagon,
    Square,
    Star,
    Triangle,
} from "lucide-react";
import gameLevelsData from "@/lib/game-levels.json";
import type { AnswerRecord, QuestionSnapshot } from "@/lib/types";

export const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_INPUT_PATTERN = `^[${CODE_CHARS}${CODE_CHARS.toLowerCase()}]+$`;
export const CODE_LENGTH = 6;
export const DEFAULT_QUESTION_TIME = 20;
export const DEFAULT_DURATION_SECONDS = 300;
export const MIN_DURATION_SECONDS = 60;
export const MAX_DURATION_SECONDS = 3600;
export const DEFAULT_DURATION_MINUTES = 5;
export const MIN_DURATION_MINUTES = 1;
export const MAX_DURATION_MINUTES = 60;
export const DURATION_STEP_MINUTES = 1;
export const MAX_STREAK_MULTIPLIER = 10;
export const DEFAULT_METERS_PER_CORRECT = 10;
export const MIN_METERS_PER_CORRECT = 1;
// Parsing clamp for meters-per-correct. UI additionally enforces a goal-based max.
export const MAX_METERS_PER_CORRECT = 10000;
export const MIN_QUESTION_TIME = 10;
export const MAX_QUESTION_TIME = 60;
export const QUESTION_TIME_STEP = 5;
export const QUESTION_TIME_CTRL_STEP = 10;
export const QUESTION_TIME_SHIFT_STEP = 15;
export const QUESTION_TIME_CTRL_SHIFT_STEP = 30;

/**
 * Host input constraint for "meters per correct answer".
 * - If the goal is below 10,000m, cap at 1,000m
 * - Otherwise cap at 10,000m
 */
export function getMetersPerCorrectMax(goalMeters: number): number {
    return goalMeters < 10000 ? 1000 : 10000;
}

export const ANSWER_OPTIONS: {
    color: string;
    hoverColor: string;
    shape: LucideIcon;
    label: string;
}[] = [
    {
        color: "bg-red-500",
        hoverColor: "hover:bg-red-600",
        shape: Circle,
        label: "Red circle",
    },
    {
        color: "bg-blue-500",
        hoverColor: "hover:bg-blue-600",
        shape: Square,
        label: "Blue square",
    },
    {
        color: "bg-amber-500",
        hoverColor: "hover:bg-amber-600",
        shape: Triangle,
        label: "Amber triangle",
    },
    {
        color: "bg-emerald-500",
        hoverColor: "hover:bg-emerald-600",
        shape: Diamond,
        label: "Green diamond",
    },
    {
        color: "bg-purple-500",
        hoverColor: "hover:bg-purple-600",
        shape: Hexagon,
        label: "Purple hexagon",
    },
    {
        color: "bg-pink-500",
        hoverColor: "hover:bg-pink-600",
        shape: Octagon,
        label: "Pink octagon",
    },
    {
        color: "bg-cyan-500",
        hoverColor: "hover:bg-cyan-600",
        shape: Star,
        label: "Cyan star",
    },
    {
        color: "bg-lime-500",
        hoverColor: "hover:bg-lime-600",
        shape: Heart,
        label: "Lime heart",
    },
];

export type GameType =
    | "deepDivers"
    | "deepDrillers"
    | "highFlyers"
    | "spaceTravelers"
    | "seaSailors";
export type GameDifficulty = "easy" | "medium" | "hard" | "veryHard";
export type GameStatus = "lobby" | "playing" | "ended";

export const GAME_DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    veryHard: "Very Hard",
};

export type LevelDefinition = {
    level: number;
    name: string;
    startingDistanceMeters: number;
};

export type GameLevelConfig = {
    goalMeters: number;
    levels: LevelDefinition[];
};

export const GAME_LEVELS = gameLevelsData as Record<GameType, GameLevelConfig>;

export const DURATION_PRESETS: { label: string; minutes: number }[] = [
    { label: "2 min", minutes: 2 },
    { label: "5 min", minutes: 5 },
    { label: "10 min", minutes: 10 },
    { label: "15 min", minutes: 15 },
    { label: "20 min", minutes: 20 },
];
export type QuestionType = "mc" | "tf";
export type ShuffleMode = "none" | "once" | "eachRepetition";
export type SettingScope = "everyone" | "perPlayer";

export const DEFAULT_SHUFFLE_MODE: ShuffleMode = "eachRepetition";
export const DEFAULT_SETTING_SCOPE: SettingScope = "everyone";

export const SETTING_SCOPES: {
    id: SettingScope;
    label: string;
    description: string;
}[] = [
    {
        id: "everyone",
        label: "Everyone",
        description: "Same order for all players.",
    },
    {
        id: "perPlayer",
        label: "Each player",
        description: "Different order per player.",
    },
];

export const SHUFFLE_MODES: {
    id: ShuffleMode;
    label: string;
    description: string;
}[] = [
    {
        id: "none",
        label: "No shuffling",
        description: "Keep the authored order every time.",
    },
    {
        id: "once",
        label: "Shuffle once",
        description:
            "Shuffle at launch, then keep that order for every repeat.",
    },
    {
        id: "eachRepetition",
        label: "Shuffle each repetition",
        description:
            "Shuffle again each time the question set repeats within the same game.",
    },
];

export const GAME_TYPES: {
    id: GameType;
    name: string;
    description: string;
    distanceLabel: string;
    vehicle: string;
    difficulty: GameDifficulty;
}[] = [
    {
        id: "deepDivers",
        name: "Deep Divers",
        description:
            "Dive through ocean layers toward the deepest point on Earth.",
        distanceLabel: "Depth",
        vehicle: "submarine",
        difficulty: "easy",
    },
    {
        id: "deepDrillers",
        name: "Deep Drillers",
        description: "Drill through Earth's layers toward the inner core.",
        distanceLabel: "Drill depth",
        vehicle: "drill",
        difficulty: "hard",
    },
    {
        id: "highFlyers",
        name: "High Flyers",
        description: "Launch through atmosphere layers out of Earth's air.",
        distanceLabel: "Altitude",
        vehicle: "rocket",
        difficulty: "medium",
    },
    {
        id: "seaSailors",
        name: "Sea Sailors",
        description: "Sail from San Francisco to Honolulu on the same ocean.",
        distanceLabel: "Distance sailed",
        vehicle: "sailboat",
        difficulty: "hard",
    },
    {
        id: "spaceTravelers",
        name: "Space Travelers",
        description:
            "Launch from the Sun and try to escape the Solar System (to the heliopause).",
        distanceLabel: "Distance from Sun",
        vehicle: "spaceship",
        difficulty: "veryHard",
    },
];

export function getGameDifficulty(gameType: GameType): GameDifficulty {
    return (
        GAME_TYPES.find((type) => type.id === gameType)?.difficulty ?? "easy"
    );
}

export function getGameDifficultyBadges(gameType: GameType): GameDifficulty[] {
    // Sea Sailors is vibe-coded as a two-tier difficulty.
    // We show both `Medium` and `Hard` badges in the UI.
    if (gameType === "seaSailors") return ["medium", "hard"];
    return [getGameDifficulty(gameType)];
}

export function parseShuffleMode(value: unknown): ShuffleMode {
    if (value === "none" || value === "once" || value === "eachRepetition") {
        return value;
    }
    return DEFAULT_SHUFFLE_MODE;
}

export function parseSettingScope(value: unknown): SettingScope {
    if (value === "everyone" || value === "perPlayer") {
        return value;
    }
    return DEFAULT_SETTING_SCOPE;
}

export function parseQuestionTimeSeconds(value: unknown): number {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < MIN_QUESTION_TIME || n > MAX_QUESTION_TIME)
        return DEFAULT_QUESTION_TIME;
    return Math.round(n);
}

export function parseMetersPerCorrect(value: unknown): number {
    const n = typeof value === "number" ? value : Number(value);
    if (
        !Number.isFinite(n) ||
        n < MIN_METERS_PER_CORRECT ||
        n > MAX_METERS_PER_CORRECT
    ) {
        return DEFAULT_METERS_PER_CORRECT;
    }
    return Math.round(n);
}

export function parseQuestionType(value: unknown): QuestionType {
    return value === "tf" ? "tf" : "mc";
}

export function generateJoinCode(length = CODE_LENGTH): string {
    let code = "";
    for (let i = 0; i < length; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}

export function isValidCodeChar(char: string): boolean {
    return CODE_CHARS.includes(char.toUpperCase());
}

export function sanitizeCodeInput(value: string): string {
    return value
        .toUpperCase()
        .split("")
        .filter((char) => CODE_CHARS.includes(char))
        .join("")
        .slice(0, CODE_LENGTH);
}

export function parseGameType(value: unknown): GameType {
    if (
        value === "deepDivers" ||
        value === "deepDrillers" ||
        value === "highFlyers" ||
        value === "spaceTravelers" ||
        value === "seaSailors"
    ) {
        return value;
    }
    return "deepDivers";
}

export function parseDurationSeconds(value: unknown): number {
    const n = typeof value === "number" ? value : Number(value);
    if (
        !Number.isFinite(n) ||
        n < MIN_DURATION_SECONDS ||
        n > MAX_DURATION_SECONDS
    ) {
        return DEFAULT_DURATION_SECONDS;
    }
    return Math.round(n);
}

export function parseDurationMinutes(value: unknown): number {
    const n = typeof value === "number" ? value : Number(value);
    if (
        !Number.isFinite(n) ||
        n < MIN_DURATION_MINUTES ||
        n > MAX_DURATION_MINUTES
    ) {
        return DEFAULT_DURATION_MINUTES;
    }
    return Math.round(n);
}

export function durationMinutesToSeconds(minutes: unknown): number {
    return parseDurationMinutes(minutes) * 60;
}

export function secondsToDurationMinutes(seconds: unknown): number {
    return Math.round(parseDurationSeconds(seconds) / 60);
}

export function getStreakMultiplier(streak: number): number {
    if (streak <= 0) return 1;
    return Math.min(streak, MAX_STREAK_MULTIPLIER);
}

export function getDistanceGainForCorrect(
    streak: number,
    metersPerCorrect: number = DEFAULT_METERS_PER_CORRECT,
): number {
    return (
        parseMetersPerCorrect(metersPerCorrect) * getStreakMultiplier(streak)
    );
}

export function estimateCorrectAnswersToGoal(
    gameType: GameType,
    metersPerCorrect: unknown,
): number {
    const goalMeters = GAME_LEVELS[gameType].goalMeters;
    const meters = parseMetersPerCorrect(metersPerCorrect);
    return Math.ceil(goalMeters / meters);
}

// Distance estimate table rows: show even player counts up to 30.
export const ESTIMATE_PLAYER_COUNTS = [
    2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30,
] as const;
export const ESTIMATE_STREAK_LEVELS = [1, 2, 3, 5, 10] as const;

/**
 * Per-player correct answers needed to reach the goal, assuming:
 * - each player maintains the provided sustained streak
 * - the squad gains equally from each player's correct answers
 */
export function estimateCorrectAnswersPerPlayer(
    gameType: GameType,
    metersPerCorrect: unknown,
    playerCount: number,
    streak: number,
): number {
    const goalMeters = GAME_LEVELS[gameType].goalMeters;
    const meters = parseMetersPerCorrect(metersPerCorrect);
    const gainPerCorrectPerPlayer = meters * getStreakMultiplier(streak);

    if (!Number.isFinite(playerCount) || playerCount <= 0) return 0;

    const squadGainPerCorrectRound = playerCount * gainPerCorrectPerPlayer;

    if (squadGainPerCorrectRound <= 0) return 0;
    return Math.ceil(goalMeters / squadGainPerCorrectRound);
}

export function computeTotalDistance(answers: AnswerRecord[]): number {
    return answers.reduce(
        (sum, answer) => sum + (answer.distanceGained ?? 0),
        0,
    );
}

export function computePlayerDistance(
    answers: AnswerRecord[],
    playerId: string,
): number {
    return answers
        .filter((answer) => answer.player?.id === playerId)
        .reduce((sum, answer) => sum + (answer.distanceGained ?? 0), 0);
}

export function getLevelForDistance(
    gameType: GameType,
    meters: number,
): LevelDefinition {
    const config = GAME_LEVELS[gameType];
    let current = config.levels[0]!;
    for (const level of config.levels) {
        if (meters >= level.startingDistanceMeters) {
            current = level;
        } else {
            break;
        }
    }
    return current;
}

export function getLevelProgress(
    gameType: GameType,
    meters: number,
): {
    level: LevelDefinition;
    progressPercent: number;
    nextLevel: LevelDefinition | null;
} {
    const config = GAME_LEVELS[gameType];
    const level = getLevelForDistance(gameType, meters);
    const levelIndex = config.levels.findIndex(
        (item) => item.level === level.level,
    );
    const nextLevel = config.levels[levelIndex + 1] ?? null;
    const spanStart = level.startingDistanceMeters;
    const spanEnd = nextLevel?.startingDistanceMeters ?? config.goalMeters;
    const span = Math.max(spanEnd - spanStart, 1);
    const progressPercent = Math.min(
        100,
        Math.max(0, ((meters - spanStart) / span) * 100),
    );
    return { level, progressPercent, nextLevel };
}

export function getGameDeadline(
    startedAt: number | undefined | null,
    durationSeconds: number,
    endsAt?: number | null,
): number | null {
    if (endsAt != null) return endsAt;
    if (startedAt != null) return startedAt + durationSeconds * 1000;
    return null;
}

export function getGameTimeRemaining(
    startedAt: number | undefined | null,
    durationSeconds: number,
    now = Date.now(),
    endsAt?: number | null,
): number {
    const deadline = getGameDeadline(startedAt, durationSeconds, endsAt);
    if (deadline != null) {
        return Math.max(0, (deadline - now) / 1000);
    }
    if (!startedAt) return durationSeconds;
    const elapsed = (now - startedAt) / 1000;
    return Math.max(0, durationSeconds - elapsed);
}

export function formatHMSMilliseconds(durationSeconds: number): string {
    if (!Number.isFinite(durationSeconds)) return "00:00:00";

    // Preserve the existing countdown semantics (previous UI used `Math.ceil`):
    // the displayed second only changes once the remaining time crosses an integer boundary.
    const clampedSeconds = Math.max(0, durationSeconds);
    const totalSeconds = Math.ceil(clampedSeconds);

    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    const pad2 = (value: number) => String(value).padStart(2, "0");

    // If there are no hours, use a shorter display.
    if (hours <= 0) {
        return `${pad2(minutes)}:${pad2(seconds)}`;
    }

    const hourStr = hours < 100 ? pad2(hours) : String(hours);
    return `${hourStr}:${pad2(minutes)}:${pad2(seconds)}`;
}

export function isGameExpired(
    startedAt: number | undefined | null,
    durationSeconds: number,
    now = Date.now(),
    endsAt?: number | null,
): boolean {
    return getGameTimeRemaining(startedAt, durationSeconds, now, endsAt) <= 0;
}

export function formatDistance(meters: number): string {
    if (meters < 1_000) {
        return `${Math.round(meters)} m`;
    }
    const km = meters / 1_000;
    if (km >= 1_000_000_000) {
        const billion = km / 1_000_000_000;
        return `${billion.toFixed(1).replace(/\.0$/, "")} billion km`;
    }
    if (km >= 1_000_000) {
        const million = km / 1_000_000;
        const trimmed = million
            .toFixed(2)
            .replace(/0+$/, "")
            .replace(/\.$/, "");
        return `${trimmed} million km`;
    }
    if (km >= 100) return `${Math.round(km).toLocaleString()} km`;
    return `${km.toFixed(1)} km`;
}

/** Exact km for game goals — no rounding. */
export function formatGoalDistance(meters: number): string {
    const wholeKm = Math.floor(meters / 1_000);
    const remainderMeters = meters % 1_000;
    if (remainderMeters === 0) {
        if (wholeKm >= 1_000_000_000) {
            const billion = wholeKm / 1_000_000_000;
            return `${billion.toFixed(1).replace(/\.0$/, "")} billion km`;
        }
        if (wholeKm >= 1_000_000) {
            const million = wholeKm / 1_000_000;
            const trimmed = million
                .toFixed(2)
                .replace(/0+$/, "")
                .replace(/\.$/, "");
            return `${trimmed} million km`;
        }
        return `${wholeKm.toLocaleString()} km`;
    }
    const decimal = remainderMeters
        .toString()
        .padStart(3, "0")
        .replace(/0+$/, "");
    return `${wholeKm.toLocaleString()}.${decimal} km`;
}

export function getTimeRemaining(
    questionStartedAt: number | undefined | null,
    questionTimeSeconds: number,
    now = Date.now(),
): number {
    if (!questionStartedAt) return questionTimeSeconds;
    const elapsed = (now - questionStartedAt) / 1000;
    return Math.max(0, questionTimeSeconds - elapsed);
}

export function isQuestionExpired(
    questionStartedAt: number | undefined | null,
    questionTimeSeconds: number,
    now = Date.now(),
): boolean {
    return getTimeRemaining(questionStartedAt, questionTimeSeconds, now) <= 0;
}

export function parseQuestionsSnapshot(value: unknown): QuestionSnapshot[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter(
            (item): item is Record<string, unknown> =>
                typeof item === "object" &&
                item !== null &&
                typeof (item as QuestionSnapshot).text === "string" &&
                Array.isArray((item as QuestionSnapshot).options) &&
                typeof (item as QuestionSnapshot).correctIndex === "number",
        )
        .map((item) => ({
            text: item.text as string,
            options: (item.options as unknown[]).filter(
                (option): option is string => typeof option === "string",
            ),
            correctIndex: item.correctIndex as number,
            questionType: parseQuestionType(item.questionType),
        }));
}

function hashSeed(seed: string): number {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
        hash ^= seed.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function createSeededRandom(seed: string): () => number {
    let state = hashSeed(seed) || 1;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffleArray<T>(items: T[], random: () => number = Math.random): T[] {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const temp = next[i];
        next[i] = next[j]!;
        next[j] = temp!;
    }
    return next;
}

export function shuffleQuestionOptions(
    question: QuestionSnapshot,
    random: () => number = Math.random,
): QuestionSnapshot {
    if (question.options.length <= 1) return question;

    const indexed = question.options.map((option, index) => ({
        option,
        index,
    }));
    const shuffled = shuffleArray(indexed, random);
    const correctIndex = shuffled.findIndex(
        (item) => item.index === question.correctIndex,
    );

    return {
        ...question,
        options: shuffled.map((item) => item.option),
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
    };
}

export type DeckShuffleConfig = {
    answerShuffleMode: ShuffleMode;
    questionShuffleMode: ShuffleMode;
    answerShuffleScope: SettingScope;
    questionShuffleScope: SettingScope;
};

type RawDeckQuestion = {
    text: string;
    options: unknown;
    correctIndex: number;
    order: number;
    questionType?: unknown;
};

function toAuthoritativeSnapshot(
    questions: RawDeckQuestion[],
): QuestionSnapshot[] {
    return [...questions]
        .sort((a, b) => a.order - b.order)
        .map((question) => ({
            text: question.text,
            options: Array.isArray(question.options)
                ? (question.options as string[])
                : [],
            correctIndex: question.correctIndex,
            questionType: parseQuestionType(question.questionType),
        }));
}

function applyScopedShuffles(
    snapshot: QuestionSnapshot[],
    {
        answerShuffleMode,
        questionShuffleMode,
        answerShuffleScope,
        questionShuffleScope,
    }: DeckShuffleConfig,
    scope: SettingScope,
    {
        shuffleAnswers,
        shuffleQuestions,
        seed,
    }: {
        shuffleAnswers?: boolean;
        shuffleQuestions?: boolean;
        seed?: string;
    } = {},
): QuestionSnapshot[] {
    const random = seed ? createSeededRandom(seed) : Math.random;
    const shouldShuffleQuestions =
        shuffleQuestions ??
        (questionShuffleScope === scope && questionShuffleMode !== "none");
    const shouldShuffleAnswers =
        shuffleAnswers ??
        (answerShuffleScope === scope && answerShuffleMode !== "none");

    let next = [...snapshot];

    if (shouldShuffleQuestions) {
        next = shuffleArray(next, random);
    }

    if (shouldShuffleAnswers) {
        next = next.map((question) =>
            question.questionType === "tf"
                ? question
                : shuffleQuestionOptions(question, random),
        );
    }

    return next;
}

export function buildQuestionsSnapshot(
    questions: RawDeckQuestion[],
    settings: DeckShuffleConfig,
    {
        shuffleAnswers,
        shuffleQuestions,
        seed,
    }: {
        shuffleAnswers?: boolean;
        shuffleQuestions?: boolean;
        seed?: string;
    } = {},
): QuestionSnapshot[] {
    const snapshot = toAuthoritativeSnapshot(questions);
    return applyScopedShuffles(snapshot, settings, "everyone", {
        shuffleAnswers,
        shuffleQuestions,
        seed,
    });
}

export function buildPlayerQuestionsSnapshot(
    baseSnapshot: QuestionSnapshot[],
    settings: DeckShuffleConfig,
    playerId: string,
    {
        shuffleAnswers,
        shuffleQuestions,
        seedSuffix = "",
    }: {
        shuffleAnswers?: boolean;
        shuffleQuestions?: boolean;
        seedSuffix?: string;
    } = {},
): QuestionSnapshot[] {
    return applyScopedShuffles(baseSnapshot, settings, "perPlayer", {
        shuffleAnswers,
        shuffleQuestions,
        seed: `${playerId}${seedSuffix}`,
    });
}

export function needsPerPlayerSnapshot(settings: DeckShuffleConfig): boolean {
    return (
        (settings.answerShuffleScope === "perPlayer" &&
            settings.answerShuffleMode !== "none") ||
        (settings.questionShuffleScope === "perPlayer" &&
            settings.questionShuffleMode !== "none")
    );
}

export function getDeckShuffleConfig(
    raw: Partial<Record<keyof DeckShuffleConfig, unknown>> | null | undefined,
): DeckShuffleConfig {
    return {
        answerShuffleMode: parseShuffleMode(raw?.answerShuffleMode),
        questionShuffleMode: parseShuffleMode(raw?.questionShuffleMode),
        answerShuffleScope: parseSettingScope(raw?.answerShuffleScope),
        questionShuffleScope: parseSettingScope(raw?.questionShuffleScope),
    };
}

export function buildGameQuestionsSnapshot(
    questions: RawDeckQuestion[],
    settings: DeckShuffleConfig,
): QuestionSnapshot[] {
    return buildQuestionsSnapshot(questions, settings, {
        shuffleQuestions:
            settings.questionShuffleScope === "everyone" &&
            settings.questionShuffleMode !== "none",
        shuffleAnswers:
            settings.answerShuffleScope === "everyone" &&
            settings.answerShuffleMode !== "none",
    });
}

export function buildLoopSnapshot(
    baseSnapshot: QuestionSnapshot[],
    settings: DeckShuffleConfig,
    {
        playerId,
        gameId,
        repetition,
    }: {
        playerId: string;
        gameId: string;
        repetition: number;
    },
): QuestionSnapshot[] {
    if (repetition <= 0) {
        return [...baseSnapshot];
    }

    const questionSeed =
        settings.questionShuffleScope === "perPlayer"
            ? `${playerId}${repetition}`
            : `${gameId}${repetition}`;
    const answerSeed =
        settings.answerShuffleScope === "perPlayer"
            ? `${playerId}${repetition}`
            : `${gameId}${repetition}`;

    let snapshot = [...baseSnapshot];

    if (
        settings.questionShuffleMode === "eachRepetition" &&
        settings.questionShuffleScope === "everyone"
    ) {
        snapshot = reshuffleForRepetition(
            snapshot,
            settings,
            "everyone",
            questionSeed,
        );
    } else if (
        settings.questionShuffleMode === "eachRepetition" &&
        settings.questionShuffleScope === "perPlayer"
    ) {
        snapshot = reshuffleForRepetition(
            snapshot,
            settings,
            "perPlayer",
            questionSeed,
        );
    }

    if (
        settings.answerShuffleMode === "eachRepetition" &&
        settings.answerShuffleScope === "everyone" &&
        settings.questionShuffleMode !== "eachRepetition"
    ) {
        snapshot = reshuffleForRepetition(
            snapshot,
            settings,
            "everyone",
            answerSeed,
        );
    } else if (
        settings.answerShuffleMode === "eachRepetition" &&
        settings.answerShuffleScope === "perPlayer" &&
        settings.questionShuffleMode !== "eachRepetition"
    ) {
        snapshot = reshuffleForRepetition(
            snapshot,
            settings,
            "perPlayer",
            answerSeed,
        );
    }

    if (
        settings.questionShuffleMode === "eachRepetition" &&
        settings.answerShuffleMode === "eachRepetition"
    ) {
        snapshot = reshuffleForRepetition(
            snapshot,
            {
                ...settings,
                questionShuffleMode: "none",
            },
            settings.questionShuffleScope,
            answerSeed,
        );
    }

    return snapshot;
}

/** Rematch: reshuffle only components whose mode is `eachRepetition`. */
export function reshuffleForRepetition(
    currentSnapshot: QuestionSnapshot[],
    settings: DeckShuffleConfig,
    scope: SettingScope,
    seed?: string,
): QuestionSnapshot[] {
    const random = seed ? createSeededRandom(seed) : Math.random;
    let snapshot = [...currentSnapshot];

    if (
        settings.questionShuffleScope === scope &&
        settings.questionShuffleMode === "eachRepetition"
    ) {
        snapshot = shuffleArray(snapshot, random);
    }

    if (
        settings.answerShuffleScope === scope &&
        settings.answerShuffleMode === "eachRepetition"
    ) {
        snapshot = snapshot.map((question) =>
            question.questionType === "tf"
                ? question
                : shuffleQuestionOptions(question, random),
        );
    }

    return snapshot;
}

export function formatCode(code: string): string {
    const sanitized = sanitizeCodeInput(code);
    if (sanitized.length <= 3) return sanitized;
    return `${sanitized.slice(0, 3)}—${sanitized.slice(3)}`;
}
