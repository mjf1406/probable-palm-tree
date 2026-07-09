import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { resolveIconId } from "@/lib/fontawesome-icon-catalog";

export function useResolvedIcon(
    iconId: string | null | undefined,
): IconDefinition | null {
    if (!iconId) return null;
    return resolveIconId(iconId);
}
