# Interview Guide — Finance Dashboard ↔ OPG Darlington Maintenance Reporting

This guide does three things:

1. Explains **everything this project does** and how the pieces fit together.
2. Maps each feature to the **OPG Maintenance Department** responsibilities you'll
   be interviewed on.
3. Gives you **concepts + talking points + likely Q&A** so you can speak
   confidently about Power BI, Excel/Power Query, KPIs, data cleaning, and
   automated refreshes.

> The big idea: a **finance dashboard and a maintenance dashboard are the same
> problem**. You take messy source spreadsheets, clean and combine them, model
> the data, compute KPIs, and publish a dashboard leaders can read at a glance —
> then automate the refresh so it stays current. Swap "transaction" for "work
> order" and "category/spend" for "work type/backlog" and you have the OPG job.

---

## Part 1 — What this project does (end to end)

### The data flow

```
Raw bank CSVs  ──▶  Import + clean + categorize  ──▶  SQLite (one clean table)
                                                          │
                                   ┌──────────────────────┼───────────────────────┐
                                   ▼                       ▼                        ▼
                            Built-in dashboard      REST API (/api/*)        Power BI sync (opt.)
                            (KPIs + charts)         transactions/summary     push dataset + refresh
```

### The four capabilities (and where they live in the code)

1. **Link & clean up spreadsheets** — `src/import/csvImporter.ts`
   - Reads a bank CSV, handles two real-world layouts (separate **Debit/Credit**
     columns *or* a single signed **Amount** column).
   - **Normalizes** inconsistent data: dates in multiple formats → ISO
     `YYYY-MM-DD`; currency strings like `"$1,200.00"` or `"(45.99)"` → numbers.
   - **Auto-categorizes** each row by matching the description against keyword
     rules (`walmart → Groceries`, `uber → Transport`, …).
   - **De-duplicates** with a content hash so re-importing the same file doesn't
     create duplicates. This is exactly the "link and clean up maintenance
     spreadsheets" task.

2. **Build & update leader dashboards** — `frontend/src/pages/Dashboard.tsx` +
   `frontend/src/pages/ReportPage.tsx`
   - A built-in dashboard (Recharts) with KPI cards and charts that refresh
     automatically from the database.
   - An optional embedded **Power BI** report for the same data.

3. **Track & report key measures** — `src/server/routes/transactions.ts`
   - `/api/transactions/summary` and `/api/transactions/analytics` compute the
     headline numbers: totals, net, savings rate, month-by-month trend, and a
     breakdown by category. These are the finance equivalents of maintenance
     KPIs (see Part 2).

4. **Make recurring reports faster to refresh** — `src/sync/`
   - A **queue + manager** pattern (`syncQueue.ts`, `syncManager.ts`) batches
     changes and pushes them to a Power BI dataset, plus a **scheduled refresh**
     (cron). This is "make recurring reports easier and faster to refresh."

### The architecture, in one breath

> "It's a TypeScript full-stack app. The backend is Express with a SQLite
> database accessed through repository classes. CSVs are cleaned and imported by
> a dedicated importer module. The React/Vite frontend calls a REST API and
> renders KPIs and charts with Recharts. There's an optional Power BI integration
> — an Azure-authenticated client that embeds a report and a sync layer that
> pushes data and triggers dataset refreshes on a schedule. If the Azure
> credentials aren't present, the app detects that and runs in local-only mode
> instead of failing."

---

## Part 2 — Mapping to the OPG role

The posting says the team "tracks and supports maintenance work to keep equipment
running safely and reliably" and gives leaders "clear visibility into
performance." Here's the translation table:

