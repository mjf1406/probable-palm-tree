import type { WorkBook } from "xlsx";
import { sanitizeFilename } from "./download";
import { clampBlooketTime, getMcExportRows, type McExportRow } from "./mc-export";
import type { DeckExportData, ExportFile, ImportedDeck, ImportedQuestion } from "./types";

async function loadXlsx() {
  return import("xlsx");
}

export const BLOOKET_QUESTION_SLOTS = 100;
export const BLOOKET_COLUMN_COUNT = 8;

export const BLOOKET_TITLE_CELL = "Blooket\nImport Template";

export const BLOOKET_TITLE_ROW: string[] = [
  BLOOKET_TITLE_CELL,
  "",
  "",
  "",
  "",
  "",
  "",
  "",
];

export const BLOOKET_HEADER_ROW: string[] = [
  "Question #",
  "Question Text",
  "Answer 1",
  "Answer 2",
  "Answer 3\n(Optional)",
  "Answer 4\n(Optional)",
  "Time Limit (sec)\n(Max: 300 seconds)",
  "Correct Answer(s)\n(Only include Answer #)",
];

function padAnswers(options: string[], count = 4): string[] {
  const padded = options.slice(0, count);
  while (padded.length < count) padded.push("");
  return padded;
}

function padRowTo8(cells: (string | number)[]): string[] {
  const row = cells.map((cell) => String(cell ?? ""));
  while (row.length < BLOOKET_COLUMN_COUNT) row.push("");
  return row.slice(0, BLOOKET_COLUMN_COUNT);
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowsToCsv(sheetData: string[][]): string {
  return sheetData
    .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
    .join("\n");
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
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
      row.push(current);
      current = "";
    } else if (char === "\n") {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    } else if (char !== "\r") {
      current += char;
    }
  }

  if (current || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function parseCorrectAnswerNumbers(value: string, optionCount: number): number[] {
  const indices = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= optionCount)
    .map((n) => n - 1);
  return indices.length > 0 ? indices : [0];
}

function sheetToRows(
  XLSX: Awaited<ReturnType<typeof loadXlsx>>,
  workbook: WorkBook,
): string[][] {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as string[][];
}

function findBlooketHeaderRow(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const first = String(rows[i][0] ?? "").toLowerCase();
    if (first.includes("question #") || first === "question #") {
      return i;
    }
  }
  return -1;
}

function normalizeBlooketOption(value: string): string {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  if (upper === "TRUE") return "True";
  if (upper === "FALSE") return "False";
  return trimmed;
}

function parseBlooketRows(rows: string[][]): ImportedQuestion[] {
  const headerRow = findBlooketHeaderRow(rows);
  if (headerRow < 0) {
    throw new Error("Could not find Blooket header row.");
  }

  const questions: ImportedQuestion[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const questionText = String(row[1] ?? "").trim();
    if (!questionText) continue;

    const rawOptions = [row[2], row[3], row[4], row[5]]
      .map((value) => normalizeBlooketOption(String(value ?? "")))
      .filter(Boolean);
    if (rawOptions.length < 2) continue;

    const correctNumbers = parseCorrectAnswerNumbers(
      String(row[7] ?? "1"),
      rawOptions.length,
    );
    const correctIndex = correctNumbers[0] ?? 0;

    const isTrueFalse =
      rawOptions.length === 2 &&
      rawOptions.every((option) =>
        ["True", "False"].includes(option),
      );

    questions.push({
      text: questionText,
      options: rawOptions,
      correctIndex,
      questionType: isTrueFalse ? "tf" : "mc",
      order: questions.length,
    });
  }

  if (questions.length === 0) {
    throw new Error("No valid questions found in Blooket file.");
  }

  return questions;
}

function formatBlooketAnswers(row: McExportRow): string[] {
  const answers = padAnswers(row.options);
  if (row.questionType !== "tf") {
    return answers;
  }

  return answers.map((answer) => {
    const lower = answer.trim().toLowerCase();
    if (lower === "true") return "TRUE";
    if (lower === "false") return "FALSE";
    return answer;
  });
}

export function buildBlooketSheetRows(deck: DeckExportData): string[][] {
  const mcRows = getMcExportRows(deck);
  const timeLimit = clampBlooketTime(deck.questionTimeSeconds ?? 20);
  const sheetData: string[][] = [BLOOKET_TITLE_ROW, BLOOKET_HEADER_ROW];

  for (let slot = 1; slot <= BLOOKET_QUESTION_SLOTS; slot++) {
    const row = mcRows[slot - 1];
    if (!row) {
      sheetData.push(padRowTo8([slot]));
      continue;
    }

    const answers = formatBlooketAnswers(row);
    const filledAnswerCount = answers.filter(Boolean).length;
    const correct = row.correctIndices
      .map((index) => index + 1)
      .filter((n) => n >= 1 && n <= filledAnswerCount)
      .join(",");

    sheetData.push(
      padRowTo8([
        slot,
        row.text,
        answers[0] ?? "",
        answers[1] ?? "",
        answers[2] ?? "",
        answers[3] ?? "",
        timeLimit,
        correct || "1",
      ]),
    );
  }

  return sheetData;
}

export function exportBlooketCsv(deck: DeckExportData): ExportFile {
  const csv = rowsToCsv(buildBlooketSheetRows(deck));

  return {
    blob: new Blob([csv], { type: "text/csv" }),
    filename: `${sanitizeFilename(deck.title)}.blooket.csv`,
  };
}

export async function parseBlooketXlsx(
  buffer: ArrayBuffer,
): Promise<ImportedDeck> {
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(buffer, { type: "array" });
  const questions = parseBlooketRows(sheetToRows(XLSX, workbook));
  return { title: "Imported Blooket deck", questions };
}

export function parseBlooketCsv(text: string): ImportedDeck {
  const questions = parseBlooketRows(parseCsvRows(text));
  return { title: "Imported Blooket deck", questions };
}

export function isBlooketContent(textOrRows: string | string[][]): boolean {
  const rows =
    typeof textOrRows === "string" ? parseCsvRows(textOrRows) : textOrRows;
  const headerRow = findBlooketHeaderRow(rows);
  if (headerRow < 0) return false;
  const header = rows[headerRow].join(" ").toLowerCase();
  return header.includes("question text") && header.includes("answer 1");
}

export async function isBlooketWorkbook(
  buffer: ArrayBuffer,
): Promise<boolean> {
  try {
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(buffer, { type: "array" });
    return isBlooketContent(sheetToRows(XLSX, workbook));
  } catch {
    return false;
  }
}
