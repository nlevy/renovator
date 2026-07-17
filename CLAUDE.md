# CLAUDE.md

Guidance for working in this repo. See [README.md](README.md) for the human-facing overview and [PRD.md](PRD.md)/[PLAN.md](PLAN.md) for product/plan.

## What this is

A local-first, Hebrew (RTL) renovation manager. React 19 + TypeScript + Vite, Zustand (persisted to `localStorage`), Zod, Tailwind 4, date-fns. No backend — phase 1 makes no network calls.

## Commands

```bash
npm run dev      # dev server on :5173
npm test         # vitest (run once)
npm run test:watch
npm run build    # tsc --noEmit + vite build — run before considering a change done
```

There is no lint step; `tsc --noEmit` (part of `build`) is the type gate.

## Architecture

- **`src/domain/`** is the heart of the app: pure functions and Zod schemas, no React. Every non-trivial rule lives here with a colocated `*.test.ts`. Components and pages must not recompute money/date logic — call the domain.
- **`src/store/useStore.ts`** — the single Zustand store, persisted via the `persist` middleware. All mutations are actions on the store; referential cleanup (e.g. deleting a contact unlinks it from tasks/purchases; deleting a task removes it from others' `dependsOn`) happens in the actions.
- **`src/data/`** — `localStorage` concerns only: seed data, rolling backups, import/export, quota check.
- **`src/pages/`** — one screen per route; **`src/components/`** — reusable UI (form modals, `PaymentsEditor`, `PaidProgress`, `DependencyTree`, `ui/` primitives).

## Conventions & invariants

- **Money & dates are pure and tested.** Add logic to `src/domain` with a unit test, then consume it from the UI. Hand-check budget numbers against a fixture (see `budget.test.ts`).
- **"Paid" is time-aware.** A payment counts as paid only when `payment.date <= today`; future-dated payments are *planned*. `paidAmount`, `scheduledAmount`, `paymentStatus`, `budgetTotals`, and the `remaining` sort all take a `today` argument. Pass `todayIso()` from `utils/format` at the call site; never read the clock inside domain functions.
- **Dates are ISO `yyyy-MM-dd` strings** and compared lexicographically (`a < b`). Currency is ₪ via `formatCurrency`.
- **Zod schemas (`domain/schemas.ts`) are the source of truth.** Types are inferred from them and reused for both form validation and import-file validation. `Payable` (in `derive.ts`) is the shared task/purchase money shape.
- **Enums carry Hebrew labels in `domain/labels.ts`.** UI option lists are derived from the label maps, so adding a value to a label map surfaces it everywhere (dropdowns, filters). `Record<Enum, …>` maps make the type-checker enforce full coverage — lean on that.
- **Schema evolution:** adding an enum value is backward-compatible — no version bump. A *structural* change requires bumping `SCHEMA_VERSION` in `schemas.ts` and adding a migration in `domain/migrations.ts` (persisted data and imported files both flow through `migrateToCurrent`).
- **RTL:** use logical Tailwind utilities (`ps-`/`pe-`/`ms-`/`me-`, `inset-inline-start`, `border-s`) rather than left/right. Render phone/email with `dir="ltr"`.
- **Tailwind v4 gotcha:** the `ui/Select` and text inputs bake in `w-full`. To constrain a control's width, wrap it in a fixed-width element rather than passing a `w-*` class (class-order conflicts won't reliably override).
- **User preference:** `git add` new **code** files as they're created (not docs/MD), and do not commit unless asked.

## Adding things — quick recipes

- **A task/purchase status:** add to the enum in `schemas.ts`, the label map in `labels.ts`, the tone map in `components/StatusBadge.tsx`, and the sort-order map in the relevant `*Filters.ts`. TypeScript will flag every map you miss.
- **A sort option:** extend the `*Sort` union and `naturalDir` in `domain/*Filters.ts`, add a comparator case (and `isMissing` handling if some items lack the value), and a label in the page's `sortLabels`.
- **A derived number for a view:** add a pure function in `src/domain` + test, then render it.
