import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ANSWER_OPTIONS } from "@/lib/game";
import { cn } from "@/lib/utils";

type AnswerOptionProps = {
  index: number;
  text: string;
  variant: "interactive" | "static";
  disabled?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  className?: string;
  fullHeight?: boolean;
};

export function AnswerOption({
  index,
  text,
  variant,
  disabled,
  highlighted,
  onClick,
  className,
  fullHeight,
}: AnswerOptionProps) {
  const option = ANSWER_OPTIONS[index] ?? ANSWER_OPTIONS[0];
  const Shape = option.shape;

  const content = (
    <>
      <Shape
        className="size-6 shrink-0 fill-white/30 stroke-white"
        aria-hidden
      />
      <span className="flex-1">{text}</span>
    </>
  );

  const optionClasses = cn(
    "flex min-h-0 w-full items-center gap-3 rounded-lg px-4 py-4 text-left text-base font-medium text-white",
    option.color,
    variant === "interactive" && option.hoverColor,
    highlighted && "ring-4 ring-white/50",
    fullHeight ? "h-full" : undefined,
    className,
  );

  if (variant === "interactive") {
    return (
      <Button
        type="button"
        className={cn(optionClasses, "justify-start")}
        disabled={disabled}
        onClick={onClick}
        aria-label={`${option.label}: ${text}`}
      >
        {content}
      </Button>
    );
  }

  return (
    <div className={optionClasses} aria-label={`${option.label}: ${text}`}>
      {content}
    </div>
  );
}

type AnswerOptionGridProps = {
  children: ReactNode;
  optionCount: number;
  className?: string;
};

const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

export function AnswerOptionGrid({
  children,
  optionCount,
  className,
}: AnswerOptionGridProps) {
  const columns = Math.min(Math.max(optionCount, 1), 4);

  return (
    <div className={cn("grid gap-2", GRID_COLS[columns], className)}>
      {children}
    </div>
  );
}

export function AnswerStatusFooter({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "col-span-full flex min-h-10 items-center justify-center text-center text-sm text-muted-foreground",
        !message && "invisible",
        className,
      )}
      aria-live="polite"
    >
      {message ?? "\u00a0"}
    </p>
  );
}
