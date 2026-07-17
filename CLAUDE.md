# CLAUDE.md

Guidance for working in this repo. See [README.md](README.md) for the human-facing overview and [PRD.md](PRD.md)/[PLAN.md](PLAN.md) for product/plan.

## What this is

A local-first, Hebrew (RTL) renovation manager. React 19 + TypeScript + Vite, Zustand, Zod, Tailwind 4, date-fns. Works with no account (localStorage), and optionally syncs a single shared board to Firebase (Auth + Firestore) for an allow-listed group. Guest mode makes no network calls.

## Commands

```bash
npm run dev      # dev server on :5173
npm test         # vitest (run once)
npm run test:watch
npm run build    # tsc --noEmit + vite build — run before considering a change done
npm run test:rules   # Firestore security-rules tests via the emulator (needs JDK 21+)
npm run deploy:rules # deploy firestore.rules to Firebase
```

Security rules live in `firestore.rules` (source of truth); their tests
(`firestore.rules.test.ts`) run against the emulator and are excluded from the
default `npm test`.

There is no lint step; `tsc --noEmit` (part of `build`) is the type gate.

## Architecture

- **`src/domain/`** is the heart of the app: pure functions and Zod schemas, no React. Every non-trivial rule lives here with a colocated `*.test.ts`. Components and pages must not recompute money/date logic — call the domain.
- **`src/store/useStore.ts`** — the single Zustand store (no `persist` middleware). All mutations are actions; referential cleanup (deleting a contact unlinks it from tasks/purchases; deleting a task removes it from others' `dependsOn`) happens in the actions. `hydrate(data)` sets the whole dataset without taking a backup (used by initial load and remote updates).
- **`src/data/`** — persistence. A `StorageAdapter` seam (`adapters/`) has `LocalAdapter` (guest localStorage; migrates the legacy `persist` envelope) and `CloudAdapter` (Firestore `boards/{id}` doc; AppData stored as a JSON string; realtime `onSnapshot` with a `writerNonce` echo guard). `sync.ts` is the controller (load → hydrate → debounced saves out, remote in). `SyncManager.tsx` bridges React auth state to the adapter: guest→local, allow-listed→cloud, denied→no-access screen; also seed data, backups, import/export, quota.
- **`src/auth/`** — Firebase init (env-configured, guarded when absent), `AuthProvider`/`useAuth`, and the header account menu.
- **`src/pages/`** — one screen per route; **`src/components/`** — reusable UI (form modals, `PaymentsEditor`, `PaidProgress`, `DependencyTree`, `ImportButton`, `ui/` primitives).

**Bootstrap:** `main.tsx` runs `initSync()` (local) before first paint for a flash-free guest load, then `SyncManager` switches to the cloud adapter once an allow-listed user is known.

## Conventions & invariants

- **Money & dates are pure and tested.** Add logic to `src/domain` with a unit test, then consume it from the UI. Hand-check budget numbers against a fixture (see `budget.test.ts`).
- **"Paid" is time-aware.** A payment counts as paid only when `payment.date <= today`; future-dated payments are *planned*. `paidAmount`, `scheduledAmount`, `paymentStatus`, `budgetTotals`, and the `remaining` sort all take a `today` argument. Pass `todayIso()` from `utils/format` at the call site; never read the clock inside domain functions.
- **Dates are ISO `yyyy-MM-dd` strings** and compared lexicographically (`a < b`). Currency is ₪ via `formatCurrency`.
- **Zod schemas (`domain/schemas.ts`) are the source of truth.** Types are inferred from them and reused for both form validation and import-file validation. `Payable` (in `derive.ts`) is the shared task/purchase money shape.
- **Enums carry Hebrew labels in `domain/labels.ts`.** UI option lists are derived from the label maps, so adding a value to a label map surfaces it everywhere (dropdowns, filters). `Record<Enum, …>` maps make the type-checker enforce full coverage — lean on that.
- **Schema evolution:** adding an enum value is backward-compatible — no version bump. A *structural* change requires bumping `SCHEMA_VERSION` in `schemas.ts` and adding a migration in `domain/migrations.ts` (persisted data and imported files both flow through `migrateToCurrent`).
- **RTL:** use logical Tailwind utilities (`ps-`/`pe-`/`ms-`/`me-`, `inset-inline-start`, `border-s`) rather than left/right. Render phone/email with `dir="ltr"`.
- **Tailwind v4 gotcha:** the `ui/Select` and text inputs bake in `w-full`. To constrain a control's width, wrap it in a fixed-width element rather than passing a `w-*` class (class-order conflicts won't reliably override).
- **Persistence goes through the adapter, never directly.** UI/store code must not read/write `localStorage` or Firestore itself — go through the store + `sync.ts`. Keep the domain layer and UI identical regardless of guest vs. account mode.
- **Auth vs. authorization:** anyone can sign in (Google); only allow-listed emails can read/write the board, enforced by `firestore.rules` (server-side). Never gate data access with client checks alone. Firebase web config is public — it lives in `VITE_FIREBASE_*` env vars; when absent the app runs guest-only.
- **Security rules:** `firestore.rules` is the source of truth. The allowlist guard belongs on `update` only — `request.resource` doesn't exist on reads, so guarding `read` with it denies all reads (a bug we already hit). Test with `npm run test:rules`.
- **User preference:** `git add` new **code** files as they're created (not docs/MD), and do not commit unless asked.

## Adding things — quick recipes

- **A task/purchase status:** add to the enum in `schemas.ts`, the label map in `labels.ts`, the tone map in `components/StatusBadge.tsx`, and the sort-order map in the relevant `*Filters.ts`. TypeScript will flag every map you miss.
- **A sort option:** extend the `*Sort` union and `naturalDir` in `domain/*Filters.ts`, add a comparator case (and `isMissing` handling if some items lack the value), and a label in the page's `sortLabels`.
- **A derived number for a view:** add a pure function in `src/domain` + test, then render it.
