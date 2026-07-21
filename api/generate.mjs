import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compileBook } from "../pipeline/lib/compile-book.mjs";
import { hydrateDraft } from "../pipeline/lib/hydrate-draft.mjs";
import { requestOpenAI } from "../pipeline/lib/openai-provider.mjs";
import { buildDraftPrompt } from "../pipeline/lib/prompt.mjs";
import { calculationForSegment, DRAFT_SEGMENTS, mergeDraftSegments, mergeSegmentMetadata, schemaForSegment } from "../pipeline/lib/segment-draft.mjs";
import { validateInput } from "../pipeline/lib/validate.mjs";
import { verifyDraft } from "../pipeline/lib/verify.mjs";

export const maxDuration = 300;

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const draftSchema = JSON.parse(fs.readFileSync(path.join(root, "pipeline/schemas/draft.schema.json"), "utf8"));
const encoder = new TextEncoder();
const MAX_BODY_BYTES = 64 * 1024;

function authorized(request) {
  const expected = process.env.BACKEND_SHARED_SECRET || "";
  const supplied = request.headers.get("x-omyear-secret") || "";
  if (!expected || expected.length !== supplied.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

function event(controller, type, payload) {
  controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`));
}

function publicFailureCode(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("exceeded your current quota") || message.includes("insufficient_quota")) return "quota_exceeded";
  if (message.includes("rate limit")) return "model_rate_limited";
  return "generation_failed";
}

function calculationUrl(request) {
  if (process.env.CALCULATE_URL) return process.env.CALCULATE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/api/calculate`;
  return new URL("/api/calculate", request.url).toString();
}

export default {
  async fetch(request) {
    if (request.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });
    if (!authorized(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (declaredLength > MAX_BODY_BYTES) return Response.json({ error: "request_too_large" }, { status: 413 });

    let input;
    try {
      const raw = await request.text();
      if (new Blob([raw]).size > MAX_BODY_BYTES) throw new Error("request_too_large");
      input = JSON.parse(raw);
    } catch (error) {
      const status = error.message === "request_too_large" ? 413 : 400;
      return Response.json({ error: error.message === "request_too_large" ? "request_too_large" : "invalid_json" }, { status });
    }

    const validation = validateInput(input);
    if (!validation.valid) return Response.json({ error: "invalid_input", details: validation.errors }, { status: 400 });

    const requestId = crypto.randomUUID();
    const stream = new ReadableStream({
      async start(controller) {
        const startedAt = Date.now();
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
          } catch {
            clearInterval(heartbeat);
          }
        }, 15_000);
        try {
          event(controller, "progress", { stage: "validating", progress: 8 });
          const calculated = await fetch(calculationUrl(request), {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-omyear-secret": process.env.BACKEND_SHARED_SECRET },
            body: JSON.stringify(input),
            signal: AbortSignal.timeout(60_000),
          });
          if (!calculated.ok) throw new Error(`calculation_failed_${calculated.status}`);
          const calculation = await calculated.json();
          event(controller, "progress", { stage: "calculating", progress: 28, sources: calculation.sources.length });
          console.info(JSON.stringify({ requestId, status: "calculated", elapsedMs: Date.now() - startedAt, sourceCount: calculation.sources.length }));

          event(controller, "progress", { stage: "writing", progress: 42 });
          let completedSegments = 0;
          const segmentResults = await Promise.all(DRAFT_SEGMENTS.map(async (segment) => {
            const segmentCalculation = calculationForSegment(calculation, segment);
            const result = await requestOpenAI({
              prompt: buildDraftPrompt(input, segmentCalculation),
              schema: schemaForSegment(
                draftSchema,
                segment,
                segmentCalculation.sources.map((source) => source.id),
              ),
              model: "gpt-5.6-terra",
              safetySeed: `${requestId}:${segment.name}`,
            });
            completedSegments += 1;
            event(controller, "progress", { stage: "writing", progress: 42 + completedSegments * 14, completedSegments, totalSegments: DRAFT_SEGMENTS.length });
            console.info(JSON.stringify({ requestId, status: "segment_completed", segment: segment.name, elapsedMs: Date.now() - startedAt }));
            return result;
          }));
          const modelDraft = mergeDraftSegments(segmentResults);
          const metadata = mergeSegmentMetadata(segmentResults);
          const draft = hydrateDraft(modelDraft, calculation);
          console.info(JSON.stringify({ requestId, status: "drafted", elapsedMs: Date.now() - startedAt, model: metadata.model }));

          event(controller, "progress", { stage: "verifying", progress: 88 });
          const verification = verifyDraft(draft, calculation);
          if (verification.status === "failed") {
            console.warn(JSON.stringify({
              requestId,
              status: "verification_failed",
              invalidSourceIds: verification.invalidSourceIds,
              missingSourcePaths: verification.missingSourcePaths,
              structuralErrors: verification.structuralErrors,
            }));
            throw new Error("verification_failed");
          }
          const book = compileBook({
            input,
            calculation,
            draft,
            verification,
            model: metadata.model,
            modelResponse: metadata,
          });
          event(controller, "result", { requestId, elapsedMs: Date.now() - startedAt, book });
          console.info(JSON.stringify({ requestId, status: "completed", elapsedMs: Date.now() - startedAt }));
        } catch (error) {
          console.error(JSON.stringify({ requestId, status: "failed", code: error.message }));
          event(controller, "failure", { requestId, error: publicFailureCode(error) });
        } finally {
          clearInterval(heartbeat);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  },
};
