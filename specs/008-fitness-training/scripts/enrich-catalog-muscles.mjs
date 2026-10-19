#!/usr/bin/env node
/**
 * Adds primaryMuscles / secondaryMuscles to exercises.catalog.json (in-place).
 * Run after editing the exercise list: node scripts/enrich-catalog-muscles.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "exercises.catalog.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

/** @type {Record<string, { primary: string[], secondary?: string[], modalityNote?: string }>} */
const byId = {
  "developpe-couche-barre": { primary: ["pectoraux"], secondary: ["triceps", "deltoide-anterieur"] },
  "developpe-couche-halteres": { primary: ["pectoraux"], secondary: ["triceps", "deltoide-anterieur"] },
  "developpe-incline-barre": { primary: ["pectoraux"], secondary: ["deltoide-anterieur", "triceps"] },
  "developpe-incline-halteres": { primary: ["pectoraux"], secondary: ["deltoide-anterieur", "triceps"] },
  "developpe-decline": { primary: ["pectoraux"], secondary: ["triceps"] },
  pompes: { primary: ["pectoraux"], secondary: ["triceps", "deltoide-anterieur", "abdominaux"] },
  "pompes-inclinees": { primary: ["pectoraux"], secondary: ["triceps"] },
  "pompes-declivees": { primary: ["pectoraux"], secondary: ["deltoide-anterieur", "triceps"] },
  "dips-pectoraux": { primary: ["pectoraux"], secondary: ["triceps", "deltoide-anterieur"] },
  "ecarte-cable": { primary: ["pectoraux"] },
  "ecarte-halteres": { primary: ["pectoraux"], secondary: ["deltoide-anterieur"] },
  "ecarte-machine": { primary: ["pectoraux"] },
  "pullover-haltere": { primary: ["pectoraux"], secondary: ["grand-dorsal", "triceps"] },

  "traction-pronation": { primary: ["grand-dorsal"], secondary: ["biceps", "rhomboïdes", "trapèzes"] },
  "traction-supination": { primary: ["grand-dorsal"], secondary: ["biceps", "rhomboïdes"] },
  "traction-neutre": { primary: ["grand-dorsal"], secondary: ["biceps", "rhomboïdes"] },
  "tractions-assistees": { primary: ["grand-dorsal"], secondary: ["biceps", "rhomboïdes"] },
  "tirage-vertical-poulie": { primary: ["grand-dorsal"], secondary: ["biceps", "rhomboïdes"] },
  "rowing-barre": { primary: ["grand-dorsal"], secondary: ["rhomboïdes", "trapèzes", "biceps", "lombaires"] },
  "rowing-haltere-un-bras": { primary: ["grand-dorsal"], secondary: ["rhomboïdes", "biceps"] },
  "rowing-poulie-basse": { primary: ["grand-dorsal"], secondary: ["rhomboïdes", "biceps", "trapèzes"] },
  "rowing-machine": { primary: ["grand-dorsal"], secondary: ["rhomboïdes", "biceps"] },
  "t-bar-row": { primary: ["grand-dorsal"], secondary: ["rhomboïdes", "trapèzes", "biceps"] },
  "souleve-de-terre": { primary: ["ischio-jambiers", "fessiers", "lombaires"], secondary: ["quadriceps", "trapèzes", "grand-dorsal", "avant-bras"] },
  "souleve-de-terre-roumain": { primary: ["ischio-jambiers", "fessiers"], secondary: ["lombaires", "grand-dorsal"] },
  "souleve-de-terre-sumo": { primary: ["fessiers", "quadriceps"], secondary: ["ischio-jambiers", "adducteurs", "lombaires"] },
  hyperextension: { primary: ["lombaires"], secondary: ["fessiers", "ischio-jambiers"] },
  "face-pull": { primary: ["deltoide-posterieur"], secondary: ["rhomboïdes", "trapèzes"] },
  shrugs: { primary: ["trapèzes"] },

  "developpe-militaire-barre": { primary: ["deltoide-anterieur"], secondary: ["deltoide-lateral", "triceps", "trapèzes"] },
  "developpe-epaules-halteres": { primary: ["deltoide-anterieur"], secondary: ["deltoide-lateral", "triceps"] },
  "developpe-arnold": { primary: ["deltoide-anterieur"], secondary: ["deltoide-lateral", "triceps"] },
  "elevations-laterales": { primary: ["deltoide-lateral"] },
  "elevations-frontales": { primary: ["deltoide-anterieur"] },
  "oiseau-halteres": { primary: ["deltoide-posterieur"], secondary: ["rhomboïdes", "trapèzes"] },
  "developpe-epaules-machine": { primary: ["deltoide-anterieur"], secondary: ["triceps"] },
  "upright-row": { primary: ["deltoide-lateral"], secondary: ["trapèzes", "biceps"] },

  "curl-barre": { primary: ["biceps"] },
  "curl-halteres": { primary: ["biceps"] },
  "curl-marteau": { primary: ["biceps"], secondary: ["avant-bras"] },
  "curl-incline": { primary: ["biceps"] },
  "curl-pupitre": { primary: ["biceps"] },
  "curl-cable": { primary: ["biceps"] },
  "curl-concentration": { primary: ["biceps"] },

  "extension-triceps-poulie": { primary: ["triceps"] },
  "extension-triceps-barre": { primary: ["triceps"] },
  "extension-triceps-haltere": { primary: ["triceps"] },
  "dips-triceps": { primary: ["triceps"], secondary: ["pectoraux", "deltoide-anterieur"] },
  "kickback-triceps": { primary: ["triceps"] },
  "developpe-couche-prise-serree": { primary: ["triceps"], secondary: ["pectoraux", "deltoide-anterieur"] },

  "curl-poignet": { primary: ["avant-bras"] },
  "curl-poignet-inverse": { primary: ["avant-bras"] },
  "farmer-walk": { primary: ["avant-bras"], secondary: ["trapèzes", "abdominaux"] },

  "squat-barre": { primary: ["quadriceps", "fessiers"], secondary: ["ischio-jambiers", "lombaires", "abdominaux"] },
  "squat-avant": { primary: ["quadriceps"], secondary: ["fessiers", "abdominaux"] },
  "squat-goblet": { primary: ["quadriceps", "fessiers"], secondary: ["abdominaux"] },
  "squat-poids-du-corps": { primary: ["quadriceps", "fessiers"] },
  "squat-bulgare": { primary: ["quadriceps", "fessiers"], secondary: ["ischio-jambiers"] },
  "fentes-marchees": { primary: ["quadriceps", "fessiers"], secondary: ["ischio-jambiers"] },
  "fentes-statiques": { primary: ["quadriceps", "fessiers"] },
  "fentes-arriere": { primary: ["quadriceps", "fessiers"] },
  "presse-a-cuisses": { primary: ["quadriceps"], secondary: ["fessiers"] },
  "leg-extension": { primary: ["quadriceps"] },
  "hack-squat": { primary: ["quadriceps"], secondary: ["fessiers"] },
  "step-up": { primary: ["quadriceps", "fessiers"] },
  "pistol-squat": { primary: ["quadriceps", "fessiers"] },

  "leg-curl-allonge": { primary: ["ischio-jambiers"] },
  "leg-curl-assis": { primary: ["ischio-jambiers"] },
  "good-morning": { primary: ["ischio-jambiers", "lombaires"], secondary: ["fessiers"] },
  "nordic-curl": { primary: ["ischio-jambiers"] },

  "hip-thrust-barre": { primary: ["fessiers"], secondary: ["ischio-jambiers", "quadriceps"] },
  "pont-fessier": { primary: ["fessiers"], secondary: ["ischio-jambiers"] },
  "abduction-hanche-machine": { primary: ["abducteurs"], secondary: ["fessiers"] },
  "kickback-poulie": { primary: ["fessiers"] },

  "mollets-debout": { primary: ["mollets"] },
  "mollets-assis": { primary: ["mollets"] },
  "mollets-presse": { primary: ["mollets"] },

  crunch: { primary: ["abdominaux"] },
  "crunch-inverse": { primary: ["abdominaux"], secondary: ["flechisseurs-hanche"] },
  "releve-de-jambes": { primary: ["abdominaux"], secondary: ["flechisseurs-hanche"] },
  "releve-de-jambes-suspendu": { primary: ["abdominaux"], secondary: ["flechisseurs-hanche"] },
  planche: { primary: ["abdominaux"], secondary: ["obliques", "lombaires", "deltoide-anterieur"] },
  "planche-laterale": { primary: ["obliques"], secondary: ["abdominaux"] },
  "russian-twist": { primary: ["obliques"], secondary: ["abdominaux"] },
  "ab-wheel": { primary: ["abdominaux"], secondary: ["lombaires", "deltoide-anterieur"] },
  "gainage-dead-bug": { primary: ["abdominaux"] },
  "gainage-bird-dog": { primary: ["lombaires"], secondary: ["fessiers", "abdominaux"] },
  "crunch-cable": { primary: ["abdominaux"] },
  woodchopper: { primary: ["obliques"], secondary: ["abdominaux"] },

  burpees: { primary: ["quadriceps"], secondary: ["pectoraux", "fessiers", "deltoide-anterieur", "abdominaux"] },
  thruster: { primary: ["quadriceps", "deltoide-anterieur"], secondary: ["fessiers", "triceps"] },
  "clean-and-press": { primary: ["quadriceps", "deltoide-anterieur"], secondary: ["fessiers", "trapèzes", "triceps"] },
  "kettlebell-swing": { primary: ["fessiers", "ischio-jambiers"], secondary: ["lombaires", "deltoide-anterieur"] },
  "snatch-kettlebell": { primary: ["quadriceps", "deltoide-anterieur"], secondary: ["fessiers", "trapèzes", "ischio-jambiers"] },
  "rowing-ergometre": { primary: ["grand-dorsal", "quadriceps"], secondary: ["ischio-jambiers", "biceps"], modalityNote: "Cardio full-body." },
  "battle-ropes": { primary: ["deltoide-anterieur"], secondary: ["abdominaux", "avant-bras"], modalityNote: "Cardio haut du corps." },
  "sled-push": { primary: ["quadriceps", "fessiers"], secondary: ["mollets", "abdominaux"] },

  "marche-rapide": { primary: ["fessiers", "ischio-jambiers"], secondary: ["mollets"], modalityNote: "Endurance." },
  "course-footing": { primary: ["quadriceps", "ischio-jambiers", "mollets"], secondary: ["fessiers"], modalityNote: "Endurance." },
  "course-intervalles": { primary: ["quadriceps", "ischio-jambiers"], secondary: ["fessiers", "mollets"], modalityNote: "HIIT." },
  "velo-stationnaire": { primary: ["quadriceps"], secondary: ["fessiers", "mollets"], modalityNote: "Cardio cyclique." },
  "velo-route": { primary: ["quadriceps"], secondary: ["fessiers", "mollets"], modalityNote: "Cardio cyclique." },
  elliptique: { primary: ["quadriceps", "fessiers"], secondary: ["ischio-jambiers"], modalityNote: "Faible impact." },
  stepper: { primary: ["quadriceps", "fessiers"], secondary: ["mollets"] },
  natation: { primary: ["grand-dorsal", "deltoide-posterieur"], secondary: ["pectoraux", "triceps", "abdominaux"], modalityNote: "Selon style de nage." },
  aquabike: { primary: ["quadriceps"], secondary: ["fessiers", "mollets"] },
  "corde-a-sauter": { primary: ["mollets"], secondary: ["quadriceps", "fessiers"] },
  "rameur-cardio": { primary: ["grand-dorsal", "quadriceps"], secondary: ["ischio-jambiers", "biceps"] },
  "hiit-general": { primary: ["quadriceps"], secondary: ["fessiers", "abdominaux"], modalityNote: "Circuit variable." },
  escalade: { primary: ["avant-bras"], secondary: ["grand-dorsal", "biceps", "fessiers"] },
  "ski-erg": { primary: ["grand-dorsal", "triceps"], secondary: ["abdominaux", "quadriceps"] },

  "etirements-generaux": { primary: ["ischio-jambiers"], secondary: ["quadriceps", "mollets"], modalityNote: "Mobilité globale." },
  "yoga-flow": { primary: ["abdominaux"], secondary: ["ischio-jambiers", "deltoide-posterieur"], modalityNote: "Mobilité / souplesse." },
  "mobilite-hanche": { primary: ["flechisseurs-hanche"], secondary: ["fessiers", "ischio-jambiers"] },
  "mobilite-epaules": { primary: ["deltoide-posterieur"], secondary: ["pectoraux", "trapèzes"] },
  "mobilite-thoracique": { primary: ["obliques"], secondary: ["grand-dorsal"] },
  "foam-rolling": { primary: ["grand-dorsal"], secondary: ["rhomboïdes", "trapèzes"], modalityNote: "Auto-massage." },
  "worlds-greatest-stretch": { primary: ["flechisseurs-hanche"], secondary: ["ischio-jambiers", "grand-dorsal"] },
  "chat-vache": { primary: ["lombaires"], secondary: ["abdominaux"] },
  "rotation-thoracique-quadrupedie": { primary: ["obliques"], secondary: ["grand-dorsal"] },
  "etirement-ischios": { primary: ["ischio-jambiers"] },
};

