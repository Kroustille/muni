# Quickstart: Souvenirs & progression (015)

Manual and e2e validation scenarios, one per user story. Run against a signed-in account (`yarn dev` with Postgres + Mailpit, or CI). French UI.

## US1 — Capture a souvenir

1. From any screen tap **Ajouter → Souvenir**, type « Concert au Zénith », tap **Ajouter**.
   - ✅ Sheet closes; **Souvenirs** tab lists it with today's date.
2. Open it, set date to last Saturday, mood **Joyeux**, lieu « Paris », favori on, **Lier un élément** → a book. **Enregistrer**.
   - ✅ « Modifications enregistrées »; open the book → **Souvenirs liés** shows the souvenir.
3. Quick-add with title « &nbsp;&nbsp; » → ✅ validation message, nothing saved.
4. Open a souvenir, go offline, edit the title, save, reconnect → ✅ change synced (second browser profile shows it).
5. Search « Zénith » → ✅ souvenir appears.

## US2 — Fil de vie

1. Have one souvenir (yesterday) and one book marked **Lu** today.
   - ✅ `/souvenirs` shows today: book line (Livres colour); yesterday: souvenir.
2. Filter to **Souvenirs** only → ✅ book line hidden; reload → filter remembered.
3. Set the book back to **À lire** → ✅ its line disappears.
4. Jump to a month a year ago → ✅ that month loads; scroll reaches earlier months.

## US3 — Objectifs

1. **Progression → Nouvel objectif**: « Lire 3 livres ce mois-ci », Mois, Compter automatiquement → Livres lus, 3.
2. Mark one book **Lu** → ✅ goal shows **1 / 3** without any input.
3. Create « Apprendre à faire du pain », Compter mes check-ins, 4 → add 2 check-ins → ✅ **2 / 4**.
4. With an existing reading year goal → ✅ it appears with « Objectif annuel » and current progress.
5. Archive a goal → ✅ leaves active list, no guilt copy.
6. Custom goal ending yesterday → ✅ « Un mot sur cette période ? » prompt; reflection saved.

## US4 — Ce jour-là

1. Create a souvenir dated today's date one year ago.
   - ✅ Accueil shows **Ce jour-là**: « Il y a 1 an : … ».
2. **Masquer pour aujourd'hui**, reload → ✅ hidden.
3. Settings → turn off **Afficher Ce jour-là** → ✅ never shown.

## US5 — Réalisations

1. New account: mark the first book **Lu**.
   - ✅ Toast « Nouvelle réalisation : premier livre lu » once; **Réalisations** lists it dated today; Fil de vie shows it.
2. Reload / open a second device → ✅ no second toast; still one réalisation.
3. Mark the book back **À lire** → ✅ réalisation stays.
4. Add a manual réalisation « Premier semi-marathon » dated last month → ✅ appears in list and Fil de vie at that date.

## US6 — Moments forts

1. Favourite souvenir this month + a réalisation this month.
   - ✅ **Récap → Mois** shows **Moments forts** with the favourite first.
2. **Récap → Jour** → ✅ no Moments forts section.
3. Empty month → ✅ section hidden.

## Tone check (SC-005)

Scan all new screens and copy for: no « en retard », « échec », « raté », streak loss, rankings, locked badges. `tests/unit/memories-growth/tone.test.ts` enforces the i18n part.
