export default {
  async fetch() {
    const configuredLimit = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 6_000);
    const maxOutputTokensPerSegment = Number.isSafeInteger(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : 6_000;
    return Response.json(
      {
        status: "ok",
        service: "omyear-editorial",
        guardrails: { maxOutputTokensPerSegment, editorialSegments: 3 },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  },
};
