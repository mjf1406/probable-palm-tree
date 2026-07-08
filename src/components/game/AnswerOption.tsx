import type { ComponentProps } from "react";
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
};

export function AnswerOption({
  index,
  text,
  variant,
  disabled,
  highlighted,
  onClick,
  className,
}: AnswerOptionProps) {
  const option = ANSWER_OPTIONS[index] ?? ANSWER_OPTIONS[0];
  const Shape = option.shape;

  const content = (
    <>
      <Shape
        className="size-5 shrink-0 fill-white/30 stroke-white"
        aria-hidden
      />
      <span className="flex-1">{text}</span>
    </>
  );

  const optionClasses = cn(
    "flex min-h-14 w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium text-white",
    option.color,
    variant === "interactive" && option.hoverColor,
    highlighted && "ring-4 ring-white/50",
    className,
  );

  if (variant === "interactive") {
    return (
      <Button
        type="button"
        className={cn(optionClasses, "h-auto justify-start")}
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

export function AnswerOptionGrid({
  children,
  className,
}: ComponentProps<"div">) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", className)}>{children}</div>
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
