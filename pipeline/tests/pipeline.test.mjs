import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after, before } from "node:test";
import { fileURLToPath } from "node:url";
import { generateFixtureDraft } from "../lib/fixture-provider.mjs";
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
