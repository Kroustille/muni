# Feature Specification: Plants & garden companion

**Feature directory**: `specs/013-plants-garden/`

**Feature Branch**: `013-plants-garden`

**Created**: 2026-10-28

**Status**: Draft (specification only — no `src/` implementation authorized by this document)

**Input**: Valentin wants to **track indoor and outdoor plants**, **seasonal care** (what to do which time of year), a **watering log**, and **outdoor annual vegetables** with sow / transplant / harvest milestones. Every explicit care action (water, fertilize, sow, etc.) MUST appear in **[011 periodic recap](../011-periodic-recap/spec.md)**. French UI, offline-first, companion tone (**no guilt**). **No plant identification API** in MVP.

**Depends on**: Muni foundation (**001**) — auth, offline-first sync, French UI, quick-add capture speed, per-user privacy.

**Serves**: [009](../009-experiences-achievements/spec.md) north star — caring for living things and seasonal rhythm as **personal experience**, not productivity scoring.

**Relationship to [011](../011-periodic-recap/spec.md)**: 013 **owns** plant entities and care logs; 011 **subscribes** via a **`plants` recap contributor** (see [research.md](research.md) § Recap signals). 013 MUST persist **calendar dates** on every recap-eligible action (`occurredAt` / milestone dates) with **backdating** allowed (same pattern as recipe **`cookedDates`** and 012 **`practicedAt`**).

## Decision summary (MVP)

| Topic | Decision |
|-------|----------|
| **Scope** | **Houseplants + garden plants** in one area **Plantes**; each plant tagged **`indoor`**, **`outdoor`**, or **`both`** (location tag — not separate apps). |
| **Watering** | Explicit **Arrosé** action appends a **care event** with type **`water`** and **`occurredAt`**; detail shows **last watered** and optional history list. |
| **Seasonal care** | **Template rows** (per plant or reusable **care profile**) describe **what to do in which season/month** — informational + optional “Fait” that creates a care event; **no push reminders** in MVP. |
| **Vegetables (annual)** | Optional **`vegetable_culture`** rows (potager / culture annuelle) with user-named **milestones** (**semis**, **repiquage**, **récolte**) each recordable with a calendar date → recap lines. |
| **Identification** | **No** photo ID, no Pl@ntNet / iNaturalist API — user types plant name only. |
| **Tone** | French labels; **no** “you forgot to water”, streak loss, or comparison. Missed care stays invisible unless user logs it. |
| **Offline** | Full CRUD offline; sync per foundation LWW + soft delete. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a plant quickly (Priority: P1)

A user opens **Plantes**, quick-adds **name only**, saves offline. The row appears with default location tag **Intérieur** (changeable). They open detail later to set **Extérieur** or **Les deux** and optional notes.

**Why this priority**: Capture speed (constitution II) before care complexity.

**Independent Test**: Add “Monstera”, airplane mode, reopen — row persists.

**Acceptance Scenarios**:

1. **Given** quick-add with title, **When** user saves, **Then** a plant exists with a French location tag and no guilt empty copy.
2. **Given** a plant, **When** user changes location tag to **Extérieur**, **Then** list filter by tag works if exposed (P2 filter; P1 tag editable on detail).
3. **Given** soft-deleted plant, **When** user views list, **Then** plant hidden from default list; historical care events follow soft-delete rules for recap (011 FR-014).

---

### User Story 2 - Log watering (Priority: P1)

On plant detail, the user taps **Arrosé** (default **today**). Optionally picks **another calendar day** (backdate). A watering entry is stored; **Dernier arrosage** updates.

**Why this priority**: Core daily/weekly habit Valentin asked for; primary recap signal.

**Independent Test**: Water twice on two dates; recap week shows two lines if both in period (011).

**Acceptance Scenarios**:

1. **Given** plant detail, **When** user taps **Arrosé** without changing date, **Then** a care event **`water`** with **`occurredAt`** = today is created locally.
2. **Given** plant detail, **When** user records water for a **past** day, **Then** **`occurredAt`** uses that day and **Dernier arrosage** reflects the **latest** calendar date among water events (not latest tap time if backdated older).
3. **Given** same plant and same calendar day, **When** user taps **Arrosé** again, **Then** **at most one** **`water`** event per plant per calendar day (dedupe — same pattern as recipe same-day cook).
4. **Given** a water event, **When** weekly recap loads, **Then** a line appears under **Plantes** with plant name and day (011 contributor).

---

### User Story 3 - Log other care actions (Priority: P1)

The user records **fertilized**, **repotted**, **pruned**, or **other** care from plant detail (or a compact **Soin** menu) with optional note and backdatable date. Each creates a **`plant_care_event`** eligible for recap.

