/** @format */

import type { LucideIcon } from "lucide-react";
import { Circle, Diamond, Square, Triangle } from "lucide-react";
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
];

export type GameType = "submarine" | "robot";
export type GameStatus = "lobby" | "playing" | "won" | "lost";

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
    return value.filter(
        (item): item is QuestionSnapshot =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as QuestionSnapshot).text === "string" &&
            Array.isArray((item as QuestionSnapshot).options) &&
            typeof (item as QuestionSnapshot).correctIndex === "number",
    );
}

export function formatCode(code: string): string {
    const sanitized = sanitizeCodeInput(code);
    if (sanitized.length <= 3) return sanitized;
    return `${sanitized.slice(0, 3)}—${sanitized.slice(3)}`;
}
