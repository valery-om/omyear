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

export async function requestOpenAI({
  prompt,
  schema,
  model = "gpt-5.6-sol",
  safetySeed = "omyear-demo",
  promptCacheKey = "omyear-editorial-v1",
  maxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 6_000),
  maxPromptBytes = Number(process.env.OPENAI_MAX_PROMPT_BYTES || 48 * 1024),
  apiKey = process.env.OPENAI_API_KEY,
}) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for the openai provider");
  }

  const { $schema: _schemaDialect, title: _schemaTitle, ...apiSchema } = schema;
  const safetyIdentifier = crypto.createHash("sha256").update(safetySeed).digest("hex");
  const outputLimit = Number.isSafeInteger(maxOutputTokens) && maxOutputTokens > 0
    ? maxOutputTokens
    : 6_000;
  const promptByteLimit = Number.isSafeInteger(maxPromptBytes) && maxPromptBytes > 0
    ? maxPromptBytes
    : 48 * 1024;
  const promptBytes = new TextEncoder().encode(prompt).byteLength;
  if (promptBytes > promptByteLimit) {
    throw new Error(`OpenAI prompt exceeds the ${promptByteLimit}-byte safety limit`);
  }
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: outputLimit,
      prompt_cache_key: promptCacheKey,
      safety_identifier: safetyIdentifier,
      reasoning: { effort: "low" },
      text: {
        verbosity: "medium",
        format: {
          type: "json_schema",
          name: "omyear_editorial_draft",
          strict: true,
          schema: apiSchema,
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
  return {
    draft,
    metadata: {
      responseId: payload.id,
      model: payload.model,
      status: payload.status,
      createdAt: payload.created_at,
      usage: payload.usage,
      maxOutputTokens: outputLimit,
      promptBytes,
      maxPromptBytes: promptByteLimit,
    },
  };
}

export async function generateWithOpenAI({
  prompt,
  schemaPath,
  outputPath,
  metadataPath,
  model = "gpt-5.6-sol",
  safetySeed = "omyear-demo",
}) {
  const schema = JSON.parse(fs.readFileSync(path.resolve(schemaPath), "utf8"));
  const { draft, metadata } = await requestOpenAI({ prompt, schema, model, safetySeed });
  fs.writeFileSync(path.resolve(outputPath), `${JSON.stringify(draft, null, 2)}\n`);

  if (metadataPath) {
    fs.writeFileSync(path.resolve(metadataPath), `${JSON.stringify(metadata, null, 2)}\n`);
  }

  return draft;
}
