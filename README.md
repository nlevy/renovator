# 🏠 Renovator — מנהל השיפוץ

A local-first web app for managing a home renovation end to end: the work to be done, the things to buy, the money, and the schedule. Hebrew, right-to-left, amounts in ₪. All data lives in your browser — no accounts, no server.

## Features

- **משימות (Tasks)** — work items with status, contact, price/estimate, dates, dependencies, and payments. Filter, search, and sort; click a tile to edit.
- **רכישות (Purchases)** — things to buy with vendor, quantity, order/delivery dates, product link, estimate vs. final price, and payments.
- **תשלומים (Payments)** — every task/purchase holds a list of payments, so partial payments are first-class. A payment counts as **paid only once its date has arrived**; future-dated payments show as *planned*. Includes a **credit-card installment generator** (split a total into N monthly payments).
- **תקציב (Budget)** — live rollup across tasks + purchases: expected / paid / committed-but-unpaid / still-estimated, an optional overall budget cap with overrun warning, and a category ⇄ room breakdown with drill-down.
- **ציר זמן (Timeline)** — a lightweight Gantt: task bars, purchase delivery milestones, weekly gridlines, a "today" line, overdue highlighting, dependency-order warnings, and a **dependency tree** view.
- **אנשי קשר (Contacts)** — directory with click-to-call/mail, role filter, and per-contact total-paid.
- **לוח בקרה (Dashboard)** — budget strip, this-week events, items needing attention, and progress percentages.
- **Data safety** — everything autosaves to `localStorage`; export/import to a JSON file; automatic rolling backups with one-click restore; storage-quota warning.

## Tech stack

- **React 19** + **TypeScript** + **Vite 6**
- **Zustand 5** for state, persisted to `localStorage` with a versioned schema and migration hook
- **Zod** schemas as the single source of truth (reused for form *and* import validation)
- **Tailwind CSS 4** (RTL via logical properties)
- **date-fns** for date math
- **Vitest** + Testing Library for the domain logic

## Getting started

Requires Node.js 22+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run the test suite
npm run build    # typecheck (tsc --noEmit) + production build
npm run preview  # preview the production build
```

## Production build & deploy

The app is a fully **static single-page app** — no backend, no environment variables, no runtime configuration. Building produces a plain folder of static assets you can host anywhere.

```bash
npm run build     # outputs static files to dist/
npm run preview   # serve dist/ locally to sanity-check the build
```

Deploy by uploading the contents of `dist/` to any static host or CDN.

### SPA routing (important)

Routing is client-side (`react-router`), so the host **must serve `index.html` for unknown paths**. Without this, loading or refreshing a deep link like `/tasks` returns a 404. Configure a catch-all fallback:

- **Netlify** — add a `public/_redirects` file containing:
  ```
  /*  /index.html  200
  ```
- **Vercel** — add `vercel.json`:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```
- **nginx** — in the server block:
  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```
- **GitHub Pages** — it has no server-side fallback; copy `dist/index.html` to `dist/404.html` after building so unknown routes resolve.

### Deploying under a sub-path

If the app is served from a sub-path (e.g. a GitHub Pages project site at `https://user.github.io/renovator/`), set the base path so asset URLs resolve, then rebuild:

```ts
// vite.config.ts
export default defineConfig({ base: '/renovator/', /* …plugins, test… */ })
```

For a root domain (or most static hosts) the default `base: '/'` is correct and no change is needed.

### Data & privacy note

All data lives in the visitor's browser `localStorage`, scoped to the origin it's served from. There is nothing to provision or back up server-side, but it also means data does **not** follow the user across devices or domains — moving hosts (a different origin) starts fresh. Use the in-app **Settings → ייצוא לקובץ** to carry data over.

## Project structure

```
src/
  domain/       Pure, unit-tested business logic (no React):
                schemas + types, derived money math, budget/dashboard/timeline
                rollups, task/purchase filters, dependency forest, migrations.
  data/         localStorage concerns: seed data, backups, import/export, quota.
  store/        Zustand store (state + actions), persisted to localStorage.
  components/   Reusable UI: form modals, payments editor, status badge,
                paid-progress bar, dependency tree, and ui/ primitives.
  pages/        One screen per route (dashboard, tasks, purchases, budget,
                timeline, contacts, settings).
  utils/        Formatting helpers (currency ₪, dates, today).
  test/         Vitest setup and shared fixtures.
```

## Design notes

- **Local-first.** Phase 1 makes no network calls. Your data never leaves the device unless you export it. Use **Settings → ייצוא לקובץ** regularly for an off-device backup.
- **Money/date logic is pure and tested.** All derivations live in `src/domain` as plain functions with unit tests; components never compute money ad hoc.
- **"Paid" is time-aware.** The budget's paid figure reflects money actually out the door as of today and changes on its own as scheduled installments come due.

See [PRD.md](PRD.md) for the product spec and [PLAN.md](PLAN.md) for the development milestones.
