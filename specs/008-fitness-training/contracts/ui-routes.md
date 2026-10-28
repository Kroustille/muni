# UI routes: Fitness (008)

| Route | Purpose | Phase |
|-------|---------|-------|
| `/fitness` | Home: today **planifiée**, **Démarrer** library séances, **Séance libre**, week strip | A |
| `/fitness/sessions` | **Mes séances** — séance template library | A |
| `/fitness/workout/[id]` | In-progress / completed log editor | B |
| `/fitness/history` | Past workouts | C |
| `/fitness/exercises/[exerciseId]/progression` | Per-exercise trends | C |
| `/fitness/settings` | Charge unit, adherence (D) | A/D |

**Removed**: `/fitness/program` (weekly active program editor).

## Nav

- Primary shell entry: **Entraînement** (`fitness.nav`).

## Home (`/fitness`)

- Empty library: CTA → `/fitness/sessions`.
- **Planifiée** for today: **Démarrer** / **Passer**.
- Library shortcuts: start any template (**do now**).
- **Séance libre** entry.
