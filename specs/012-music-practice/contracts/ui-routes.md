# Contract: Music practice UI routes & navigation

**Applies to**: Hub shell, bottom nav or secondary entry, French labels (FR-011).

## Primary entry

| Route | Purpose |
|-------|---------|
| `/music-practice` | Hub default — redirect or default tab **Compositions** |

## Tab routes (nested or query `?tab=` — implementation chooses; e2e uses path below)

| Path | Tab label (fr.json) | Workflow |
|------|---------------------|----------|
| `/music-practice/compositions` | Compositions | A |
| `/music-practice/dj-sets` | Sets DJ | B |
| `/music-practice/apprentissage` | Apprentissage | C |

## Detail routes

| Path | Entity |
|------|--------|
| `/music-practice/compositions/[id]` | `music_composition` |
| `/music-practice/dj-sets/[id]` | `dj_set` |
| `/music-practice/apprentissage/exercises/[id]` | `practice_exercise` |
| `/music-practice/apprentissage/pieces/[id]` | `learning_piece` |
| `/music-practice/apprentissage/plan` | Active `practice_plan` editor |
| `/music-practice/apprentissage/today` | Today planned exercises + mark done |

## Navigation placement

- **OD-012-5**: Dedicated typed-domain entry in main shell (same prominence pattern as fitness **Entraînement**).
- Icon + label from i18n keys `musicPractice.nav`, `musicPractice.tabs.*`.

## Apprentissage sub-IA (default)

Single **Apprentissage** tab with internal segments:
1. **Aujourd’hui** (today + recent logs)
2. **Plan** (active plan editor)
3. **Exercices** (library)
4. **Répertoire** (learning pieces)

Segments may be sub-routes under `/music-practice/apprentissage/...` or a segmented control — e2e covers today + piece detail minimum.

## Empty states (copy direction)

- Compositions: « Aucune composition — une idée suffit pour commencer »
- DJ: « Aucun set enregistré »
- Exercises: « Aucun exercice — ajoutez une gamme ou une étude »
- Learning pieces: « Aucun morceau en cours d’apprentissage »

No streak or guilt language (SC-004).

## Deep links from future 011

Recap lines MAY deep-link to composition detail, dj set detail, or apprentissage log list — **not implemented in 012**.