**Why this priority**: Seasonal care beyond watering; feeds 011 without a separate journal.

**Independent Test**: Log **Fertilisé** with backdate; appears in monthly recap under **Plantes**.

**Acceptance Scenarios**:

1. **Given** plant detail, **When** user selects **Fertilisé** and saves, **Then** event type **`fertilize`** is stored with **`occurredAt`**.
2. **Given** multiple care types same day, **When** recap aggregates, **Then** **one recap line per care event** (same plant fertilized and watered same day → two lines or one combined line — **default: one line per event type per day per plant**, subtitle shows care type label in French).
3. **Given** event types **`repot`**, **`prune`**, **`mist`**, **`other`**, **When** logged, **Then** each maps to a stable **`PlantCareEventType`** for recap titles (see Key Entities).

---

### User Story 4 - Seasonal care guide (Priority: P2)

The user attaches **seasonal hints** to a plant: e.g. “Mars–avril : rempotage possible”, “Été : arrosage 2×/semaine”. Hints are **informational** (user-authored or copied from a **care profile** template). Optional **Marquer fait** on a hint creates a linked care event without guilt if ignored.

**Why this priority**: Valentin asked seasonal care; MVP can ship watering + recap first, then templates.

**Independent Test**: Add two seasonal rows for **Hiver** and **Printemps**; mark one done → one recap line.

**Acceptance Scenarios**:

1. **Given** plant detail, **When** user adds a seasonal hint with **season** or **month range** and free-text **action**, **Then** it displays grouped by season (French labels).
2. **Given** a hint, **When** user taps **Fait** with a date, **Then** a care event **`other`** or mapped type is created with optional link to hint id; recap includes it.
3. **Given** no hints, **When** user opens plant, **Then** no shaming empty state — optional “Ajouter un rappel saisonnier” only.

---

### User Story 5 - Vegetable culture milestones (Priority: P2)

For **potager** rows, the user creates a **culture annuelle** (e.g. “Tomates cerises — bac sud”) and records **Semis**, **Repiquage**, **Récolte** (and optional **Éclaircissage**) each with a calendar date. Each milestone is recap-eligible.

**Why this priority**: Distinct from houseplant watering; can follow P1 plant slice.

**Independent Test**: Record **Semis** and **Récolte** on different days; yearly recap shows both under **Plantes**.

**Acceptance Scenarios**:

1. **Given** user creates **culture annuelle** with title, **When** saved, **Then** row appears under **Potager** subsection or filter **Extérieur / légumes**.
2. **Given** culture detail, **When** user logs **Semis** with date, **Then** milestone stored; recap line title includes culture name + milestone label (French).
3. **Given** same milestone type twice same day, **When** user saves again, **Then** dedupe per culture per milestone type per calendar day (or allow two — **default: dedupe**).

---

### User Story 6 - Browse and last care at a glance (Priority: P2)

List view shows plant name, location tag, and **Dernier arrosage** (relative or date). Optional sort by “needs water” is **out of scope** MVP (no inferred guilt).

**Independent Test**: Two plants, water one only — list shows different last-watered dates without “overdue” badge.

**Acceptance Scenarios**:

1. **Given** plants with water history, **When** list loads, **Then** **Dernier arrosage** shows **—** when never watered (neutral).
2. **Given** list, **When** rendered, **Then** no red badges or “en retard” copy (009 anti-pattern).

---

### Edge Cases

- **Timezone**: **`occurredAt`** calendar dates use user local semantics (default **Europe/Paris** until global preference).
- **Backdated water after newer water**: **Dernier arrosage** = max **`occurredAt`** among **`water`** events, not order of entry.
- **Deleted plant**: Care events hidden from recap when plant **`deletedAt`** set (align 011 FR-014).
- **Culture without plant row**: **vegetable_culture** is standalone entity; may optionally link **`plantId`** later — MVP optional link omitted.
- **Indoor/outdoor filter**: Tag **`both`** appears in both filters when filters ship.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide a **Plantes** area (route TBD in planning) with French UI via i18n.
- **FR-002**: Users MUST be able to create a **plant** with **title required**; all other fields optional on first save.
- **FR-003**: Each plant MUST have **`locationTag`**: **`indoor`** | **`outdoor`** | **`both`** (French UI: Intérieur / Extérieur / Les deux).
- **FR-004**: Users MUST log **watering** via explicit **Arrosé** action creating **`plant_care_event`** with **`eventType: water`** and **`occurredAt`** (calendar date).
- **FR-005**: Users MUST be able to **backdate** any care event **`occurredAt`** (not future dates).
- **FR-006**: System MUST **dedupe** at most **one `water` event per plant per calendar day**.
- **FR-007**: Users MUST log additional care types: **`fertilize`**, **`repot`**, **`prune`**, **`mist`**, **`other`** with same date rules.
- **FR-008**: Plant detail MUST show **Dernier arrosage** derived from latest **`water`** **`occurredAt`**.
- **FR-009**: **Seasonal care** hints (P2) MUST be user-editable text grouped by season/month; optional **Fait** creates recap-eligible events.
- **FR-010**: **Vegetable culture** (P2) MUST support milestones **`sow`**, **`transplant`**, **`thin`**, **`harvest`** with calendar dates and French labels (**Semis**, **Repiquage**, **Éclaircissage**, **Récolte**).
- **FR-011**: All care events and vegetable milestones MUST be **offline-first** and sync with LWW + soft delete per user scope.
- **FR-012**: Recap integration MUST expose events to **[011](../011-periodic-recap/spec.md)** **`plants`** contributor (see [research.md](research.md)); no duplicate “journal” table for recap-only data.
- **FR-013**: Copy MUST avoid guilt, overdue shaming, and mandatory care streaks (009 / 011 tone).
- **FR-014**: **No** plant identification API, barcode scan, or automatic species catalog in MVP.

