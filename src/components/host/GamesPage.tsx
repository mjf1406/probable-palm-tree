import { Drill, Plane, Rocket, Sailboat, Ship, type LucideIcon } from "lucide-react";
import { DifficultyBadge } from "@/components/game/DifficultyBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GAME_LEVELS,
  SELECTABLE_GAME_TYPES,
  getGameDifficultyBadges,
  formatDistance,
  formatGoalDistance,
  type GameType,
} from "@/lib/game";
import { getDefaultSeaRoute } from "@/lib/seaSailors";

const GAME_ICONS: Record<GameType, LucideIcon> = {
  deepDivers: Ship,
  deepDrillers: Drill,
  highFlyers: Plane,
  seaSailors: Sailboat,
  spaceTravelers: Rocket,
};

const DEFAULT_SEA_ROUTE = getDefaultSeaRoute();

export function GamesPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 px-6 py-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Games</h1>
        <p className="max-w-2xl text-muted-foreground">
          ClassUpGames are distance challenges powered by your quiz decks. Correct
          answers push the squad forward — streaks multiply each push. Pick a game
          when you launch a deck to set the theme and goal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Build or choose a deck of multiple-choice questions.</li>
            <li>Launch the deck and pick one of the games below.</li>
            <li>
              Players answer on their phones; each correct answer moves the
              squad forward (default 10 m per answer, configurable at launch,
              multiplied by streak).
            </li>
            <li>
              Progress through themed levels until time runs out or you reach
              the goal.
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {SELECTABLE_GAME_TYPES.map((type) => {
          const Icon = GAME_ICONS[type.id];
          const levels = GAME_LEVELS[type.id];

          return (
            <Card key={type.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                  <Icon className="size-6 text-primary" />
                  {type.name}
                  {getGameDifficultyBadges(type.id).map((d) => (
                    <DifficultyBadge key={d} difficulty={d} />
                  ))}
                </CardTitle>
                <CardDescription className="text-base">
                  {type.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {type.distanceLabel}
                    </dt>
                    <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">
                      {type.id === "seaSailors"
                        ? `${formatGoalDistance(DEFAULT_SEA_ROUTE.distanceMeters)} goal`
                        : `${formatGoalDistance(levels.goalMeters)} goal`}
                      {type.id === "seaSailors" ? (
                        <div className="mt-1 text-xs font-normal text-muted-foreground">
                          Varies by ocean + departure/destination
                        </div>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Vehicle
                    </dt>
                    <dd className="mt-1 text-lg font-medium capitalize">
                      {type.vehicle}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Levels
                    </dt>
                    <dd className="mt-1 text-lg font-medium">
                      {levels.levels.length} zones
                    </dd>
                  </div>
                </dl>

                <div>
                  <h3 className="mb-3 text-sm font-medium">
                    {type.id === "seaSailors"
                      ? "Route progress"
                      : "Level progression"}
                  </h3>
                  <ul className="divide-y rounded-lg border">
                    {type.id === "seaSailors" ? (
                      <li className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                        <span className="font-medium">
                          0–100% · Route
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                          Start
                        </span>
                      </li>
                    ) : (
                      levels.levels.map((level) => (
                        <li
                          key={level.level}
                          className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
                        >
                          <span className="font-medium">
                            {level.level}. {level.name}
                          </span>
                          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                            {level.startingDistanceMeters === 0
                              ? "Start"
                              : formatDistance(level.startingDistanceMeters)}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
