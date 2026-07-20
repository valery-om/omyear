import fs from "node:fs";

export function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

export function validateInput(input) {
  const errors = [];
  const required = (value, label) => {
    if (value === undefined || value === null || value === "") errors.push(`${label} is required`);
  };
  required(input?.project?.language, "project.language");
  required(input?.project?.targetYear, "project.targetYear");
  required(input?.person?.id, "person.id");
  required(input?.person?.name, "person.name");
  required(input?.person?.fullNameAtBirth, "person.fullNameAtBirth");
  required(input?.person?.birth?.date, "person.birth.date");
  required(input?.person?.birth?.time, "person.birth.time");
  required(input?.person?.birth?.utcOffset, "person.birth.utcOffset");
  required(input?.person?.birth?.latitude, "person.birth.latitude");
  required(input?.person?.birth?.longitude, "person.birth.longitude");
  required(input?.person?.solarReturnLocation?.latitude, "person.solarReturnLocation.latitude");
  required(input?.person?.solarReturnLocation?.longitude, "person.solarReturnLocation.longitude");
  if (!Array.isArray(input?.person?.goals) || input.person.goals.length === 0) errors.push("person.goals must contain at least one item");
  if (!Array.isArray(input?.person?.facts) || input.person.facts.length === 0) errors.push("person.facts must contain at least one item");
  if (!Array.isArray(input?.candidateLocations)) errors.push("candidateLocations must be an array");
  if (input?.project?.language && !["en", "ru"].includes(input.project.language)) errors.push("project.language must be en or ru");
  if (input?.person?.id && !/^[a-z0-9-]+$/.test(input.person.id)) errors.push("person.id must use lowercase letters, digits, and hyphens");
  for (const [label, value, min, max] of [
    ["birth latitude", input?.person?.birth?.latitude, -90, 90],
    ["birth longitude", input?.person?.birth?.longitude, -180, 180],
    ["solar latitude", input?.person?.solarReturnLocation?.latitude, -90, 90],
    ["solar longitude", input?.person?.solarReturnLocation?.longitude, -180, 180],
  ]) {
    if (typeof value === "number" && (value < min || value > max)) errors.push(`${label} is outside ${min}..${max}`);
  }
  return { valid: errors.length === 0, errors };
}
