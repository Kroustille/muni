# Contract: Souvenirs & progression — routes, navigation, screens

**Applies to**: FR-001–FR-018, FR-022–FR-023, FR-025. French UI only.

## Routes

| Route | Screen | Story |
|---|---|---|
| `/souvenirs` | Hub, default tab **Fil de vie** | US2 |
| `/souvenirs/liste` | Tab **Souvenirs** — souvenirs only, newest first, favourites filter | US1 |
| `/souvenirs/[id]` | Souvenir detail/edit (title, date, text, mood, lieu, favori, liens) | US1 |
| `/progression` | Hub, default tab **Objectifs** (active, then completed this year, archived collapsed) | US3 |
| `/progression/objectifs/nouveau` | New goal form | US3 |
| `/progression/objectifs/[id]` | Goal detail: progress, check-ins, reflection | US3 |
| `/progression/realisations` | Tab **Réalisations** — earned list, newest first, + manual | US5 |
| `/progression/realisations/[id]` | Réalisation detail (manual editable; auto read-only except delete) | US5 |

## Navigation

- `FEATURE_NAV` gains **Souvenirs** (`/souvenirs`, icon `BookHeart`) and **Progression** (`/progression`, icon `Sprout`), placed **before** Entraînement.
- Accueil gains a compact row "Souvenirs · Progression" (two links) under the suggestions card — the mobile entry point (research R10).
- Global quick-add picker gains **Souvenir** (research R11). On `/souvenirs` the quick-add button presets **Souvenir** (same as typed lists).

## Souvenir quick-add sheet

Fields: **Titre** (required), **Date** (default today, max today). Submit **Ajouter**. Closes after the local write (same contract as item quick-add, so e2e can wait for the sheet to close).

## Souvenir detail

- Fields as data-model; **Liens**: "Lier un élément" opens a search sheet over local items (not shopping), workouts and plants; chips removable.
- Delete → undo toast (001 pattern).
- Save shows **« Modifications enregistrées »** status (same as item detail, `data-testid="souvenir-save-status"`).

## Item / workout / plant detail

- Section **Souvenirs liés** (FR-005) listing souvenirs whose `links` include this target, each linking to `/souvenirs/[id]`; hidden when empty. Action **« Créer un souvenir »** prefilled with the link.

## Goal form

1. **Titre**
2. **Période**: Semaine · Mois · Trimestre · Année · Personnalisée (dates)
3. **Type**: « Compter automatiquement » (choose: Livres lus, Films & séries vus, Recettes cuisinées, Séances terminées, Pratique musicale, Soins aux plantes, Souvenirs ajoutés) + nombre · « Compter mes check-ins » + nombre · « Simplement fait / pas fait »

## Goal detail

- Progress `n / target` with a neutral bar (no red); for `domain_count`, a list of the counted events (from contributors) linking to their sources.
- Check-in button (manual kinds): « + Check-in » with optional note and date.
- After `endDate`: dismissible prompt « Un mot sur cette période ? » → reflection textarea (FR-016). Result line copy examples: « 12 sur 12 — objectif atteint », « 8 sur 12 — belle année de lecture ». **Forbidden**: « échec », « raté », « en retard ».
- Actions: Archiver / Réactiver, Supprimer (undo).

## Réalisation celebration (FR-023)

- Small toast/banner « Nouvelle réalisation : 10 livres lus » with link; dismiss sets `celebratedAt`. Max one at a time; queued if several; none for backfilled rows older than 7 days (research R7).
- **Forbidden UI**: locked badges, progress-to-next-badge, points, levels, rankings.

## Empty states (copy direction, 009-safe)

- Fil de vie: « Votre fil de vie se remplit au fil de ce que vous vivez et notez ici. »
- Souvenirs: « Un titre et une date suffisent pour garder un bon moment. »
- Objectifs: « Fixez-vous une intention, à votre rythme. »
- Réalisations: « Vos réalisations apparaîtront ici au fil du temps. »
