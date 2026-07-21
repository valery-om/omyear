import { DurableObject } from "cloudflare:workers";

const MAX_BODY_BYTES = 64 * 1024;
const LOCAL_ORIGINS = new Set(["http://localhost:4321", "http://127.0.0.1:4321"]);

type GuardDecision =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: "duplicate_request" | "daily_limit_reached"; retryAfter: number; remaining: number };

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function utcDay(timestamp = Date.now()): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

function hasExpectedShape(input: unknown): input is Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const value = input as Record<string, unknown>;
  const project = value.project as Record<string, unknown> | undefined;
  const person = value.person as Record<string, unknown> | undefined;
  return Boolean(
    project
    && (project.language === "en" || project.language === "ru")
    && Number.isInteger(project.targetYear)
    && person
    && typeof person.name === "string"
    && person.birth
    && Array.isArray(value.candidateLocations)
    && value.candidateLocations.length === 4,
  );
}

async function requestFingerprint(input: Record<string, unknown>): Promise<string> {
  const canonicalInput = structuredClone(input);
  const person = canonicalInput.person as Record<string, unknown> | undefined;
  if (person) delete person.id;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalJson(canonicalInput)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export class GenerationGuard extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS generation_budget (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          accepted INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS generation_requests (
          fingerprint TEXT PRIMARY KEY,
          accepted_at INTEGER NOT NULL,
          status TEXT NOT NULL
        );
        INSERT INTO generation_budget (id, accepted) VALUES (1, 0)
          ON CONFLICT (id) DO NOTHING;
      `);
    });
  }

  reserve(fingerprint: string, dailyLimit: number, duplicateWindowMs: number, now: number): GuardDecision {
    return this.ctx.storage.transactionSync(() => {
      const previous = this.ctx.storage.sql.exec<{ accepted_at: number }>(
        "SELECT accepted_at FROM generation_requests WHERE fingerprint = ?",
        fingerprint,
      ).toArray()[0];
      if (previous) {
        const elapsed = Math.max(0, now - previous.accepted_at);
        if (elapsed < duplicateWindowMs) {
          return {
            allowed: false,
            reason: "duplicate_request",
            retryAfter: Math.max(1, Math.ceil((duplicateWindowMs - elapsed) / 1000)),
            remaining: this.remaining(dailyLimit),
          };
        }
        this.ctx.storage.sql.exec("DELETE FROM generation_requests WHERE fingerprint = ?", fingerprint);
      }

      const remaining = this.remaining(dailyLimit);
      if (remaining <= 0) {
        const nextUtcDay = Date.parse(`${utcDay(now + 86_400_000)}T00:00:00Z`);
        return {
          allowed: false,
          reason: "daily_limit_reached",
          retryAfter: Math.max(1, Math.ceil((nextUtcDay - now) / 1000)),
          remaining: 0,
        };
      }

      this.ctx.storage.sql.exec("UPDATE generation_budget SET accepted = accepted + 1 WHERE id = 1");
      this.ctx.storage.sql.exec(
        "INSERT INTO generation_requests (fingerprint, accepted_at, status) VALUES (?, ?, 'pending')",
        fingerprint,
        now,
      );
      return { allowed: true, remaining: remaining - 1 };
    });
  }

  mark(fingerprint: string, status: "accepted" | "failed"): void {
    this.ctx.storage.sql.exec(
      "UPDATE generation_requests SET status = ? WHERE fingerprint = ?",
      status,
      fingerprint,
    );
  }

  private remaining(dailyLimit: number): number {
    const row = this.ctx.storage.sql.exec<{ accepted: number }>(
      "SELECT accepted FROM generation_budget WHERE id = 1",
    ).one();
    return Math.max(0, dailyLimit - row.accepted);
  }
}

function allowedOrigin(origin: string | null, env: Env): string | null {
  if (!origin) return null;
  if (origin === env.SITE_ORIGIN || origin === env.APP_ORIGIN || LOCAL_ORIGINS.has(origin)) return origin;
  return null;
}

function responseHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    Vary: "Origin",
  });
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Expose-Headers", "Retry-After, X-Omyear-Budget-Remaining");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}

function json(
  status: number,
  body: Record<string, unknown>,
  origin: string | null = null,
  extraHeaders: Record<string, string> = {},
): Response {
  const headers = responseHeaders(origin);
  headers.set("Content-Type", "application/json; charset=utf-8");
  for (const [name, value] of Object.entries(extraHeaders)) headers.set(name, value);
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get("Origin");
    const origin = allowedOrigin(requestOrigin, env);
    const dailyLimit = positiveInteger(env.DAILY_GENERATION_LIMIT, 8);
    const duplicateWindowSeconds = positiveInteger(env.DUPLICATE_WINDOW_SECONDS, 300);

    if (url.pathname === "/health" && request.method === "GET") {
      return json(200, {
        status: "ok",
        service: "omyear-api",
        guardrails: { dailyGenerationLimit: dailyLimit, duplicateWindowSeconds },
      }, origin);
    }
    if (url.pathname !== "/generate") return json(404, { error: "not_found" }, origin);
    if (!origin) return json(403, { error: "origin_not_allowed" });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: responseHeaders(origin) });
    if (request.method !== "POST") return json(405, { error: "method_not_allowed" }, origin);
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return json(415, { error: "json_required" }, origin);
    }

    const clientKey = request.headers.get("CF-Connecting-IP") || "unknown";
    const { success } = await env.GENERATE_RATE_LIMITER.limit({ key: `generate:${clientKey}` });
    if (!success) return json(429, { error: "rate_limited", retryAfter: 60 }, origin);

    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_BODY_BYTES) return json(413, { error: "request_too_large" }, origin);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json(413, { error: "request_too_large" }, origin);
    }
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      return json(400, { error: "invalid_json" }, origin);
    }
    if (!hasExpectedShape(input)) return json(400, { error: "invalid_input" }, origin);

    const fingerprint = await requestFingerprint(input);
    const guard = env.GENERATION_GUARD.getByName(`generation-budget:${utcDay()}`);
    const decision = await guard.reserve(
      fingerprint,
      dailyLimit,
      duplicateWindowSeconds * 1000,
      Date.now(),
    );
    if (!decision.allowed) {
      console.warn(JSON.stringify({
        status: "generation_blocked",
        reason: decision.reason,
        fingerprint: fingerprint.slice(0, 12),
        remaining: decision.remaining,
      }));
      return json(
        429,
        { error: decision.reason, retryAfter: decision.retryAfter },
        origin,
        { "Retry-After": String(decision.retryAfter), "X-Omyear-Budget-Remaining": String(decision.remaining) },
      );
    }

    try {
      const upstream = await fetch(env.BACKEND_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-omyear-secret": env.BACKEND_SHARED_SECRET,
        },
        body: raw,
        signal: AbortSignal.timeout(295_000),
      });
      ctx.waitUntil(guard.mark(fingerprint, upstream.ok ? "accepted" : "failed"));
      const headers = responseHeaders(origin);
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json; charset=utf-8");
      headers.set("X-Omyear-Budget-Remaining", String(decision.remaining));
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      ctx.waitUntil(guard.mark(fingerprint, "failed"));
      return json(502, { error: "backend_unavailable" }, origin);
    }
  },
} satisfies ExportedHandler<Env>;
