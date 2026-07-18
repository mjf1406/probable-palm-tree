import {
  DEFAULT_QUESTION_TIME,
  DEFAULT_SETTING_SCOPE,
  DEFAULT_SHUFFLE_MODE,
  parseAnswerConfig,
  parseQuestionType,
  parseQuestionTimeSeconds,
  parseSettingScope,
  parseShuffleMode,
} from "@/lib/game";
import type { AnswerConfig, QuestionType } from "@/lib/game";
import { sanitizeFilename } from "./download";
import type {
  DeckExportData,
  ImportedDeck,
  ImportedQuestion,
  SquadGamesExportFile,
} from "./types";

const SQUAD_GAMES_FORMAT = "squad-games";
const SQUAD_GAMES_VERSION = 1;

type SquadGamesJson = {
  format: typeof SQUAD_GAMES_FORMAT;
  version: number;
  title: string;
  description?: string;
  settings?: {
    answerShuffleMode?: string;
    questionShuffleMode?: string;
    answerShuffleScope?: string;
    questionShuffleScope?: string;
    questionTimeSeconds?: number;
  };
  questions: Array<{
    text: string;
    questionType: QuestionType;
    options: string[];
    correctIndex?: number | null;
    answerConfig?: AnswerConfig | null;
    order: number;
  }>;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

function buildSquadGamesJson(deck: DeckExportData): SquadGamesJson {
  const sorted = [...deck.questions].sort((a, b) => a.order - b.order);
  return {
    format: SQUAD_GAMES_FORMAT,
    version: SQUAD_GAMES_VERSION,
    title: deck.title,
    description: deck.description?.trim() || undefined,
    settings: {
      answerShuffleMode: parseShuffleMode(deck.answerShuffleMode),
      questionShuffleMode: parseShuffleMode(deck.questionShuffleMode),
      answerShuffleScope: parseSettingScope(deck.answerShuffleScope),
      questionShuffleScope: parseSettingScope(deck.questionShuffleScope),
      questionTimeSeconds: parseQuestionTimeSeconds(deck.questionTimeSeconds),
    },
    questions: sorted.map((question, index) => ({
      text: question.text,
      questionType: parseQuestionType(question.questionType),
      options: Array.isArray(question.options)
        ? question.options.map(String)
        : [],
      correctIndex: question.correctIndex ?? null,
      answerConfig: parseAnswerConfig(
        parseQuestionType(question.questionType),
        question.answerConfig,
      ),
      order: index,
    })),
  };
}

function buildSquadGamesCsv(deck: DeckExportData): string {
  const payload = buildSquadGamesJson(deck);
  const lines: string[] = [
  [
    "format",
    "version",
    "title",
    "description",
    "answerShuffleMode",
    "questionShuffleMode",
    "answerShuffleScope",
    "questionShuffleScope",
    "questionTimeSeconds",
  ].join(","),
  [
    payload.format,
    String(payload.version),
    escapeCsvCell(payload.title),
    escapeCsvCell(payload.description ?? ""),
    payload.settings?.answerShuffleMode ?? "",
    payload.settings?.questionShuffleMode ?? "",
    payload.settings?.answerShuffleScope ?? "",
    payload.settings?.questionShuffleScope ?? "",
    String(payload.settings?.questionTimeSeconds ?? ""),
  ].join(","),
  "order,questionType,text,options,correctIndex,answerConfig",
  ];

  for (const question of payload.questions) {
    lines.push(
      [
        String(question.order),
        question.questionType,
        escapeCsvCell(question.text),
        escapeCsvCell(question.options.join("|")),
        question.correctIndex == null ? "" : String(question.correctIndex),
        escapeCsvCell(
          question.answerConfig ? JSON.stringify(question.answerConfig) : "",
        ),
      ].join(","),
    );
  }

  return lines.join("\n");
}

export function exportSquadGames(deck: DeckExportData): SquadGamesExportFile {
  const baseName = sanitizeFilename(deck.title);
  const jsonText = JSON.stringify(buildSquadGamesJson(deck));
  const csvText = buildSquadGamesCsv(deck);

  const jsonBlob = new Blob([jsonText], { type: "application/json" });
  const csvBlob = new Blob([csvText], { type: "text/csv" });

  if (csvBlob.size < jsonBlob.size) {
    return {
      blob: csvBlob,
      filename: `${baseName}.squad-games.csv`,
      extension: "csv",
    };
  }

  return {
    blob: jsonBlob,
    filename: `${baseName}.squad-games.json`,
    extension: "json",
  };
}

function importedQuestionsFromJson(payload: SquadGamesJson): ImportedQuestion[] {
  return payload.questions
    .filter((question) => question.text.trim())
    .map((question, index) => ({
      text: question.text.trim(),
      options: question.options,
      correctIndex:
        typeof question.correctIndex === "number" ? question.correctIndex : 0,
      questionType: parseQuestionType(question.questionType),
      answerConfig: parseAnswerConfig(
        parseQuestionType(question.questionType),
        question.answerConfig,
      ),
      order: typeof question.order === "number" ? question.order : index,
    }))
    .sort((a, b) => a.order - b.order)
    .map((question, index) => ({ ...question, order: index }));
}

function parseSquadGamesCsv(text: string): ImportedDeck {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 3) {
    throw new Error("Invalid ClassUpGames CSV file.");
  }

  const meta = parseCsvLine(lines[1]);
  const title = meta[2]?.trim();
  if (!title) throw new Error("ClassUpGames CSV is missing a deck title.");

  const questions: ImportedQuestion[] = [];
  for (let i = 3; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 4) continue;
    const questionType = parseQuestionType(cells[1]);
    const textValue = cells[2]?.trim();
    if (!textValue) continue;
    const options = cells[3] ? cells[3].split("|").map((s) => s.trim()) : [];
    const correctIndex = cells[4] ? Number(cells[4]) : 0;
    const answerConfig = cells[5]
      ? parseAnswerConfig(questionType, JSON.parse(cells[5]))
      : undefined;

    questions.push({
      text: textValue,
      options,
      correctIndex: Number.isFinite(correctIndex) ? correctIndex : 0,
      questionType,
      answerConfig,
      order: Number(cells[0]) || questions.length,
    });
  }

  if (questions.length === 0) {
    throw new Error("No questions found in ClassUpGames CSV.");
  }

  return {
    title,
    description: meta[3]?.trim() || undefined,
    answerShuffleMode: parseShuffleMode(meta[4] || DEFAULT_SHUFFLE_MODE),
    questionShuffleMode: parseShuffleMode(meta[5] || DEFAULT_SHUFFLE_MODE),
    answerShuffleScope: parseSettingScope(meta[6] || DEFAULT_SETTING_SCOPE),
    questionShuffleScope: parseSettingScope(meta[7] || DEFAULT_SETTING_SCOPE),
    questionTimeSeconds: parseQuestionTimeSeconds(
      meta[8] ? Number(meta[8]) : DEFAULT_QUESTION_TIME,
    ),
    questions: questions
      .sort((a, b) => a.order - b.order)
      .map((question, index) => ({ ...question, order: index })),
  };
}

