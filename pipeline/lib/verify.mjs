const PROHIBITED_PATTERNS = [
  ["guarantee", /\bguarantee(?:d|s)?\b/i],
  ["certainty", /\b(?:certain|certainly|inevitable|destined|fated)\b/i],
  ["prediction", /\bwill definitely\b|\bis going to happen\b/i],
  ["medical", /\b(?:diagnose|diagnosis|cure|treatment plan|medication)\b/i],
  ["investment", /\b(?:buy|sell|invest in) (?:stocks?|crypto|funds?)\b/i],
];

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function scalarValue(source) {
  if (source?.value && typeof source.value === "object" && Object.hasOwn(source.value, "value")) {
    return source.value.value;
  }
  return source?.value;
}

export function verifyDraft(draft, calculation) {
  const knownSources = new Set(calculation.sources.map((item) => item.id));
  const referenced = [];
  const invalidSourceIds = [];
  const missingSourcePaths = [];
  const reviewPaths = [];
  const contentWarnings = [];

  const walk = (value, path = "draft") => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    if (Object.hasOwn(value, "sourceIds")) {
      if (!Array.isArray(value.sourceIds) || value.sourceIds.length === 0) {
        missingSourcePaths.push(path);
      } else {
        for (const sourceId of value.sourceIds) {
          referenced.push(sourceId);
          if (!knownSources.has(sourceId)) invalidSourceIds.push({ path, sourceId });
        }
      }
      if (value.needsReview) reviewPaths.push(path);
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== "sourceIds") walk(child, `${path}.${key}`);
    }
  };
  walk(draft);

  const text = JSON.stringify(draft);
  for (const [code, pattern] of PROHIBITED_PATTERNS) {
    const match = text.match(pattern);
    if (match) contentWarnings.push({ code, match: match[0] });
  }

  const monthIndexes = Array.isArray(draft.months) ? draft.months.map((item) => item.index) : [];
  const structuralErrors = [];
  if (monthIndexes.length !== 12 || monthIndexes.some((value, index) => value !== index + 1)) {
    structuralErrors.push("months must contain indexes 1 through 12 in order");
  }
  if (draft.twelveDays?.items?.length !== 12) structuralErrors.push("twelveDays.items must contain 12 practices");
  if (draft.places?.locations?.length !== calculation.astrocartography.locations.length) structuralErrors.push("places.locations must match candidate locations");

  for (const [index, month] of (draft.months || []).entries()) {
    const expected = calculation.periods[index];
    if (!expected) continue;
    if (month.period !== expected.label) structuralErrors.push(`month ${index + 1} period must equal calc.period.${index + 1}`);
    if (!month.sourceIds?.includes(`calc.period.${index + 1}`)) structuralErrors.push(`month ${index + 1} must cite calc.period.${index + 1}`);
  }

  const startDate = calculation.periods?.[0]?.start;
  for (const [index, day] of (draft.twelveDays?.items || []).entries()) {
    const expectedDate = startDate ? addDays(startDate, index) : null;
    if (expectedDate && day.date !== expectedDate) structuralErrors.push(`day ${index + 1} date must be ${expectedDate}`);
  }

  const sourcesById = new Map(calculation.sources.map((item) => [item.id, item]));
  for (const [index, item] of (draft.numbers?.items || []).entries()) {
    const numericSource = item.sourceIds?.map((id) => sourcesById.get(id)).find((source) => source?.id.startsWith("calc.numerology."));
    if (!numericSource) {
      structuralErrors.push(`number item ${index + 1} must cite a numerology calculation`);
    } else if (String(item.value) !== String(scalarValue(numericSource))) {
      structuralErrors.push(`number item ${index + 1} value must match ${numericSource.id}`);
    }
  }

  for (const [index, item] of (draft.matrix?.items || []).entries()) {
    const matrixSource = item.sourceIds?.map((id) => sourcesById.get(id)).find((source) => source?.id.startsWith("calc.matrix."));
    if (!matrixSource) {
      structuralErrors.push(`matrix item ${index + 1} must cite a matrix calculation`);
    } else {
      if (String(item.arcana) !== String(matrixSource.value?.value)) structuralErrors.push(`matrix item ${index + 1} arcana must match ${matrixSource.id}`);
      if (item.name !== matrixSource.value?.name) structuralErrors.push(`matrix item ${index + 1} name must match ${matrixSource.id}`);
    }
  }

  for (const [index, location] of (draft.places?.locations || []).entries()) {
    const calculated = calculation.astrocartography.locations[index];
    if (!calculated) continue;
    const expectedSource = `calc.astrocartography.${calculated.id}`;
    if (location.id !== calculated.id) structuralErrors.push(`location ${index + 1} id must be ${calculated.id}`);
    if (location.name !== `${calculated.name}, ${calculated.country}`) structuralErrors.push(`location ${calculated.id} name must match calc.json`);
    if (!location.sourceIds?.includes(expectedSource)) structuralErrors.push(`location ${calculated.id} must cite ${expectedSource}`);
    for (const line of calculated.nearestLines) {
      const expectedLine = `${line.planetLabel} ${line.angle}`;
      if (!location.line.includes(expectedLine) || !location.line.includes(`${line.distanceKm} km`)) {
        structuralErrors.push(`location ${calculated.id} line must include ${expectedLine} at ${line.distanceKm} km`);
      }
    }
  }

  const blocking = invalidSourceIds.length + missingSourcePaths.length + structuralErrors.length;
  return {
    status: blocking === 0 ? "needs_human_review" : "failed",
    checkedAt: new Date().toISOString(),
    knownSourceCount: knownSources.size,
    referencedClaimCount: new Set(referenced).size,
    invalidSourceIds,
    missingSourcePaths,
    structuralErrors,
    contentWarnings,
    humanReview: {
      required: true,
      flaggedPaths: reviewPaths,
      reason: "Omyear requires editorial approval before build output can be published.",
    },
  };
}
