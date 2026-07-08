import { Drill, Plane, Ship, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  GAME_LEVELS,
  formatDistance,
  getLevelForDistance,
  getLevelProgress,
  type GameType,
} from "@/lib/game";
import { cn } from "@/lib/utils";

type DistanceGameVisualProps = {
  gameType: GameType;
  distanceMeters: number;
  timeRemainingSeconds: number;
  durationSeconds: number;
  bestDistanceMeters?: number | null;
  distanceLabel?: string;
  className?: string;
};

const VEHICLE_ICONS = {
  submarine: Ship,
  drill: Drill,
  rocket: Plane,
} as const;

const LEVEL_COLORS = [
  "from-sky-400/80 to-sky-600/80",
  "from-blue-500/80 to-blue-700/80",
  "from-indigo-600/80 to-indigo-800/80",
  "from-violet-700/80 to-violet-900/80",
  "from-fuchsia-800/80 to-fuchsia-950/80",
];

function getVehicleIcon(gameType: GameType) {
  const vehicle = gameType === "deepDivers"
    ? "submarine"
    : gameType === "deepDrillers"
      ? "drill"
      : "rocket";
  return VEHICLE_ICONS[vehicle];
}

export function DistanceGameVisual({
  gameType,
  distanceMeters,
  timeRemainingSeconds,
  durationSeconds,
  bestDistanceMeters,
  distanceLabel,
  className,
}: DistanceGameVisualProps) {
  const config = GAME_LEVELS[gameType];
  const { level, progressPercent } = getLevelProgress(gameType, distanceMeters);
  const VehicleIcon = getVehicleIcon(gameType);
  const goalPercent = Math.min(
    100,
    (distanceMeters / config.goalMeters) * 100,
  );
  const bestPercent =
    bestDistanceMeters && bestDistanceMeters > 0
      ? Math.min(100, (bestDistanceMeters / config.goalMeters) * 100)
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 text-white",
        className,
      )}
    >
      <div className="relative z-10 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/60">
              {distanceLabel ?? "Distance"}
            </p>
            <p className="font-mono text-3xl font-bold tabular-nums">
              {formatDistance(distanceMeters)}
            </p>
            <p className="mt-1 text-sm text-white/70">
              Level {level.level}: {level.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-white/60">
              Time left
            </p>
            <p className="font-mono text-3xl font-bold tabular-nums text-sky-300">
              {Math.ceil(timeRemainingSeconds)}s
            </p>
          </div>
        </div>

        <div className="relative h-56 overflow-hidden rounded-xl border border-white/10 bg-black/30">
          <div className="absolute inset-0 flex flex-col">
            {[...config.levels].reverse().map((levelItem, index) => {
              const reverseIndex = config.levels.length - 1 - index;
              const isCurrent = levelItem.level === level.level;
              return (
                <div
                  key={levelItem.level}
                  className={cn(
                    "relative flex flex-1 items-center border-b border-white/10 bg-gradient-to-r px-3 text-xs",
                    LEVEL_COLORS[reverseIndex] ?? LEVEL_COLORS[0],
                    isCurrent && "ring-1 ring-inset ring-white/40",
                  )}
                >
                  <span className="truncate font-medium">
                    L{levelItem.level} · {levelItem.name}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 top-0 border-b-2 border-yellow-300 transition-all duration-700 ease-out"
            style={{ top: `${Math.max(4, 100 - goalPercent)}%` }}
          >
            <div className="absolute -left-1 -top-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-yellow-300 text-slate-900 shadow-lg">
              <VehicleIcon className="size-4" />
            </div>
          </div>

          {bestPercent !== null ? (
            <div
              className="pointer-events-none absolute inset-x-8 border-t border-dashed border-amber-300/80"
              style={{ top: `${Math.max(4, 100 - bestPercent)}%` }}
            >
              <span className="absolute -right-1 -top-4 flex items-center gap-1 rounded bg-amber-300/90 px-1.5 py-0.5 text-[10px] font-semibold text-slate-900">
                <Trophy className="size-3" />
                Best
              </span>
            </div>
          ) : null}

          <div className="absolute bottom-3 left-3 rounded-md bg-black/50 px-2 py-1 text-xs text-white/80">
            Goal: {formatDistance(config.goalMeters)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Level progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2 bg-white/10" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span>Overall goal</span>
            <span>{Math.round(goalPercent)}%</span>
          </div>
          <Progress value={goalPercent} className="h-1.5 bg-white/10" />
        </div>

        {bestDistanceMeters ? (
          <p className="text-xs text-amber-200/90">
            High score to beat: {formatDistance(bestDistanceMeters)}
          </p>
        ) : null}

        <Progress
          value={(timeRemainingSeconds / durationSeconds) * 100}
          className="h-1 bg-white/10"
        />
      </div>
    </div>
  );
}

export function getLevelName(gameType: GameType, distanceMeters: number) {
  return getLevelForDistance(gameType, distanceMeters).name;
}
