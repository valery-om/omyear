import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

export async function generateWithCodex({ prompt, schemaPath, outputPath, model = "gpt-5.6-sol" }) {
  const isolatedCwd = fs.mkdtempSync(path.join(os.tmpdir(), "omyear-codex-"));
  const args = [
    "exec",
    "--model", model,
    "--sandbox", "read-only",
    "--ephemeral",
    "--skip-git-repo-check",
    "--output-schema", path.resolve(schemaPath),
    "--output-last-message", path.resolve(outputPath),
    "-",
  ];

  await new Promise((resolve, reject) => {
    const child = spawn("codex", args, {
      cwd: isolatedCwd,
      stdio: ["pipe", "inherit", "inherit"],
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`codex exec exited with code ${code}`));
    });
    child.stdin.end(prompt);
  });

  return JSON.parse(fs.readFileSync(outputPath, "utf8"));
}
