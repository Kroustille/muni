#!/usr/bin/env node
/**
 * Validates cross-references between exercises.catalog.json and muscles.catalog.json.
 * Exit 0 if valid; exit 1 with stderr messages otherwise.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const muscles = JSON.parse(readFileSync(join(root, "muscles.catalog.json"), "utf8"));
const exercises = JSON.parse(readFileSync(join(root, "exercises.catalog.json"), "utf8"));

const muscleIds = new Set(muscles.muscles.map((m) => m.id));
const exerciseIds = new Set();
let errors = 0;

for (const ex of exercises.exercises) {
  if (exerciseIds.has(ex.id)) {
    console.error(`Duplicate exercise id: ${ex.id}`);
    errors++;
  }
  exerciseIds.add(ex.id);

  for (const field of ["primaryMuscles", "secondaryMuscles"]) {
    const list = ex[field];
    if (!list) {
      if (field === "primaryMuscles") {
        console.error(`${ex.id}: missing primaryMuscles`);
        errors++;
      }
      continue;
    }
    if (!Array.isArray(list)) {
      console.error(`${ex.id}: ${field} must be an array`);
      errors++;
      continue;
    }
    for (const mid of list) {
      if (!muscleIds.has(mid)) {
        console.error(`${ex.id}: unknown muscle id "${mid}" in ${field}`);
        errors++;
      }
    }
  }
}

const usedMuscles = new Set();
for (const ex of exercises.exercises) {
  for (const mid of ex.primaryMuscles ?? []) usedMuscles.add(mid);
  for (const mid of ex.secondaryMuscles ?? []) usedMuscles.add(mid);
}

for (const mid of muscleIds) {
  if (!usedMuscles.has(mid)) {
    console.warn(`Warning: muscle "${mid}" is not referenced by any exercise`);
  }
}

if (errors > 0) {
  console.error(`\nValidation failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(
  `OK: ${exercises.exercises.length} exercises, ${muscleIds.size} muscles, all references valid.`
);
