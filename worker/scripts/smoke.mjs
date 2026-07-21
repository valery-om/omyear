import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workerDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const projectRoot = path.dirname(workerDir);
const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), "omyear-worker-smoke-"));

const mockBackend = http.createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8" });
  response.end('event: result\ndata: {"book":{"status":"smoke-test"}}\n\n');
});

await new Promise((resolve) => mockBackend.listen(0, "127.0.0.1", resolve));
const backendAddress = mockBackend.address();
assert.equal(typeof backendAddress, "object");

const workerPort = 8799;
const worker = spawn(
  path.join(workerDir, "node_modules", ".bin", "wrangler"),
  [
    "dev",
    "--local",
    "--port", String(workerPort),
    "--persist-to", stateDir,
    "--show-interactive-dev-session=false",
    "--var", `BACKEND_URL:http://127.0.0.1:${backendAddress.port}`,
  ],
  { cwd: workerDir, stdio: ["ignore", "pipe", "pipe"] },
);

let workerOutput = "";
worker.stdout.on("data", (chunk) => { workerOutput += chunk; });
worker.stderr.on("data", (chunk) => { workerOutput += chunk; });

const baseUrl = `http://127.0.0.1:${workerPort}`;
const origin = "http://localhost:4321";

async function waitUntilReady() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`, { headers: { Origin: origin } });
      if (response.ok) return;
    } catch {
      // The local runtime is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Worker did not start.\n${workerOutput}`);
}

function post(input, ip) {
  return fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": ip,
      Origin: origin,
    },
    body: JSON.stringify(input),
  });
}

try {
  await waitUntilReady();
  const health = await fetch(`${baseUrl}/health`, { headers: { Origin: origin } }).then((response) => response.json());
  assert.deepEqual(health.guardrails, { dailyGenerationLimit: 8, duplicateWindowSeconds: 300 });

  const baseInput = JSON.parse(fs.readFileSync(path.join(projectRoot, "pipeline", "examples", "maya.json"), "utf8"));
  const first = await post(baseInput, "192.0.2.1");
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("x-omyear-budget-remaining"), "7");
  assert.match(await first.text(), /event: result/);

  const sameBook = structuredClone(baseInput);
  sameBook.person.id = "a-different-random-browser-id";
  const duplicate = await post(sameBook, "192.0.2.2");
  assert.equal(duplicate.status, 429);
  assert.equal((await duplicate.json()).error, "duplicate_request");

  for (let index = 2; index <= 8; index += 1) {
    const uniqueInput = structuredClone(baseInput);
    uniqueInput.person.giftMessage = `${baseInput.person.giftMessage} Smoke ${index}.`;
    const response = await post(uniqueInput, `192.0.2.${index + 1}`);
    assert.equal(response.status, 200);
    await response.text();
  }

  const overBudgetInput = structuredClone(baseInput);
  overBudgetInput.person.giftMessage = `${baseInput.person.giftMessage} Over budget.`;
  const overBudget = await post(overBudgetInput, "192.0.2.20");
  assert.equal(overBudget.status, 429);
  assert.equal((await overBudget.json()).error, "daily_limit_reached");

  process.stdout.write("Worker guardrail smoke test passed.\n");
} finally {
  worker.kill("SIGTERM");
  mockBackend.close();
  fs.rmSync(stateDir, { recursive: true, force: true });
}
