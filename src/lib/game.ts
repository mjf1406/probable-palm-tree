/** @format */

import type { LucideIcon } from "lucide-react";
import { Circle, Diamond, Hexagon, Heart, Octagon, Square, Star, Triangle } from "lucide-react";
import type { QuestionSnapshot } from "@/lib/types";

export const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_INPUT_PATTERN = `^[${CODE_CHARS}${CODE_CHARS.toLowerCase()}]+$`;
export const CODE_LENGTH = 6;
export const STARTING_LIVES = 5;
export const DEFAULT_QUESTION_TIME = 20;
export const REVEAL_DELAY_MS = 3000;

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

export type GameType = "submarine" | "robot";
export type GameStatus = "lobby" | "playing" | "won" | "lost";
export type QuestionType = "mc" | "tf";
export type ShuffleMode = "none" | "once" | "eachRepetition";

export const DEFAULT_SHUFFLE_MODE: ShuffleMode = "eachRepetition";

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
        description: "Shuffle at launch, then keep that order for every rematch.",
    },
    {
        id: "eachRepetition",
        label: "Shuffle each repetition",
        description: "Shuffle again every time you play this deck.",
    },
];

export const GAME_TYPES: {
    id: GameType;
    name: string;
    description: string;
    resource: string;
}[] = [
    {
        id: "submarine",
        name: "Submarine Squad",
        description: "Dive deep together — keep your oxygen up!",
        resource: "Oxygen",
    },
    {
        id: "robot",
        name: "Robot Run",
        description: "Power the robot forward — don't drain the battery!",
        resource: "Battery",
    },
];

export function parseShuffleMode(value: unknown): ShuffleMode {
    if (value === "none" || value === "once" || value === "eachRepetition") {
        return value;
    }
    return DEFAULT_SHUFFLE_MODE;
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

export function getProgressPerQuestion(questionCount: number): number {
    if (questionCount <= 0) return 0;
    return 100 / questionCount;
}

export function resolveQuestion({
    correctCount,
    playerCount,
    questionCount,
}: {
    correctCount: number;
    playerCount: number;
    questionCount: number;
}): { progressGain: number; livesLost: number } {
    if (playerCount === 0) {
        return { progressGain: 0, livesLost: 0 };
    }

    const progressGain =
        (correctCount / playerCount) * getProgressPerQuestion(questionCount);
    const livesLost = Math.min(playerCount - correctCount, 2);

    return { progressGain, livesLost };
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

function shuffleArray<T>(items: T[]): T[] {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = next[i];
        next[i] = next[j]!;
        next[j] = temp!;
    }
    return next;
}

export function shuffleQuestionOptions(
    question: QuestionSnapshot,
): QuestionSnapshot {
    if (question.options.length <= 1) return question;

    const indexed = question.options.map((option, index) => ({
        option,
        index,
    }));
    const shuffled = shuffleArray(indexed);
    const correctIndex = shuffled.findIndex(
        (item) => item.index === question.correctIndex,
    );

    return {
        ...question,
        options: shuffled.map((item) => item.option),
        correctIndex: correctIndex >= 0 ? correctIndex : 0,
    };
}

export function buildQuestionsSnapshot(
    questions: {
        text: string;
        options: unknown;
        correctIndex: number;
        order: number;
        questionType?: unknown;
    }[],
    {
        answerShuffleMode,
        questionShuffleMode,
    }: {
        answerShuffleMode: ShuffleMode;
        questionShuffleMode: ShuffleMode;
    },
    {
        shuffleAnswers = answerShuffleMode !== "none",
        shuffleQuestions = questionShuffleMode !== "none",
    }: {
        shuffleAnswers?: boolean;
        shuffleQuestions?: boolean;
    } = {},
): QuestionSnapshot[] {
    let snapshot = [...questions]
        .sort((a, b) => a.order - b.order)
        .map((question) => ({
            text: question.text,
            options: Array.isArray(question.options)
                ? (question.options as string[])
                : [],
            correctIndex: question.correctIndex,
            questionType: parseQuestionType(question.questionType),
        }));

    if (shuffleQuestions) {
        snapshot = shuffleArray(snapshot);
    }

    if (shuffleAnswers) {
        snapshot = snapshot.map((question) =>
            question.questionType === "tf"
                ? question
                : shuffleQuestionOptions(question),
        );
    }

    return snapshot;
}

/** Rematch: reshuffle only components whose mode is `eachRepetition`. */
export function reshuffleForRepetition(
    currentSnapshot: QuestionSnapshot[],
    {
        answerShuffleMode,
        questionShuffleMode,
    }: {
        answerShuffleMode: ShuffleMode;
        questionShuffleMode: ShuffleMode;
    },
): QuestionSnapshot[] {
    let snapshot = [...currentSnapshot];

    if (questionShuffleMode === "eachRepetition") {
        snapshot = shuffleArray(snapshot);
    }

    if (answerShuffleMode === "eachRepetition") {
        snapshot = snapshot.map((question) =>
            question.questionType === "tf"
                ? question
                : shuffleQuestionOptions(question),
        );
    }

    return snapshot;
}

export function formatCode(code: string): string {
    const sanitized = sanitizeCodeInput(code);
    if (sanitized.length <= 3) return sanitized;
    return `${sanitized.slice(0, 3)}—${sanitized.slice(3)}`;
}
