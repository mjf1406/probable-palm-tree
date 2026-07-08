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
export const METERS_PER_CORRECT = 1;
export const MIN_QUESTION_TIME = 10;
export const MAX_QUESTION_TIME = 60;
export const QUESTION_TIME_STEP = 5;
export const QUESTION_TIME_CTRL_STEP = 10;
export const QUESTION_TIME_SHIFT_STEP = 15;
export const QUESTION_TIME_CTRL_SHIFT_STEP = 30;

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

export type GameType = "deepDivers" | "deepDrillers" | "highFlyers";
export type GameDifficulty = "easy" | "medium" | "hard";
export type GameStatus = "lobby" | "playing" | "ended";

export const GAME_DIFFICULTY_LABELS: Record<GameDifficulty, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
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
        description:
            "Drill through Earth's layers toward the inner core.",
        distanceLabel: "Drill depth",
        vehicle: "drill",
        difficulty: "medium",
    },
    {
        id: "highFlyers",
        name: "High Flyers",
        description:
            "Launch through atmosphere layers out of Earth's air.",
        distanceLabel: "Altitude",
        vehicle: "rocket",
        difficulty: "hard",
    },
];

export function getGameDifficulty(gameType: GameType): GameDifficulty {
    return GAME_TYPES.find((type) => type.id === gameType)?.difficulty ?? "easy";
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
        value === "highFlyers"
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

export function getDistanceGainForCorrect(streak: number): number {
    return METERS_PER_CORRECT * getStreakMultiplier(streak);
}

export function computeTotalDistance(answers: AnswerRecord[]): number {
    return answers.reduce((sum, answer) => sum + (answer.distanceGained ?? 0), 0);
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
): { level: LevelDefinition; progressPercent: number; nextLevel: LevelDefinition | null } {
    const config = GAME_LEVELS[gameType];
    const level = getLevelForDistance(gameType, meters);
    const levelIndex = config.levels.findIndex((item) => item.level === level.level);
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

export function getGameTimeRemaining(
    startedAt: number | undefined | null,
    durationSeconds: number,
    now = Date.now(),
): number {
    if (!startedAt) return durationSeconds;
    const elapsed = (now - startedAt) / 1000;
    return Math.max(0, durationSeconds - elapsed);
}

export function isGameExpired(
    startedAt: number | undefined | null,
    durationSeconds: number,
    now = Date.now(),
): boolean {
    return getGameTimeRemaining(startedAt, durationSeconds, now) <= 0;
}

export function formatDistance(meters: number): string {
    if (meters >= 1_000_000) {
        return `${(meters / 1_000_000).toFixed(2)} km`;
    }
    if (meters >= 1_000) {
        return `${(meters / 1_000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
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

function toAuthoritativeSnapshot(questions: RawDeckQuestion[]): QuestionSnapshot[] {
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
    raw:
        | Partial<Record<keyof DeckShuffleConfig, unknown>>
        | null
        | undefined,
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
        snapshot = reshuffleForRepetition(snapshot, settings, "everyone", questionSeed);
    } else if (
        settings.questionShuffleMode === "eachRepetition" &&
        settings.questionShuffleScope === "perPlayer"
    ) {
        snapshot = reshuffleForRepetition(snapshot, settings, "perPlayer", questionSeed);
    }

    if (
        settings.answerShuffleMode === "eachRepetition" &&
        settings.answerShuffleScope === "everyone" &&
        settings.questionShuffleMode !== "eachRepetition"
    ) {
        snapshot = reshuffleForRepetition(snapshot, settings, "everyone", answerSeed);
    } else if (
        settings.answerShuffleMode === "eachRepetition" &&
        settings.answerShuffleScope === "perPlayer" &&
        settings.questionShuffleMode !== "eachRepetition"
    ) {
        snapshot = reshuffleForRepetition(snapshot, settings, "perPlayer", answerSeed);
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
