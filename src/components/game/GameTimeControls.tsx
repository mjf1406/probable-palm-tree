import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatHMSMilliseconds } from "@/lib/game";
import { cn } from "@/lib/utils";

const MINUTE_SECONDS = 60;

type GameTimeControlsProps = {
  timeRemainingSeconds: number;
  durationSeconds: number;
  onAdjustGameTime?: (deltaSeconds: number) => void;
  label?: string;
  labelClassName?: string;
  timeClassName?: string;
  showProgress?: boolean;
  progressClassName?: string;
  align?: "left" | "right" | "center";
  size?: "default" | "hero";
  buttonClassName?: string;
};

export function GameTimeControls({
  timeRemainingSeconds,
  durationSeconds,
  onAdjustGameTime,
  label = "Time left",
  labelClassName,
  timeClassName,
  showProgress = true,
  progressClassName,
  align = "left",
  size = "default",
  buttonClassName,
}: GameTimeControlsProps) {
  const canAdjust = onAdjustGameTime != null;
  const isHero = size === "hero";

  return (
    <div
      className={cn(
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wider text-muted-foreground",
          isHero && "text-sm",
          labelClassName,
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "mt-1 flex items-center gap-2",
          align === "right" && "justify-end",
          align === "center" && "justify-center",
          isHero && "gap-3",
        )}
      >
        {canAdjust ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "size-8 shrink-0",
              isHero && "size-10",
              buttonClassName,
            )}
            aria-label="Subtract 1 minute"
            onClick={() => onAdjustGameTime(-MINUTE_SECONDS)}
          >
            <Minus className={cn("size-4", isHero && "size-5")} />
          </Button>
        ) : null}
        <p
          className={cn(
            "font-mono font-bold tabular-nums",
            isHero
              ? "text-5xl sm:text-6xl md:text-7xl"
              : "text-3xl",
            timeClassName,
          )}
        >
          {formatHMSMilliseconds(timeRemainingSeconds)}
        </p>
        {canAdjust ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "size-8 shrink-0",
              isHero && "size-10",
              buttonClassName,
            )}
            aria-label="Add 1 minute"
            onClick={() => onAdjustGameTime(MINUTE_SECONDS)}
          >
            <Plus className={cn("size-4", isHero && "size-5")} />
          </Button>
        ) : null}
      </div>
      {showProgress ? (
        <Progress
          value={(timeRemainingSeconds / durationSeconds) * 100}
          className={cn("mt-2 h-1.5", progressClassName)}
        />
      ) : null}
    </div>
  );
}
