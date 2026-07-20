const MAX_BODY_BYTES = 64 * 1024;
const LOCAL_ORIGINS = new Set(["http://localhost:4321", "http://127.0.0.1:4321"]);

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
    headers.set("Access-Control-Max-Age", "86400");
  }
  return headers;
}

function json(status: number, body: Record<string, unknown>, origin: string | null = null): Response {
  const headers = responseHeaders(origin);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get("Origin");
    const origin = allowedOrigin(requestOrigin, env);

    if (url.pathname === "/health" && request.method === "GET") {
      return json(200, { status: "ok", service: "omyear-api" }, origin);
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
    try {
      JSON.parse(raw);
    } catch {
      return json(400, { error: "invalid_json" }, origin);
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
      const headers = responseHeaders(origin);
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json; charset=utf-8");
      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      return json(502, { error: "backend_unavailable" }, origin);
    }
  },
} satisfies ExportedHandler<Env>;
