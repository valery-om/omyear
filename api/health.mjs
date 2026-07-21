export default {
  async fetch() {
    const configuredLimit = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 6_000);
    const maxOutputTokensPerSegment = Number.isSafeInteger(configuredLimit) && configuredLimit > 0
      ? configuredLimit
      : 6_000;
    const configuredPromptLimit = Number(process.env.OPENAI_MAX_PROMPT_BYTES || 48 * 1024);
    const maxPromptBytesPerSegment = Number.isSafeInteger(configuredPromptLimit) && configuredPromptLimit > 0
      ? configuredPromptLimit
      : 48 * 1024;
    return Response.json(
      {
        status: "ok",
        service: "omyear-editorial",
        guardrails: { maxOutputTokensPerSegment, maxPromptBytesPerSegment, editorialSegments: 3 },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  },
};
