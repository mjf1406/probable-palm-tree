import { Badge } from "@/components/ui/badge";
import { GAME_DIFFICULTY_LABELS, type GameDifficulty } from "@/lib/game";
import { cn } from "@/lib/utils";

const DIFFICULTY_STYLES: Record<GameDifficulty, string> = {
  easy: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  hard: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: GameDifficulty;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(DIFFICULTY_STYLES[difficulty], className)}
    >
      {GAME_DIFFICULTY_LABELS[difficulty]}
    </Badge>
  );
}