| OPG / Maintenance concept        | This project's equivalent                 | Where |
| -------------------------------- | ----------------------------------------- | ----- |
| Work order / maintenance record  | Transaction row                           | `models/Transaction.ts` |
| Work type (PM, corrective, …)    | Category                                  | `models/Category.ts` |
| Spreadsheets from many teams     | Bank/card CSV exports                      | `import/csvImporter.ts` |
| Cleaning & combining sheets      | Import: normalize + categorize + dedupe   | `import/csvImporter.ts` |
| **Backlog** (open work)          | Outstanding / pending amounts             | summary aggregation logic |
| **Completion rate**              | Net savings rate / % complete             | `analytics` endpoint |
| Leader dashboard                 | Dashboard page + Power BI report          | `pages/Dashboard.tsx` |
| Recurring report refresh         | Sync queue + scheduled dataset refresh    | `sync/syncManager.ts` |
| Approved tools (Power BI, Excel) | Power BI integration + CSV/Power Query    | `sync/`, `import/` |

### The maintenance KPIs you should be able to define

- **Backlog** — count (or hours) of work orders that are *open / not yet
  completed*. Leaders watch the trend: is the backlog growing or shrinking?
  *In this app:* the analog is summing outstanding items / pending categories.
- **Completion rate / schedule compliance** — % of planned work completed on
  time in a period. *In this app:* `savingsRate` = net ÷ income is the same
  "ratio KPI" calculation pattern (a part over a whole, as a %).
- **Aging** — how long items have been open (0–7 days, 8–30, 30+). Same idea as
  bucketing transactions by date.
- **Mean time to repair (MTTR)** / **PM compliance** — averages and ratios over
  a date range; identical aggregation to the monthly trend computation here.

> If asked "how would you track backlog and completion in Power BI?": *Model the
> work-order table, add a calculated column for status, then use DAX measures —
> `Backlog = CALCULATE(COUNTROWS(WorkOrders), WorkOrders[Status]="Open")` and
> `Completion % = DIVIDE([Completed], [Total])`. Put them on KPI cards with a
> trend line by month and a slicer for unit/system.*

---

## Part 3 — Concepts to be ready for

### Power BI

- **What it is:** Microsoft's BI tool. You connect to data, shape it in **Power
  Query**, model it (relationships + **DAX** measures), build visuals, and
  **publish** to the Power BI Service where others view dashboards.
- **Dataset vs report vs dashboard:** dataset = the modeled data; report =
  multi-page interactive visuals on a dataset; dashboard = pinned tiles for an
  at-a-glance view.
- **Refresh:** scheduled refresh re-pulls the source on a cadence; a **gateway**
  is needed when the source is on-prem. *This project automates a refresh via
  the API — `src/sync/exportAndRefresh.ts`.*
- **Embedding:** `ReportPage.tsx` uses `powerbi-client` with an embed token from
  an Azure service principal (`src/auth/auth.ts`, `src/api/powerBIClient.ts`).
- **DAX basics:** `SUM`, `CALCULATE` (filter context), `DIVIDE` (safe divide),
  time-intelligence like `SAMEPERIODLASTYEAR`.

### Excel — Power Query & PivotTables

- **Power Query (Get & Transform):** the Excel/Power BI feature for **cleaning**
  data with *repeatable, recorded steps* — remove columns, change types, split
  columns, unpivot, merge/append queries (join sheets), replace values, filter
  rows. The key selling point: **you do it once and it replays every refresh.**
  *This project's `csvImporter.ts` is the same idea expressed in code:
  normalize types, derive columns, combine sources, filter bad rows.*
- **Append vs Merge:** Append = stack rows from multiple sheets (same columns);
  Merge = join on a key (like a VLOOKUP/SQL join). "Linking spreadsheets" usually
  means Merge/Append in Power Query.
- **PivotTables:** drag-and-drop aggregation — rows/columns/values/filters — to
  summarize (e.g. backlog by unit by month). A pivot **is** a GROUP BY.
- **Useful functions:** `XLOOKUP`/`VLOOKUP`, `SUMIFS`, `COUNTIFS`, `IFERROR`,
  `TEXT`, `EOMONTH`.

### Data cleaning (what "messy" looks like and how you fix it)

