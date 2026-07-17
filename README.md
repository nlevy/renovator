# 🏠 Renovator — מנהל השיפוץ

A local-first web app for managing a home renovation end to end: the work to be done, the things to buy, the money, and the schedule. Hebrew, right-to-left, amounts in ₪.

It works with **no account** (all data stays in your browser), and optionally lets a small allow-listed group **sign in with Google to share one live board**.

## Features

- **משימות (Tasks)** — work items with status, contact, price/estimate, dates, dependencies, and payments. Filter, search, and sort; click a tile to edit.
- **רכישות (Purchases)** — things to buy with vendor, quantity, order/delivery dates, product link, estimate vs. final price, and payments.
- **תשלומים (Payments)** — every task/purchase holds a list of payments, so partial payments are first-class. A payment counts as **paid only once its date has arrived**; future-dated payments show as *planned*. Includes a **credit-card installment generator** (split a total into N monthly payments).
- **תקציב (Budget)** — live rollup across tasks + purchases: expected / paid / committed-but-unpaid / still-estimated, an optional overall budget cap with overrun warning, and a category ⇄ room breakdown with drill-down.
- **ציר זמן (Timeline)** — a lightweight Gantt: task bars, purchase delivery milestones, weekly gridlines, a "today" line, overdue highlighting, dependency-order warnings, and a **dependency tree** view.
- **אנשי קשר (Contacts)** — directory with click-to-call/mail, role filter, and per-contact total-paid.
- **לוח בקרה (Dashboard)** — budget strip, this-week events, items needing attention, progress percentages, and import-from-file for a fresh start.
- **Accounts & sharing (optional)** — sign in with Google; allow-listed users share one cloud board with realtime sync. Everyone else stays in guest mode. See [Accounts & cloud sync](#accounts--cloud-sync).
- **Data safety** — autosaves (to `localStorage` as guest, to the cloud when signed in); export/import to a JSON file; rolling local backups with one-click restore; storage-quota warning; delete-my-data controls.

## Tech stack

- **React 19** + **TypeScript** + **Vite 6**
- **Zustand 5** for state, behind a storage-adapter seam (localStorage for guests, Firestore when signed in), with a versioned schema and migration hook
- **Zod** schemas as the single source of truth (reused for form, file-import, and cloud validation)
- **Firebase** (Auth + Firestore) for optional Google sign-in and the shared board
- **Tailwind CSS 4** (RTL via logical properties)
- **date-fns** for date math
- **Vitest** + Testing Library for the domain logic; `@firebase/rules-unit-testing` for security rules

## Getting started

Requires Node.js 22+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run the test suite
npm run build    # typecheck (tsc --noEmit) + production build
npm run preview  # preview the production build
```

Guest mode works out of the box with no configuration. To enable accounts locally, add Firebase config to `.env.local` (see [`.env.example`](.env.example) and [Accounts & cloud sync](#accounts--cloud-sync)); without it, sign-in is simply hidden and the app runs guest-only.

## Accounts & cloud sync

Optional, and layered so guest mode never breaks:

- **Guest (default):** no login; data lives only in this browser's `localStorage`; export/import to file; nothing leaves the device.
- **Account:** sign in with Google. If your email is on the board's allowlist, the app loads and syncs the **shared cloud board** in realtime. If not, you're denied by the security rules and shown a no-access screen (with a "continue as guest" option).
- **Allowlist** is a plain `allowedEmails` array on the `boards/main` Firestore document, edited in the Firebase console — no deploy needed to grant/revoke access.
- On first sign-in with an empty board, the app offers to upload your local data as the board's starting content.

Concurrency is intentionally simple (last-write-wins with realtime refresh) — designed for a household, not simultaneous editing.

## Production build & deploy

The app is a **static single-page app** — no server. Building produces static assets in `dist/` you can host anywhere (currently deployed on Netlify).

```bash
npm run build     # outputs static files to dist/
npm run preview   # serve dist/ locally to sanity-check the build
```

### Firebase / Netlify configuration

Guest mode needs nothing. To run **accounts + cloud sync** in production:

1. **Netlify environment variables** (Site settings → Environment variables) — the Firebase web config. These are safe to expose (access is governed by the Firestore rules). `VITE_*` vars are inlined at **build time**, so after changing them, trigger a **clear-cache redeploy**.
   ```
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   ```
2. **Firebase → Authentication → Settings → Authorized domains** — add your Netlify domain (`*.netlify.app` and any custom domain). Google sign-in is rejected on unlisted domains (`localhost` is allowed by default).
3. **Firebase → OAuth consent screen** (Google Cloud) — if it's in *Testing*, only added test users can sign in. To let allow-listed friends in, add them as test users or **publish** the consent screen (data access stays gated by the allowlist regardless).
4. **Firestore rules** — published from [`firestore.rules`](firestore.rules). Deploy from the repo with `npm run deploy:rules`, or paste in the console.
5. **Board document** — create `boards/main` with an `allowedEmails` array of permitted Google emails.

### SPA routing (important)

Routing is client-side, so the host **must serve `index.html` for unknown paths**, or refreshing a deep link like `/tasks` 404s. This repo ships `public/_redirects` (`/* /index.html 200`) for Netlify. Equivalents: Vercel `vercel.json` rewrite; nginx `try_files $uri $uri/ /index.html`; GitHub Pages copy `dist/index.html` → `dist/404.html`.

### Deploying under a sub-path

Served from a sub-folder (e.g. a GitHub Pages project site)? Set `base: '/renovator/'` in `vite.config.ts` and rebuild. The default `base: '/'` is correct for a root domain.

## Project structure

```
src/
  domain/       Pure, unit-tested business logic (no React):
                schemas + types, derived money math, budget/dashboard/timeline
                rollups, task/purchase filters, dependency forest, migrations.
  data/         Persistence: storage-adapter seam (LocalAdapter/CloudAdapter),
                sync controller, SyncManager (auth↔storage bridge), seed,
                backups, import/export, quota.
  auth/         Firebase init, AuthProvider/useAuth, Google account menu.
  store/        Zustand store (state + actions).
  components/   Reusable UI: form modals, payments editor, status badge,
                paid-progress bar, dependency tree, and ui/ primitives.
  pages/        One screen per route (dashboard, tasks, purchases, budget,
                timeline, contacts, settings).
  utils/        Formatting helpers (currency ₪, dates, today).
  test/         Vitest setup and shared fixtures.
firestore.rules           Security rules (source of truth).
firestore.rules.test.ts   Rules tests — run with `npm run test:rules` (needs JDK 21+).
```

## Design notes

- **Local-first, optionally synced.** Guest mode makes no network calls; the domain layer and UI are identical whether data comes from localStorage or the cloud, because both sit behind one storage adapter.
- **Money/date logic is pure and tested.** All derivations live in `src/domain` as plain functions with unit tests; components never compute money ad hoc.
- **"Paid" is time-aware.** The budget's paid figure reflects money actually out the door as of today and changes on its own as scheduled installments come due.
- **Security is server-side.** Anyone can authenticate, but only allow-listed emails can read/write the board — enforced by Firestore rules, not client code.

See [PRD.md](PRD.md) for the product spec, [PLAN.md](PLAN.md) for the phase-1 milestones, and [MULTIUSER_PLAN.md](MULTIUSER_PLAN.md) for the accounts/cloud design.
