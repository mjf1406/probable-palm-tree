import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getExportPreview } from "../src/lib/deck-import-export/mc-export";
import {
  BLOOKET_COLUMN_COUNT,
  BLOOKET_HEADER_ROW,
  BLOOKET_QUESTION_SLOTS,
  BLOOKET_TITLE_CELL,
  BLOOKET_TITLE_ROW,
  buildBlooketSheetRows,
  exportBlooketCsv,
  parseBlooketCsv,
  parseBlooketXlsx,
  parseCsvRows,
} from "../src/lib/deck-import-export/blooket";
import { parseGimkit } from "../src/lib/deck-import-export/gimkit";
import { parseKahoot } from "../src/lib/deck-import-export/kahoot";
import {
  exportSquadGames,
  parseSquadGamesJson,
} from "../src/lib/deck-import-export/squad-games";
import type { DeckExportData } from "../src/lib/deck-import-export/types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../src/lib/deck-import-export/__fixtures__");

const sampleDeck: DeckExportData = {
  title: "Test deck",
  description: "A sample deck",
  questionTimeSeconds: 20,
  questions: [
    {
      text: "What is 2 + 2?",
      options: ["3", "4", "5"],
      correctIndex: 1,
      order: 0,
      questionType: "mc",
    },
    {
      text: "The sky is blue.",
      options: ["True", "False"],
      correctIndex: 0,
      order: 1,
      questionType: "tf",
    },
    {
      text: "Type the word hello",
      options: [],
      order: 2,
      questionType: "typeIn",
      answerConfig: { correctText: "hello" },
    },
  ],
};

function testExportPreview() {
  const preview = getExportPreview(sampleDeck);
  assert.equal(preview.totalQuestions, 3);
  assert.equal(preview.exportableCount, 2);
  assert.equal(preview.skippedByType.typeIn, 1);
  assert.equal(preview.invalidMcCount, 0);
}

function testSquadGamesRoundTrip() {
  const exported = exportSquadGames(sampleDeck);
  assert.ok(
    exported.extension === "json" || exported.extension === "csv",
    "expected json or csv export",
  );

  const jsonFile = exportSquadGames({
    ...sampleDeck,
    title: "JSON deck",
    questions: sampleDeck.questions,
  });
  if (jsonFile.extension === "json") {
    const text = new TextDecoder().decode(
      new Uint8Array(awaitBlob(jsonFile.blob)),
    );
    const imported = parseSquadGamesJson(text);
    assert.equal(imported.title, "JSON deck");
    assert.equal(imported.questions.length, 3);
    assert.equal(imported.questions[2].questionType, "typeIn");
  }
}

async function awaitBlob(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

function testSquadGamesSizeSelection() {
  const tinyDeck: DeckExportData = {
    title: "Tiny",
    questions: [
      {
        text: "A?",
        options: ["1", "2"],
        correctIndex: 0,
        order: 0,
        questionType: "mc",
      },
    ],
  };
  const result = exportSquadGames(tinyDeck);
  assert.ok(result.blob.size > 0);
  assert.match(result.filename, /\.squad-games\.(json|csv)$/);
}

function testGimkitFixture() {
  const text = readFileSync(join(fixturesDir, "gimkit-template.csv"), "utf8");
  const imported = parseGimkit(text);
  assert.equal(imported.questions.length, 1);
  assert.equal(imported.questions[0]?.text, "question 1");
  assert.equal(imported.questions[0]?.correctIndex, 0);
}

async function testKahootFixture() {
  const buffer = readFileSync(join(fixturesDir, "kahoot-template.xlsx"));
  const imported = await parseKahoot(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
  assert.equal(imported.questions.length, 1);
  assert.equal(imported.questions[0]?.text, "Which spreadsheet tools can read this sheet and export to xlsx format?");
  assert.equal(imported.questions[0]?.options.length, 4);
}

async function testBlooketCsvExportStructure() {
  const rows = buildBlooketSheetRows(sampleDeck);
  assert.equal(rows.length, 2 + BLOOKET_QUESTION_SLOTS);
  assert.deepEqual(rows[0], BLOOKET_TITLE_ROW);
  assert.deepEqual(rows[1], BLOOKET_HEADER_ROW);
  for (const row of rows) {
    assert.equal(row.length, BLOOKET_COLUMN_COUNT);
  }
  assert.equal(rows[2]?.[0], "1");
  assert.equal(rows[3]?.[2], "TRUE");
  assert.equal(rows[3]?.[3], "FALSE");
  assert.equal(rows[101]?.[0], "100");
  assert.equal(rows[101]?.[1], "");
}

async function testBlooketCsvExportRoundTrip() {
  const exported = exportBlooketCsv(sampleDeck);
  assert.equal(exported.filename.endsWith(".blooket.csv"), true);
  const text = new TextDecoder().decode(
    new Uint8Array(await exported.blob.arrayBuffer()),
  );
  const parsedRows = parseCsvRows(text);
  assert.equal(parsedRows.length, 2 + BLOOKET_QUESTION_SLOTS);
  assert.equal(parsedRows[0]?.[0], BLOOKET_TITLE_CELL);
  const imported = parseBlooketCsv(text);
  assert.equal(imported.questions.length, 2);
  assert.equal(imported.questions[1]?.questionType, "tf");
}

function testBlooketGoogleSheetsFixture() {
  const text = readFileSync(
    join(fixturesDir, "blooket-google-sheets.csv"),
    "utf8",
  );
  const imported = parseBlooketCsv(text);
  assert.equal(imported.questions.length, 4);
  assert.equal(imported.questions[0]?.text, "What is the capital of France?");
  assert.equal(imported.questions[1]?.correctIndex, 2);
  assert.equal(imported.questions[2]?.options?.[0], "True");
  assert.equal(imported.questions[2]?.options?.[1], "False");
}

async function testBlooketFixture() {
  const buffer = readFileSync(join(fixturesDir, "blooket-template.xlsx"));
  const imported = await parseBlooketXlsx(
    buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
  );
  assert.equal(imported.questions.length, 2);
  assert.equal(imported.questions[0]?.text, "What's 2 + 2?");
  assert.equal(imported.questions[0]?.correctIndex, 0);
  assert.equal(imported.questions[1]?.correctIndex, 1);
}

async function main() {
  testExportPreview();
  await testSquadGamesRoundTrip();
  testSquadGamesSizeSelection();
  testGimkitFixture();
  await testKahootFixture();
  await testBlooketCsvExportStructure();
  await testBlooketCsvExportRoundTrip();
  testBlooketGoogleSheetsFixture();
  await testBlooketFixture();

  console.log("All deck import/export tests passed.");
}

void main();