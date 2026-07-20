#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ignoredDirectories = new Set([".git", "node_modules", "dist"]);
const forbiddenExtensions = new Set([".pdf", ".mp3", ".wav", ".m4a", ".jpg", ".jpeg", ".webp"]);
const forbiddenPathParts = ["/photos/", "/music/", "/output/", "/pipeline/runs/"];
const privateMarkers = ["anna", "nastya", "vlada", "larisa", "sofya", "софья", "настя", "влада", "лариса"];
const allowedPeopleData = new Set(["web/src/data/people/maya-demo.json"]);
const findings = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else inspect(absolute);
  }
}

function inspect(absolute) {
  const relative = path.relative(root, absolute).split(path.sep).join("/");
  const wrapped = `/${relative.toLowerCase()}/`;
  const extension = path.extname(relative).toLowerCase();
  if (forbiddenExtensions.has(extension)) findings.push(`${relative}: forbidden public file type`);
  if (forbiddenPathParts.some((part) => wrapped.includes(part))) findings.push(`${relative}: forbidden private path`);
  if (relative.startsWith("web/src/data/people/") && !allowedPeopleData.has(relative)) findings.push(`${relative}: only Maya is allowed`);

  if (![".png", ".ico"].includes(extension)) {
    const content = fs.readFileSync(absolute, "utf8");
    if (/\bsk-[A-Za-z0-9_-]{20,}\b/.test(content)) findings.push(`${relative}: possible API key`);
    if (relative !== "scripts/audit-public.mjs") {
      const lower = `${relative}\n${content}`.toLowerCase();
      for (const marker of privateMarkers) {
        if (lower.includes(marker)) findings.push(`${relative}: private marker '${marker}'`);
      }
    }
  }
}

walk(root);

if (findings.length) {
  console.error("Public audit failed:\n" + [...new Set(findings)].map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Public audit passed: no secrets, private paths/names, audio, PDFs, photos, or extra people datasets found.");
