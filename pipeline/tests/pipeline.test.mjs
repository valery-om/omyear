import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { generateFixtureDraft } from "../lib/fixture-provider.mjs";
import { hydrateDraft } from "../lib/hydrate-draft.mjs";
import { compileBook } from "../lib/compile-book.mjs";
import { buildDraftPrompt } from "../lib/prompt.mjs";
import { calculationForSegment, DRAFT_SEGMENTS, mergeDraftSegments, schemaForSegment } from "../lib/segment-draft.mjs";
import { validateInput } from "../lib/validate.mjs";
import { verifyDraft } from "../lib/verify.mjs";

const pipelineDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const projectRoot = path.dirname(pipelineDir);
const input = JSON.parse(fs.readFileSync(path.join(pipelineDir, "examples", "maya.json"), "utf8"));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "omyear-pipeline-test-"));
const calculationPath = path.join(tempDir, "calc.json");
let calculation;

before(() => {
  const result = spawnSync("python3", [
    path.join(pipelineDir, "engines", "calculate.py"),
    "--input", path.join(pipelineDir, "examples", "maya.json"),
    "--output", calculationPath,
  ], { cwd: projectRoot, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  calculation = JSON.parse(fs.readFileSync(calculationPath, "utf8"));
});

after(() => fs.rmSync(tempDir, { recursive: true, force: true }));

test("synthetic input is valid", () => {
  assert.deepEqual(validateInput(input), { valid: true, errors: [] });
});

test("deterministic result exposes a complete source registry", () => {
  assert.equal(calculation.periods.length, 12);
  assert.equal(calculation.astrocartography.locations.length, 4);
  assert.ok(calculation.sources.length >= 60);
  assert.equal(calculation.numerology.lifePath.value, 4);
});

test("fixture draft passes provenance verification", () => {
  const draft = generateFixtureDraft(input, calculation);
  const result = verifyDraft(draft, calculation);
  assert.equal(result.status, "needs_human_review");
  assert.deepEqual(result.invalidSourceIds, []);
  assert.deepEqual(result.missingSourcePaths, []);
  assert.deepEqual(result.structuralErrors, []);
  assert.deepEqual(result.contentWarnings, []);
});

test("fixture provider completes the full artifact pipeline", () => {
  const runDir = path.join(tempDir, "e2e-run");
  const result = spawnSync("node", [
    path.join(pipelineDir, "run.mjs"),
    "--input", path.join(pipelineDir, "examples", "maya.json"),
    "--provider", "fixture",
    "--run-dir", runDir,
    "--skip-build",
    "--no-install",
  ], { cwd: projectRoot, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const report = JSON.parse(fs.readFileSync(path.join(runDir, "run-report.json"), "utf8"));
  const book = JSON.parse(fs.readFileSync(path.join(runDir, "book.json"), "utf8"));
  assert.equal(report.status, "needs_human_review");
  assert.deepEqual(report.stages.map((stage) => stage.status), Array(5).fill("completed"));
  assert.equal(book.person.publicDemo, true);
  assert.equal(book.provenance.sourceCount, 72);
  assert.equal(book.provenance.verification.invalidSourceIds.length, 0);
});

test("Russian output keeps the same calculations and localizes the book chrome", () => {
  const russianInput = structuredClone(input);
  russianInput.project.language = "ru";
  russianInput.person.name = "Майя";
  const draft = generateFixtureDraft(russianInput, calculation);
  const verification = verifyDraft(draft, calculation);
  const book = compileBook({ input: russianInput, calculation, draft, verification, model: "fixture" });
  assert.equal(book.person.language, "ru");
  assert.equal(book.months.heading, "Двенадцать глав твоего года");
  assert.match(book.months.items[0].month, /[а-яё]/i);
  assert.match(book.places.cities[0].line, / км/);
  assert.doesNotMatch(book.places.cities[0].line, / km/);
  const russianPrompt = buildDraftPrompt(russianInput, calculation);
  assert.match(russianPrompt, /complete Russian editorial draft/);
  assert.match(russianPrompt, /address the reader consistently as “ты”/);
  assert.match(russianPrompt, /not as a translator/);
  assert.match(russianPrompt, /never leave English prepositions/);
  assert.match(russianPrompt, /never substitute generic brevity/);
  assert.match(russianPrompt, /The letter is the editorial finale/);
  assert.match(russianPrompt, /letter is the only section/);
  assert.match(russianPrompt, /matrix has six items/);
});

test("verifier flags certainty language in Russian", () => {
  const draft = generateFixtureDraft(input, calculation);
  draft.opening.paragraphs[0].text += " Это гарантировано.";
  const verification = verifyDraft(draft, calculation);
  assert.ok(verification.contentWarnings.some((warning) => warning.code === "certainty_ru"));
});

test("code hydrates deterministic fields before provenance verification", () => {
  const modelDraft = generateFixtureDraft(input, calculation);
  modelDraft.numbers.items[0].value = "999";
  modelDraft.matrix.items[0].arcana = "999";
  modelDraft.matrix.items[0].name = "Маг";
  modelDraft.months[0].period = "translated period";
  modelDraft.twelveDays.items[0].date = "2099-01-01";
  modelDraft.places.locations[0].line = "translated line";
  const draft = hydrateDraft(modelDraft, calculation);
  const verification = verifyDraft(draft, calculation);
  assert.equal(verification.status, "needs_human_review");
  assert.deepEqual(verification.structuralErrors, []);
  assert.equal(draft.matrix.items[0].name, "Маг");
});

test("parallel draft segments cover the complete strict schema", () => {
  const schema = JSON.parse(fs.readFileSync(path.join(pipelineDir, "schemas", "draft.schema.json"), "utf8"));
  const covered = DRAFT_SEGMENTS.flatMap((segment) => segment.keys).sort();
  assert.deepEqual(covered, [...schema.required].sort());
  const fixture = generateFixtureDraft(input, calculation);
  const results = DRAFT_SEGMENTS.map((segment) => {
    const segmentSchema = schemaForSegment(schema, segment);
    assert.deepEqual(segmentSchema.required, segment.keys);
    assert.ok(calculationForSegment(calculation, segment).sources.length < calculation.sources.length);
    return { draft: Object.fromEntries(segment.keys.map((key) => [key, fixture[key]])) };
  });
  assert.deepEqual(mergeDraftSegments(results), fixture);
});
