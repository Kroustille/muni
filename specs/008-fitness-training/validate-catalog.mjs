#!/usr/bin/env node
/**
 * Validates exercises.catalog.json and muscles.catalog.json for feature 008.
 * Run: node specs/008-fitness-training/validate-catalog.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

const EQUIPMENT = new Set([
  "poids du corps",
  "barre",
  "haltères",
  "machine",
  "câble",
  "kettlebell",
  "banc",
  "bande élastique",
  "vélo",
  "rameur",
  "tapis",
  "accessoire",
  "aucun",
]);

const MODALITY = new Set(["strength", "cardio", "mobility"]);

function loadJson(name) {
  const path = join(root, name);
  return JSON.parse(readFileSync(path, "utf8"));
}

function fail(msg) {
  console.error(`validate-catalog: ${msg}`);
  process.exitCode = 1;
}

const musclesDoc = loadJson("muscles.catalog.json");
const exercisesDoc = loadJson("exercises.catalog.json");

const muscleIds = new Set();
for (const m of musclesDoc.muscles ?? []) {
  if (!m.id || !m.nameFr) fail(`muscle missing id or nameFr: ${JSON.stringify(m)}`);
  if (muscleIds.has(m.id)) fail(`duplicate muscle id: ${m.id}`);
  muscleIds.add(m.id);
}

const exerciseIds = new Set();
for (const ex of exercisesDoc.exercises ?? []) {
  const { id, nameFr, nameEn, category, equipment, modality } = ex;
  if (!id || !nameFr || !nameEn || !category || !modality) {
    fail(`exercise missing required fields: ${JSON.stringify(ex)}`);
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    fail(`exercise id must be kebab-case: ${id}`);
  }
  if (exerciseIds.has(id)) fail(`duplicate exercise id: ${id}`);
  exerciseIds.add(id);
  if (!muscleIds.has(category)) {
    fail(`exercise ${id} category "${category}" not in muscles.catalog.json`);
  }
  if (!MODALITY.has(modality)) {
    fail(`exercise ${id} invalid modality: ${modality}`);
  }
  if (!Array.isArray(equipment) || equipment.length === 0) {
    fail(`exercise ${id} must have equipment[]`);
  }
  for (const eq of equipment) {
    if (!EQUIPMENT.has(eq)) fail(`exercise ${id} unknown equipment: ${eq}`);
  }
}

if (process.exitCode) {
  console.error("validate-catalog: FAILED");
} else {
  console.log(
    `validate-catalog: OK (${exercisesDoc.exercises.length} exercises, ${musclesDoc.muscles.length} muscle categories, catalog version ${exercisesDoc.version})`,
  );
}