export function parseSquadGamesJson(text: string): ImportedDeck {
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Invalid ClassUpGames JSON file.");
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    (payload as { format?: string }).format !== SQUAD_GAMES_FORMAT
  ) {
    throw new Error("Unrecognized ClassUpGames JSON format.");
  }

  const data = payload as SquadGamesJson;
  if (!data.title?.trim()) {
    throw new Error("ClassUpGames JSON is missing a deck title.");
  }

  const questions = importedQuestionsFromJson(data);
  if (questions.length === 0) {
    throw new Error("No questions found in ClassUpGames JSON.");
  }

  return {
    title: data.title.trim(),
    description: data.description?.trim() || undefined,
    answerShuffleMode: parseShuffleMode(
      data.settings?.answerShuffleMode ?? DEFAULT_SHUFFLE_MODE,
    ),
    questionShuffleMode: parseShuffleMode(
      data.settings?.questionShuffleMode ?? DEFAULT_SHUFFLE_MODE,
    ),
    answerShuffleScope: parseSettingScope(
      data.settings?.answerShuffleScope ?? DEFAULT_SETTING_SCOPE,
    ),
    questionShuffleScope: parseSettingScope(
      data.settings?.questionShuffleScope ?? DEFAULT_SETTING_SCOPE,
    ),
    questionTimeSeconds: parseQuestionTimeSeconds(
      data.settings?.questionTimeSeconds ?? DEFAULT_QUESTION_TIME,
    ),
    questions,
  };
}

export function parseSquadGames(text: string, filename: string): ImportedDeck {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) {
    return parseSquadGamesCsv(text);
  }
  return parseSquadGamesJson(text);
}

export function isSquadGamesJson(text: string): boolean {
  try {
    const payload = JSON.parse(text) as { format?: string };
    return payload.format === SQUAD_GAMES_FORMAT;
  } catch {
    return false;
  }
}

export function isSquadGamesCsv(text: string): boolean {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/)[0]?.trim();
  return firstLine === "format,version,title,description,answerShuffleMode,questionShuffleMode,answerShuffleScope,questionShuffleScope,questionTimeSeconds";
}
