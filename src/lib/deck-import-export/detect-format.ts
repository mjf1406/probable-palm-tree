import { isBlooketContent, isBlooketWorkbook, parseBlooketCsv, parseBlooketXlsx } from "./blooket";
import { isGimkitCsv, parseGimkit } from "./gimkit";
import { isKahootWorkbook, parseKahoot } from "./kahoot";
import {
  isSquadGamesCsv,
  isSquadGamesJson,
  parseSquadGames,
} from "./squad-games";
import type { ExportFormat, ImportedDeck } from "./types";

export type DetectedFormat = ExportFormat | "unknown";

export function detectFormatFromFilename(filename: string): DetectedFormat {
  const lower = filename.toLowerCase();
  if (lower.includes("gimkit") && lower.endsWith(".csv")) return "gimkit";
  if (lower.includes("kahoot") && lower.endsWith(".xlsx")) return "kahoot";
  if (lower.includes("blooket")) return "blooket";
  if (lower.includes("squad-games") || lower.includes("squadgames")) {
    return "squad-games";
  }
  if (lower.endsWith(".json")) return "squad-games";
  return "unknown";
}

export async function parseDeckFile(
  file: File,
): Promise<{ format: DetectedFormat; deck: ImportedDeck }> {
  const filename = file.name;
  const lower = filename.toLowerCase();

  if (lower.endsWith(".xlsx")) {
    const buffer = await file.arrayBuffer();
    if (await isKahootWorkbook(buffer)) {
      return { format: "kahoot", deck: await parseKahoot(buffer) };
    }
    if (await isBlooketWorkbook(buffer)) {
      return { format: "blooket", deck: await parseBlooketXlsx(buffer) };
    }
    throw new Error("Unrecognized XLSX file. Expected Kahoot or Blooket format.");
  }

  const text = await file.text();

  if (isSquadGamesJson(text)) {
    return { format: "squad-games", deck: parseSquadGames(text, filename) };
  }
  if (isSquadGamesCsv(text)) {
    return { format: "squad-games", deck: parseSquadGames(text, filename) };
  }
  if (isGimkitCsv(text)) {
    return { format: "gimkit", deck: parseGimkit(text) };
  }
  if (isBlooketContent(text)) {
    return { format: "blooket", deck: parseBlooketCsv(text) };
  }

  const hinted = detectFormatFromFilename(filename);
  if (hinted === "gimkit" && lower.endsWith(".csv")) {
    return { format: "gimkit", deck: parseGimkit(text) };
  }
  if (hinted === "squad-games" && lower.endsWith(".json")) {
    return { format: "squad-games", deck: parseSquadGames(text, filename) };
  }
  if (hinted === "squad-games" && lower.endsWith(".csv")) {
    return { format: "squad-games", deck: parseSquadGames(text, filename) };
  }

  throw new Error(
    "Could not detect deck format. Use ClassUpGames, Kahoot (.xlsx), Blooket (.xlsx/.csv), or Gimkit (.csv).",
  );
}

export function resolveImportedTitle(
  imported: ImportedDeck,
  filename: string,
  overrideTitle?: string,
): string {
  const trimmedOverride = overrideTitle?.trim();
  if (trimmedOverride) return trimmedOverride;
  if (imported.title.trim() && !imported.title.startsWith("Imported ")) {
    return imported.title.trim();
  }
  const stem = filename.replace(/\.[^.]+$/, "").trim();
  return stem || imported.title.trim() || "Imported deck";
}
