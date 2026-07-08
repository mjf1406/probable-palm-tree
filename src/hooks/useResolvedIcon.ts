import { useEffect, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { resolveIconId } from "@/lib/fontawesome-icon-catalog";

type ResolvedIconState = {
    id: string;
    icon: IconDefinition | null;
} | null;

export function useResolvedIcon(
    iconId: string | null | undefined,
): IconDefinition | null {
    const [state, setState] = useState<ResolvedIconState>(null);

    useEffect(() => {
        if (!iconId) return;

        let cancelled = false;
        void resolveIconId(iconId).then((icon) => {
            if (!cancelled) setState({ id: iconId, icon });
        });

        return () => {
            cancelled = true;
        };
    }, [iconId]);

    if (!iconId) return null;
    return state?.id === iconId ? state.icon : null;
}