const categoryFallback = {
  pectoraux: { primary: ["pectoraux"], secondary: ["triceps"] },
  dos: { primary: ["grand-dorsal"], secondary: ["rhomboïdes", "biceps"] },
  épaules: { primary: ["deltoide-anterieur"], secondary: ["deltoide-lateral"] },
  biceps: { primary: ["biceps"] },
  triceps: { primary: ["triceps"] },
  "avant-bras": { primary: ["avant-bras"] },
  quadriceps: { primary: ["quadriceps"], secondary: ["fessiers"] },
  "ischio-jambiers": { primary: ["ischio-jambiers"] },
  fessiers: { primary: ["fessiers"] },
  mollets: { primary: ["mollets"] },
  abdominaux: { primary: ["abdominaux"] },
  cardio: { primary: ["quadriceps"], secondary: ["fessiers"], modalityNote: "Cardio." },
  mobilité: { primary: ["ischio-jambiers"], modalityNote: "Mobilité." },
};

let missing = 0;
for (const ex of catalog.exercises) {
  const map = byId[ex.id] ?? categoryFallback[ex.category];
  if (!map) {
    console.error(`No muscle mapping for ${ex.id} (category ${ex.category})`);
    missing++;
    continue;
  }
  ex.primaryMuscles = map.primary;
  if (map.secondary?.length) ex.secondaryMuscles = map.secondary;
  if (map.modalityNote) ex.modalityNote = map.modalityNote;
}

if (missing) process.exit(1);

catalog.muscleCatalogRef = "muscles.catalog.json";
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n", "utf8");
console.log(`Enriched ${catalog.exercises.length} exercises.`);
