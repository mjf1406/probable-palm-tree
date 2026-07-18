import type { WorkBook } from "xlsx";
import { sanitizeFilename } from "./download";
import { clampKahootTime, getMcExportRows } from "./mc-export";
import type { DeckExportData, ExportFile, ImportedDeck, ImportedQuestion } from "./types";

const KAHOOT_ALLOWED_TIMES = [5, 10, 20, 30, 60, 90, 120, 240];

async function loadXlsx() {
  return import("xlsx");
}

function padAnswers(options: string[], count = 4): string[] {
  const padded = options.slice(0, count);
  while (padded.length < count) padded.push("");
  return padded;
}

function parseCorrectIndices(value: string, maxAnswers: number): number[] {
  const indices = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= maxAnswers)
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

function findKahootHeaderRow(rows: string[][]): number {
  for (let i = 0; i < rows.length; i++) {
    const joined = rows[i].join(" ").toLowerCase();
    if (
      joined.includes("question") &&
      joined.includes("answer 1") &&
      joined.includes("correct answer")
    ) {
      return i;
    }
  }
  return -1;
}

export async function exportKahootXlsx(deck: DeckExportData): Promise<ExportFile> {
  const XLSX = await loadXlsx();
  const rows = getMcExportRows(deck);
  const timeLimit = clampKahootTime(deck.questionTimeSeconds ?? 20);
  const sheetData: (string | number)[][] = [
    [],
    ["", "Quiz template"],
    [
      "",
      "Add questions, at least two answer alternatives, time limit and choose correct answers (at least one). Have fun creating your awesome quiz!",
    ],
    [
      "",
      "Remember: questions have a limit of 120 characters and answers can have 75 characters max. Text will turn red in Excel or Google Docs if you exceed this limit. If several answers are correct, separate them with a comma.",
    ],
    [
      "",
      "See an example question below (don't forget to overwrite this with your first question!)",
    ],
    [
      "",
      "And remember,  if you're not using Excel you need to export to .xlsx format before you upload to Kahoot!",
    ],
    [],
    [
      "",
      "Question - max 120 characters",
      "Answer 1 - max 75 characters",
      "Answer 2 - max 75 characters",
      "Answer 3 - max 75 characters",
      "Answer 4 - max 75 characters",
      "Time limit (sec) – 5, 10, 20, 30, 60, 90, 120, or 240 secs",
      "Correct answer(s) - choose at least one",
    ],
  ];

  rows.forEach((row, index) => {
    const answers = padAnswers(row.options);
    const correct = row.correctIndices
      .map((i) => i + 1)
      .filter((n) => n >= 1 && n <= answers.filter(Boolean).length)
      .join(",");
    sheetData.push([
      index + 1,
      row.text.slice(0, 120),
      answers[0]?.slice(0, 75) ?? "",
      answers[1]?.slice(0, 75) ?? "",
      answers[2]?.slice(0, 75) ?? "",
      answers[3]?.slice(0, 75) ?? "",
      timeLimit,
      correct || "1",
    ]);
  });

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

  return {
    blob: new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    filename: `${sanitizeFilename(deck.title)}.kahoot.xlsx`,
  };
}

export async function parseKahoot(buffer: ArrayBuffer): Promise<ImportedDeck> {
  const XLSX = await loadXlsx();
  const workbook = XLSX.read(buffer, { type: "array" });
  const rows = sheetToRows(XLSX, workbook);
  const headerRow = findKahootHeaderRow(rows);
  if (headerRow < 0) {
    throw new Error("Could not find Kahoot header row.");
  }

  const questions: ImportedQuestion[] = [];
  for (let i = headerRow + 1; i < rows.length; i++) {
    const row = rows[i];
    const questionText = String(row[1] ?? "").trim();
    if (!questionText) continue;

    const options = [row[2], row[3], row[4], row[5]]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
    if (options.length < 2) continue;

    const correctIndices = parseCorrectIndices(String(row[7] ?? "1"), options.length);
    const correctIndex = correctIndices[0] ?? 0;

    questions.push({
      text: questionText,
      options,
      correctIndex,
      questionType: "mc",
      order: questions.length,
    });
  }

  if (questions.length === 0) {
    throw new Error("No valid questions found in Kahoot file.");
  }

  return {
    title: "Imported Kahoot deck",
    questions,
  };
}

export async function isKahootWorkbook(buffer: ArrayBuffer): Promise<boolean> {
  try {
    const XLSX = await loadXlsx();
    const workbook = XLSX.read(buffer, { type: "array" });
    const rows = sheetToRows(XLSX, workbook);
    return findKahootHeaderRow(rows) >= 0;
  } catch {
    return false;
  }
}

export { KAHOOT_ALLOWED_TIMES };