- Inconsistent date formats → standardize to ISO.
- Numbers stored as text, currency symbols, thousands separators, `(123)` for
  negatives → strip and parse.
- Duplicate rows → de-dupe on a key/hash.
- Inconsistent category labels ("Grocery" vs "Groceries") → map to a canonical set.
- Missing/blank required fields → validate and report rather than silently drop.
  *All of these are handled in `csvImporter.ts` — point to it.*

### SharePoint / OneDrive

- Where the source spreadsheets and published reports live. Power BI/Power Query
  can connect directly to a file on SharePoint/OneDrive so the refresh always
  reads the latest version — no emailing files around. Good practice: one
  "source of truth" file/folder + version history.

### ChatOPG / approved AI tools

- Frame it as: "I use AI assistants to speed up writing DAX/Power Query, drafting
  documentation, and sanity-checking logic — while keeping data in approved
  tools and verifying outputs myself." Emphasize **documentation and
  repeatability**, which the posting explicitly values.

---

## Part 4 — A 90-second demo script

1. `npm run db:seed:demo` then start both servers; open the Dashboard.
2. "Up top are the **KPIs** — total income, expenses, net savings, and a savings
   **rate** — the same shape as backlog/completion metrics."
3. "This trend chart is a **monthly aggregation** — exactly what a leader wants:
   are we improving over time?"
4. "The category breakdown is a **GROUP BY** rendered as a bar chart — like
   backlog by work type."
5. Go to Transactions → import `data/sample-bank-statement.csv`. "The importer
   **cleaned and categorized** these automatically, and if I import again it
   **de-duplicates**."
6. "The Report page embeds **Power BI** when configured; the sync layer pushes
   data and triggers a **scheduled refresh** so recurring reports stay current
   with no manual work."

---

## Part 5 — Likely questions & strong answers

**Q: How would you take five messy team spreadsheets and build a leader
dashboard?**
A: Land them in one place (SharePoint), use **Power Query** to clean each
(types, dates, canonical categories) and **Append/Merge** into one table, model
it, write DAX measures for the KPIs (backlog, completion %), build visuals with
slicers, publish to the Service, and set a **scheduled refresh**. I'd document the
steps so anyone can maintain it.

**Q: How do you make sure a report doesn't break when next month's file arrives?**
A: Keep the file name/location and column structure stable, do all transforms in
Power Query (so they replay), handle errors explicitly (e.g. `IFERROR`, "remove
errors"), and validate row counts after refresh. In code I do the same:
normalize, validate, and **de-dupe on a hash** so re-imports are safe.

**Q: What's the difference between Power Query and DAX?**
A: Power Query **shapes the data before it loads** (ETL, recorded steps). DAX
**calculates on the loaded model** at query time (measures, filter context).
Clean in Power Query; calculate KPIs in DAX.

**Q: How would you track backlog over time?**
A: A measure counting open work orders, plotted by month with a slicer per unit;
add aging buckets by date difference. Conceptually identical to the monthly trend
aggregation in this app.

**Q: Walk me through your finance dashboard project.**
A: Use the "architecture in one breath" paragraph in Part 1, then show the demo
script in Part 4.

**Q: Why TypeScript / why a database instead of just Excel?**
A: A database gives one clean, validated source of truth, fast aggregation, and a
stable API for multiple front-ends (the built-in dashboard *and* Power BI). Excel
is great for ad-hoc analysis and the cleaning layer (Power Query); for a
recurring, multi-user report you want it modeled once and refreshed
automatically.

---

## Part 6 — Honest scope notes (don't get caught out)

- Power BI embedding/sync require Azure credentials; locally the app runs in
  **local-only mode** and the built-in dashboard provides the analytics. Be
  upfront that you built the integration and the graceful fallback.
- Auth is a simplified mock user for local dev (`app.ts`); production would use
  real Azure AD sign-in.
- The category keyword rules are a pragmatic starting point; a production system
  would let users correct categories and learn from those corrections.

Know the code well enough to open any file named above and explain it. Good luck.
