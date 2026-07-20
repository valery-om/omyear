import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function extractOutputText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  for (const item of response.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
      if (content.type === "refusal") {
        throw new Error(`OpenAI refused the draft request: ${content.refusal || "no reason provided"}`);
      }
    }
  }

  throw new Error("OpenAI response did not contain output_text");
}

export async function generateWithOpenAI({
  prompt,
  schemaPath,
  outputPath,
  metadataPath,
  model = "gpt-5.6-sol",
  safetySeed = "omyear-demo",
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for the openai provider");
  }

  const localSchema = JSON.parse(fs.readFileSync(path.resolve(schemaPath), "utf8"));
  const { $schema: _schemaDialect, title: _schemaTitle, ...schema } = localSchema;
  const safetyIdentifier = crypto.createHash("sha256").update(safetySeed).digest("hex");
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      safety_identifier: safetyIdentifier,
      reasoning: { effort: "medium" },
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: "omyear_editorial_draft",
          strict: true,
          schema,
        },
      },
      store: false,
    }),
    signal: AbortSignal.timeout(600_000),
  });

  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.error?.message || `${response.status} ${response.statusText}`;
    throw new Error(`OpenAI Responses API failed: ${message}`);
  }
  if (payload.status !== "completed") {
    const reason = payload?.incomplete_details?.reason || payload?.error?.message || "unknown reason";
    throw new Error(`OpenAI response ended with status '${payload.status}': ${reason}`);
  }

  const outputText = extractOutputText(payload);
  const draft = JSON.parse(outputText);
  fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(draft, null, 2)}\n`);

  if (metadataPath) {
    const metadata = {
      responseId: payload.id,
      model: payload.model,
      status: payload.status,
      createdAt: payload.created_at,
      usage: payload.usage,
    };
    fs.writeFileSync(path.resolve(metadataPath), `${JSON.stringify(metadata, null, 2)}\n`);
  }

  return draft;
}