### Key Entities *(conceptual)*

- **Plant**: `{ id, title, locationTag, notes?, createdAt }` — living thing user cares for.
- **PlantCareProfile** (optional template, P2): `{ id, title, seasonalHints[] }` — reusable seasonal text; plants MAY reference **`careProfileId`**.
- **PlantSeasonalHint** (embedded or child): `{ seasonOrMonths, actionText, sortOrder }` — informational; optional **`done`** → spawns event.
- **PlantCareEvent**: `{ id, plantId, eventType, occurredAt, notes?, createdAt }` — atomic recap-eligible action.
  - **`PlantCareEventType`**: `water` | `fertilize` | `repot` | `prune` | `mist` | `other`
- **VegetableCulture** (P2): `{ id, title, locationNote?, variety?, notes? }` — annual crop tracking row.
- **VegetableMilestone**: `{ id, cultureId, milestoneType, occurredAt, notes? }` — **`milestoneType`**: `sow` | `transplant` | `thin` | `harvest`

**Recap line mapping (normative for 011)**:

| Source | Recap title | Subtitle (French) |
|--------|-------------|-------------------|
| **`water`** event | Plant **`title`** | **Arrosé** |
| Other **`PlantCareEventType`** | Plant **`title`** | Localized care label (e.g. **Fertilisé**) |
| **`VegetableMilestone`** | Culture **`title`** | Milestone label (e.g. **Semis**) |

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can add a plant and log **Arrosé** in **≤ 3 taps** from **Plantes** list (quick-add + one tap, or detail + one tap).
- **SC-002**: With **20 plants** and **200 care events**, plant list remains scrollable and interactive within **2 seconds** offline on a mid-tier mobile device.
- **SC-003**: **100%** of P1 acceptance scenarios pass in automated tests when implemented (unit tests for dedupe, last-watered, recap contributor fixtures).
- **SC-004**: After logging care, **[011](../011-periodic-recap/spec.md)** weekly recap shows the event **without app reload** when returning to **Récap** same session (when 011 UI exists).
- **SC-005**: No-guilt copy review passes for plant empty states and list (no “overdue”, no streak loss).

## Assumptions

- **Plantes** is a **new typed domain** (dedicated store/table), not a generic 001 shopping-style list.
- Recap contributor lands in **011** implementation (may ship before or with 013 UI); 013 spec only requires **stable event shapes and dates**.
- Seasonal hints are **user-authored** in MVP — no bundled encyclopedia of species care.
- **Potager** UX may be a filter, tab, or subsection under **Plantes** — planning chooses; entities support both houseplants and annual vegetables.
- Photos of plants are **out of scope** MVP (storage and scope).

## Out of Scope (MVP)

- Plant identification from photo or external API
- Weather API, frost alerts, automatic watering reminders / push notifications
- Shared household multi-user plant ownership
- GIS / map bed planner
- Inventory of pots, soil, fertilizer stock (shopping list remains separate)
- Linking plants to recipe **herbs** or shopping items (future optional)

## Phased delivery summary

| Phase | Deliverables |
|-------|----------------|
| **P1 (MVP)** | Plants CRUD, location tag, water + other care events, last watered, **011 recap contributor** contract satisfied |
| **P2** | Seasonal hints / care profiles, vegetable culture + milestones, list filters by location |

## Future link to other features

- **[011](../011-periodic-recap/spec.md)**: **`plants`** domain section and heatmap segment (updated in same program as this spec).
- Optional future link: note on plant detail that a herb appears in a **recipe** — not MVP.
