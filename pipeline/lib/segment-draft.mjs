export const DRAFT_SEGMENTS = [
  {
    name: "portrait",
    keys: ["meta", "opening", "numbers", "matrix", "nature", "yearTheme"],
    sourcePrefixes: ["input.", "calc.numerology.", "calc.matrix.", "calc.humanDesign.", "calc.astrology."],
  },
  {
    name: "year",
    keys: ["months", "synergy"],
    sourcePrefixes: ["input.", "calc.period.", "calc.numerology.", "calc.astrology."],
  },
  {
    name: "practice",
    keys: ["places", "traps", "twelveDays", "manifest", "letter", "disclaimer"],
    sourcePrefixes: ["input.", "calc.astrocartography.", "calc.period."],
  },
];

export function schemaForSegment(schema, segment) {
  return {
    type: "object",
    additionalProperties: false,
    required: segment.keys,
    properties: Object.fromEntries(segment.keys.map((key) => [key, schema.properties[key]])),
    $defs: schema.$defs,
  };
}

export function calculationForSegment(calculation, segment) {
  return {
    ...calculation,
    sources: calculation.sources.filter((source) => segment.sourcePrefixes.some((prefix) => source.id.startsWith(prefix))),
  };
}

export function mergeDraftSegments(results) {
  return Object.assign({}, ...results.map((result) => result.draft));
}

export function mergeSegmentMetadata(results) {
  const usages = results.map((result) => result.metadata.usage || {});
  const sum = (key) => usages.reduce((total, usage) => total + Number(usage[key] || 0), 0);
  return {
    responseId: results[0]?.metadata.responseId ?? null,
    responseIds: results.map((result) => result.metadata.responseId).filter(Boolean),
    model: results[0]?.metadata.model ?? null,
    status: results.every((result) => result.metadata.status === "completed") ? "completed" : "incomplete",
    createdAt: results.map((result) => result.metadata.createdAt).filter(Boolean).sort()[0] ?? null,
    usage: {
      input_tokens: sum("input_tokens"),
      output_tokens: sum("output_tokens"),
      total_tokens: sum("total_tokens"),
    },
  };
}
