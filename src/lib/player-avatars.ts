export const AVATAR_COLORS = [
  { id: "red", value: "#ef4444", label: "Red" },
  { id: "orange", value: "#f97316", label: "Orange" },
  { id: "amber", value: "#f59e0b", label: "Amber" },
  { id: "green", value: "#22c55e", label: "Green" },
  { id: "teal", value: "#14b8a6", label: "Teal" },
  { id: "blue", value: "#3b82f6", label: "Blue" },
  { id: "indigo", value: "#6366f1", label: "Indigo" },
  { id: "purple", value: "#a855f7", label: "Purple" },
  { id: "pink", value: "#ec4899", label: "Pink" },
  { id: "slate", value: "#64748b", label: "Slate" },
] as const;

export type AvatarColorId = (typeof AVATAR_COLORS)[number]["id"];

export const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[5].value;

export function getAvatarColorValue(colorId?: string | null): string {
  const match = AVATAR_COLORS.find((color) => color.id === colorId);
  return match?.value ?? colorId ?? DEFAULT_AVATAR_COLOR;
}

export function getInitials(nickname: string) {
  return nickname
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
