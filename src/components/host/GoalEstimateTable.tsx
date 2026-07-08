import { ESTIMATE_PLAYER_COUNTS, ESTIMATE_STREAK_LEVELS, formatDistance, GAME_LEVELS, estimateCorrectAnswersPerPlayer, type GameType } from "@/lib/game";

type GoalEstimateTableProps = {
  gameType: GameType;
  metersPerCorrect: string | number;
  goalMetersOverride?: number | null;
};

export function GoalEstimateTable({
  gameType,
  metersPerCorrect,
  goalMetersOverride,
}: GoalEstimateTableProps) {
  const goalMeters =
    goalMetersOverride ?? GAME_LEVELS[gameType].goalMeters;

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left font-medium text-muted-foreground">
                Players
              </th>
              {ESTIMATE_STREAK_LEVELS.map((streak) => (
                <th
                  key={streak}
                  className="text-right font-medium text-muted-foreground"
                >
                  Streak {streak}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ESTIMATE_PLAYER_COUNTS.map((playerCount) => (
              <tr key={playerCount} className="border-t border-border/50">
                <td className="py-1 pr-2 font-medium">
                  {playerCount} players
                </td>
                {ESTIMATE_STREAK_LEVELS.map((streak) => {
                  const correct = estimateCorrectAnswersPerPlayer(
                    gameType,
                    metersPerCorrect,
                    playerCount,
                    streak,
                  );

                  return (
                    <td
                      key={streak}
                      className="py-1 text-right tabular-nums"
                    >
                      {correct.toLocaleString()}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Correct answers per player to reach the {formatDistance(goalMeters)} goal.
        Assumes everyone keeps the streak shown and contributes equally.
      </p>
    </div>
  );
}

