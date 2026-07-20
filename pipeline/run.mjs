#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildDraftPrompt } from "./lib/prompt.mjs";
import { compileBook } from "./lib/compile-book.mjs";
import { generateWithCodex } from "./lib/codex-provider.mjs";
import { generateFixtureDraft } from "./lib/fixture-provider.mjs";
import { generateWithOpenAI } from "./lib/openai-provider.mjs";
import { readJson, validateInput } from "./lib/validate.mjs";
import { verifyDraft } from "./lib/verify.mjs";

const pipelineDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(pipelineDir);

function parseArgs(argv) {
  const options = { provider: "openai", model: "gpt-5.6-sol", build: true, install: true };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input") options.input = argv[++index];
    else if (value === "--provider") options.provider = argv[++index];
    else if (value === "--model") options.model = argv[++index];
    else if (value === "--run-dir") options.runDir = argv[++index];
    else if (value === "--skip-build") options.build = false;
    else if (value === "--no-install") options.install = false;
    else throw new Error(`Unknown option: ${value}`);
  }
  if (!options.input) throw new Error("Usage: node pipeline/run.mjs --input <file> [--provider openai|codex|fixture]");
  if (!["openai", "codex", "fixture"].includes(options.provider)) throw new Error("--provider must be openai, codex, or fixture");
  return options;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code}`)));
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(options.input);
  const input = readJson(inputPath);
  const runDir = path.resolve(options.runDir || path.join(pipelineDir, "runs", `${timestamp()}-${input.person?.id || "unknown"}`));
  const report = {
    schemaVersion: "1.0.0",
    runId: path.basename(runDir),
    status: "running",
    provider: options.provider,
    model: options.provider === "fixture" ? "fixture" : options.model,
    startedAt: new Date().toISOString(),
    stages: [],
  };

  const reportPath = path.join(runDir, "run-report.json");
  fs.mkdirSync(runDir, { recursive: true });
  const stage = async (name, action) => {
    const record = { name, status: "running", startedAt: new Date().toISOString() };
    report.stages.push(record);
    writeJson(reportPath, report);
    process.stdout.write(`\n[omyear] ${name}\n`);
    try {
      const result = await action();
      record.status = "completed";
      record.completedAt = new Date().toISOString();
      writeJson(reportPath, report);
      return result;
    } catch (error) {
      record.status = "failed";
      record.completedAt = new Date().toISOString();
      record.error = error.message;
      report.status = "failed";
      report.completedAt = new Date().toISOString();
      writeJson(reportPath, report);
      throw error;
    }
  };

  await stage("validate_input", async () => {
    const validation = validateInput(input);
    writeJson(path.join(runDir, "input-validation.json"), validation);
    if (!validation.valid) throw new Error(validation.errors.join("; "));
    writeJson(path.join(runDir, "input.json"), input);
  });

  const calcPath = path.join(runDir, "calc.json");
  await stage("deterministic_calculations", () => runProcess("python3", [
    path.join(pipelineDir, "engines", "calculate.py"),
    "--input", path.join(runDir, "input.json"),
    "--output", calcPath,
  ], { cwd: projectRoot }));
  const calculation = readJson(calcPath);

  const draftPath = path.join(runDir, "draft.json");
  const modelResponsePath = path.join(runDir, "model-response.json");
  const prompt = buildDraftPrompt(input, calculation);
  fs.writeFileSync(path.join(runDir, "prompt.txt"), prompt);
  const draft = await stage("source_linked_draft", async () => {
    if (options.provider === "fixture") {
      const fixture = generateFixtureDraft(input, calculation);
      writeJson(draftPath, fixture);
      return fixture;
    }
    if (options.provider === "codex") return generateWithCodex({
      prompt,
      schemaPath: path.join(pipelineDir, "schemas", "draft.schema.json"),
      outputPath: draftPath,
      model: options.model,
    });
    return generateWithOpenAI({
      prompt,
      schemaPath: path.join(pipelineDir, "schemas", "draft.schema.json"),
      outputPath: draftPath,
      metadataPath: modelResponsePath,
      model: options.model,
      safetySeed: `omyear:${input.person.id}`,
    });
  });
  const modelResponse = options.provider === "openai" ? readJson(modelResponsePath) : null;
  const resolvedModel = modelResponse?.model ?? (options.provider === "fixture" ? "fixture" : options.model);
  report.resolvedModel = resolvedModel;
  writeJson(reportPath, report);

  const verification = await stage("source_verification", async () => {
    const result = verifyDraft(draft, calculation);
    writeJson(path.join(runDir, "verification.json"), result);
    if (result.status === "failed") throw new Error("Draft verification failed; inspect verification.json");
    return result;
  });

  const book = await stage("compile_book", async () => {
    const result = compileBook({
      input,
      calculation,
      draft,
      verification,
      model: resolvedModel,
      modelResponse,
    });
    writeJson(path.join(runDir, "book.json"), result);
    if (options.install) writeJson(path.join(projectRoot, "web", "src", "data", "people", `${input.person.id}.json`), result);
    return result;
  });

  if (options.build) {
    await stage("web_build", () => runProcess("npm", ["run", "build"], { cwd: path.join(projectRoot, "web") }));
  }

  report.status = "needs_human_review";
  report.completedAt = new Date().toISOString();
  report.artifacts = {
    input: path.join(runDir, "input.json"),
    calculations: calcPath,
    draft: draftPath,
    modelResponse: options.provider === "openai" ? modelResponsePath : null,
    verification: path.join(runDir, "verification.json"),
    book: path.join(runDir, "book.json"),
    installedBook: options.install ? path.join(projectRoot, "web", "src", "data", "people", `${input.person.id}.json`) : null,
    route: options.install ? `/${book.person.slug}` : null,
  };
  writeJson(reportPath, report);
  process.stdout.write(`\n[omyear] complete: ${report.status}\n[omyear] report: ${reportPath}\n`);
}

main().catch((error) => {
  console.error(`\n[omyear] failed: ${error.message}`);
  process.exitCode = 1;
});
