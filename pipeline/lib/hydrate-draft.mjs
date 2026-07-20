const NUMBER_KEYS = ["lifePath", "birthdayNumber", "personalYear", "nextPersonalYear", "soulNumber", "destinyNumber"];
const MATRIX_KEYS = ["personality", "ancestralTalents", "developmentTask", "centerPurpose", "spiritualLine", "materialLine"];

function addDays(value, days) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function scalarValue(value) {
  return value && typeof value === "object" && Object.hasOwn(value, "value") ? value.value : value;
}

function anchor(item, sourceId) {
  item.sourceIds = [sourceId, ...(item.sourceIds || []).filter((id) => id !== sourceId)];
}

/** Keep arithmetic, dates, IDs and measured distances owned by code, not prose generation. */
export function hydrateDraft(modelDraft, calculation) {
  const draft = structuredClone(modelDraft);

  draft.numbers.items.forEach((item, index) => {
    const key = NUMBER_KEYS[index];
    const sourceId = `calc.numerology.${key}`;
    item.value = String(scalarValue(calculation.numerology[key]));
    anchor(item, sourceId);
  });

  draft.matrix.items.forEach((item, index) => {
    const key = MATRIX_KEYS[index];
    const sourceId = `calc.matrix.${key}`;
    item.arcana = String(calculation.matrix[key].value);
    anchor(item, sourceId);
  });

  draft.months.forEach((month, index) => {
    const period = calculation.periods[index];
    month.index = period.index;
    month.period = period.label;
    anchor(month, `calc.period.${period.index}`);
  });

  draft.twelveDays.items.forEach((day, index) => {
    day.date = addDays(calculation.periods[0].start, index);
    anchor(day, `calc.period.${index + 1}`);
  });

  draft.places.locations.forEach((location, index) => {
    const calculated = calculation.astrocartography.locations[index];
    location.id = calculated.id;
    location.name = `${calculated.name}, ${calculated.country}`;
    location.line = calculated.nearestLines
      .map((line) => `${line.planetLabel} ${line.angle} — ${line.distanceKm} km`)
      .join("; ");
    anchor(location, `calc.astrocartography.${calculated.id}`);
  });

  return draft;
}
