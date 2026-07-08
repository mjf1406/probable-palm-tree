/** @format */

import { useEffect, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIconPickerLazy } from "@/components/icons/FontAwesomeIconPickerLazy";
import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AVATAR_COLORS, type AvatarColorId } from "@/lib/player-avatars";
import {
    iconIdFromDefinition,
    resolveIconId,
} from "@/lib/fontawesome-icon-catalog";
import { updatePlayerAppearance } from "@/lib/useHostGameEngine";
import { cn } from "@/lib/utils";

type PlayerCustomizationProps = {
    playerId: string;
    nickname: string;
    iconId?: string | null;
    avatarColor?: string | null;
};

export function PlayerCustomization({
    playerId,
    nickname,
    iconId,
    avatarColor,
}: PlayerCustomizationProps) {
    const [selectedIcon, setSelectedIcon] = useState<IconDefinition | null>(
        null,
    );
    const [selectedColor, setSelectedColor] = useState<AvatarColorId | null>(
        (avatarColor as AvatarColorId | null) ?? null,
    );
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!iconId) {
            setSelectedIcon(null);
            return;
        }
        void resolveIconId(iconId).then((icon) => {
            if (icon) setSelectedIcon(icon);
        });
    }, [iconId]);

    useEffect(() => {
        setSelectedColor((avatarColor as AvatarColorId | null) ?? null);
    }, [avatarColor]);

    const persistAppearance = async (next: {
        iconId?: string | null;
        avatarColor?: string | null;
    }) => {
        setIsSaving(true);
        try {
            await updatePlayerAppearance(playerId, next);
        } finally {
            setIsSaving(false);
        }
    };

    const handleIconChange = (icon: IconDefinition) => {
        setSelectedIcon(icon);
        void persistAppearance({ iconId: iconIdFromDefinition(icon) });
    };

    const handleColorChange = (colorId: AvatarColorId) => {
        setSelectedColor(colorId);
        void persistAppearance({ avatarColor: colorId });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Make it yours</CardTitle>
                <CardDescription>
                    Pick an icon and color for your squad badge. The host can
                    start anytime — you can keep tweaking while you wait.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <PlayerAvatar
                        nickname={nickname}
                        iconId={
                            selectedIcon
                                ? iconIdFromDefinition(selectedIcon)
                                : iconId
                        }
                        avatarColor={selectedColor ?? avatarColor}
                        className="size-14"
                        iconClassName="size-7!"
                    />
                    <div>
                        <p className="font-medium">{nickname}</p>
                        <p className="text-sm text-muted-foreground">
                            {isSaving ? "Saving..." : "Preview"}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Icon</Label>
                    <FontAwesomeIconPickerLazy
                        value={selectedIcon}
                        onChange={handleIconChange}
                        className="w-full max-w-none"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex flex-wrap gap-2">
                        {AVATAR_COLORS.map((color) => (
                            <button
                                key={color.id}
                                type="button"
                                aria-label={color.label}
                                className={cn(
                                    "size-9 rounded-full border-2 transition-transform hover:scale-105",
                                    selectedColor === color.id
                                        ? "border-foreground ring-2 ring-foreground/20"
                                        : "border-transparent",
                                )}
                                style={{ backgroundColor: color.value }}
                                onClick={() => handleColorChange(color.id)}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
