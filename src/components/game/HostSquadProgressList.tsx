import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "@/lib/game";
import { cn } from "@/lib/utils";

export type HostPlayerProgress = {
  player: {
    id: string;
    nickname: string;
    iconId?: string | null;
    avatarColor?: string | null;
  };
  distance: number;
  streak: number;
  questionNumber: number;
  repetition: number;
  totalQuestions: number;
  hasAnsweredCurrent: boolean;
};

type HostSquadProgressListProps = {
  playerProgress: HostPlayerProgress[];
  className?: string;
};

export function HostSquadProgressList({
  playerProgress,
  className,
}: HostSquadProgressListProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {playerProgress.map(
        ({
          player,
          distance,
          streak,
          questionNumber,
          repetition,
          totalQuestions,
          hasAnsweredCurrent,
        }) => (
          <li
            key={player.id}
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <PlayerAvatar
              nickname={player.nickname}
              iconId={player.iconId}
              avatarColor={player.avatarColor}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{player.nickname}</p>
              <p className="text-xs text-muted-foreground">
                Q{questionNumber}/{totalQuestions} · Run {repetition} ·{" "}
                {formatDistance(distance)} pushed
              </p>
            </div>
            <div className="flex items-center gap-2">
              {streak > 0 ? (
                <Badge variant="secondary">x{Math.min(streak, 10)}</Badge>
              ) : null}
              <Badge variant={hasAnsweredCurrent ? "secondary" : "outline"}>
                {hasAnsweredCurrent ? "Answered" : "Playing"}
              </Badge>
            </div>
          </li>
        ),
      )}
    </ul>
  );
}
