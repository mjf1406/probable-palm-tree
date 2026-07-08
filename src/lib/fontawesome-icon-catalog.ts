import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";

function kebabToExportName(kebab: string): string {
  const camel = kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  return `fa${camel}`;
}

const iconCache = new Map<string, IconDefinition>();

export function iconIdFromDefinition(icon: IconDefinition): string {
  return `${icon.prefix}:${icon.iconName}`;
}

export async function resolveIconId(id: string): Promise<IconDefinition | null> {
  const cached = iconCache.get(id);
  if (cached) return cached;

  const [prefix, iconName] = id.split(":");
  if (!prefix || !iconName) return null;

  const exportName = kebabToExportName(iconName);
  const pack = prefix === "far" ? far : fas;
  const icon = pack[exportName as keyof typeof pack] as IconDefinition | undefined;

  if (!icon) return null;

  iconCache.set(id, icon);
  return icon;
}
