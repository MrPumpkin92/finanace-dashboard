# Personal Finance Dashboard

Track income and expenses in one place, import bank CSVs, and visualize spending —
with a built-in charts dashboard and an **optional** Power BI integration.

The app runs **fully locally with no cloud accounts**. Power BI embedding and
dataset sync are optional extras you can switch on later by adding Azure
credentials; without them, the app automatically runs in "local‑only mode" and
the native dashboard provides all the analytics.

---

## Architecture at a glance

```
frontend/  React + TypeScript + Vite + Tailwind + Recharts   (UI, port 3000)
   │  calls /api/*  (Vite dev server proxies to the backend)
   ▼
src/       Node + Express + TypeScript                        (API, port 5000)
   ├── server/routes/   transactions, categories, import, embed, sync
   ├── data/            SQLite (better-sqlite3) + repositories
   ├── import/          CSV importer (bank Debit/Credit + Amount formats)
   ├── sync/            Power BI queue + manager (optional)
   └── auth/            Azure AD token helper (optional)
        │
        ▼
   data/finance.db      local SQLite database
```

| Layer            | Tech                                                        |
| ---------------- | ---------------------------------------------------------- |
| Frontend         | React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Query |
| Backend          | Node 18+, Express, TypeScript                               |
| Database         | SQLite via `better-sqlite3`                                 |
| CSV parsing      | `csv-parse`                                                 |
| Reporting (opt.) | Power BI (`powerbi-client`) + Azure AD (`@azure/identity`) |

---

## Quick Start (no Azure needed)

Prerequisites: **Node.js 18+** and **npm**.

```bash
# 1. Install backend dependencies (project root)
npm install

# 2. Install frontend dependencies
npm install --prefix frontend

# 3. Create the database and load sample data so the dashboard isn't empty
npm run db:migrate
npm run db:seed:demo
```

Then start the two servers in **two terminals**:

```bash
# Terminal 1 — backend API on http://localhost:5000
npm run dev

# Terminal 2 — frontend on http://localhost:3000
npm run dev --prefix frontend
```

Open **http://localhost:3000**. You should see the Dashboard with KPI cards,
a monthly income‑vs‑expenses chart, a category breakdown, and recent
transactions — all powered by the seeded sample data.

> The frontend dev server proxies every `/api/*` request to the backend on port
> 5000 (see `frontend/vite.config.ts`), so you never deal with CORS in dev.

### Reset the sample data

```bash
npm run db:seed:demo -- --force   # removes seeded demo rows and reseeds
```

---

## Import your first bank CSV

1. Go to the **Transactions** page and use the import control, or
2. Call the API directly:

```bash
curl -X POST http://localhost:5000/api/import/csv \
  -F "file=@data/sample-bank-statement.csv"
```

A ready-made sample lives at [`data/sample-bank-statement.csv`](data/sample-bank-statement.csv).

The importer:

- accepts both **Debit/Credit** columns and a single signed **Amount** column,
- normalizes dates (ISO `YYYY-MM-DD`, `DD/MM/YYYY`, `MM-DD-YYYY`),
- **auto-categorizes** rows by matching the description against keyword rules
  (e.g. `walmart → Groceries`, `uber → Transport`, `netflix → Subscriptions`),
- **de-duplicates** on re-import using a content hash, so importing the same
  file twice is safe (rows come back as `skipped`).

See [docs/CSV_IMPORT.md](docs/CSV_IMPORT.md) for the full format reference.

---

## Useful scripts

| Command                          | What it does                                  |
| -------------------------------- | --------------------------------------------- |
| `npm run dev`                    | Start backend API (port 5000)                 |
| `npm run dev --prefix frontend`  | Start frontend (port 3000)                    |
| `npm run db:migrate`             | Create the SQLite schema + default categories |
| `npm run db:seed:demo`           | Load ~6 months of sample transactions         |
| `npm run db:seed:demo -- --force`| Wipe seeded demo rows and reseed              |
| `npm run typecheck`              | Type-check the backend                        |
| `npm run build --prefix frontend`| Production build of the frontend              |
| `npm test`                       | Run backend tests                             |

---

## Default categories

Seeded automatically on first migration: Salary, Freelance, Groceries, Rent,
Utilities, Transport, Dining Out, Entertainment, Betting, Subscriptions,
Healthcare, Clothing, Savings, Transfer, Other. See [docs/CATEGORIES.md](docs/CATEGORIES.md).

---

## Optional: enable Power BI

The **Report** page embeds a live Power BI report and the **sync** layer can push
the local data into a Power BI dataset and trigger scheduled refreshes. These are
off by default. To turn them on, create a `.env` in the project root:

```env
PORT=5000
DB_PATH=./data/finance.db

# Power BI / Azure (only needed for the Report page + dataset sync)
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
POWER_BI_WORKSPACE_ID=your-workspace-id
POWER_BI_REPORT_ID=your-report-id
POWER_BI_DATASET_ID=your-dataset-id
REFRESH_CRON=0 0 * * *
```

Restart the backend. On startup it logs whether Power BI is enabled or whether it
is "running in local-only mode." Full Azure walkthrough: [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md).

> Keep your client secret out of source control — `.env` is git-ignored.

---

## Troubleshooting

- **Dashboard is empty** — run `npm run db:seed:demo`, or add/import transactions.
- **Frontend can't reach the API** — make sure the backend is running on port
  5000 and you started the frontend with `npm run dev --prefix frontend`.
- **`better-sqlite3` build errors on install** — install the Node build tools for
  your OS (on Windows, a recent Node 18+/22 ships with what you need; otherwise
  `npm i -g windows-build-tools`), then `npm install` again.
- **Report page says "Power BI not configured"** — expected in local-only mode;
  use the Dashboard, or add the Azure variables above.

---

## License

MIT
