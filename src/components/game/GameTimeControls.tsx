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
  align?: "left" | "right";
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
  buttonClassName,
}: GameTimeControlsProps) {
  const canAdjust = onAdjustGameTime != null;

  return (
    <div className={cn(align === "right" && "text-right")}>
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wider text-muted-foreground",
          labelClassName,
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "mt-1 flex items-center gap-2",
          align === "right" && "justify-end",
        )}
      >
        {canAdjust ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn("size-8 shrink-0", buttonClassName)}
            aria-label="Subtract 1 minute"
            onClick={() => onAdjustGameTime(-MINUTE_SECONDS)}
          >
            <Minus className="size-4" />
          </Button>
        ) : null}
        <p
          className={cn(
            "font-mono text-3xl font-bold tabular-nums",
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
            className={cn("size-8 shrink-0", buttonClassName)}
            aria-label="Add 1 minute"
            onClick={() => onAdjustGameTime(MINUTE_SECONDS)}
          >
            <Plus className="size-4" />
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
