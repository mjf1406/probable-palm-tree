import { FontAwesomeIconFromId } from "@/components/icons/FontAwesomeIconFromId";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DEFAULT_AVATAR_COLOR,
  getAvatarColorValue,
  getInitials,
} from "@/lib/player-avatars";
import { cn } from "@/lib/utils";

type PlayerAvatarProps = {
  nickname: string;
  iconId?: string | null;
  avatarColor?: string | null;
  className?: string;
  iconClassName?: string;
};

export function PlayerAvatar({
  nickname,
  iconId,
  avatarColor,
  className,
  iconClassName,
}: PlayerAvatarProps) {
  const backgroundColor = getAvatarColorValue(avatarColor);

  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor }}
      >
        {iconId ? (
          <FontAwesomeIconFromId
            id={iconId}
            className={cn("size-5", iconClassName)}
            fallback={getInitials(nickname)}
          />
        ) : (
          getInitials(nickname)
        )}
      </AvatarFallback>
    </Avatar>
  );
}

export function PlayerAvatarPlaceholder({ className }: { className?: string }) {
  return (
    <Avatar className={cn("size-10", className)}>
      <AvatarFallback
        className="font-semibold text-white"
        style={{ backgroundColor: DEFAULT_AVATAR_COLOR }}
      >
        ?
      </AvatarFallback>
    </Avatar>
  );
}
