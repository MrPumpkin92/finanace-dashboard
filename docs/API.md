# API Reference

The backend exposes a small REST API for transactions, categories, import, Power BI embed, sync status, and health checks.

## General Notes

- Base URL: `/api`
- Most routes use a simple mock user context from the `x-user-id` header.
- If `x-user-id` is missing, the server uses `default-user`.
- Responses use JSON unless the route is a CSV download.

> ⚠️ The current server does not expose every route that a frontend client might expect. This document lists the routes that exist in the backend code.

## Health

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/health` | None | `{ status, timestamp, uptime }` | 500 |

Example:

```bash
curl http://localhost:3000/api/health
```

## Transactions

### List Transactions

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/transactions` | None | JSON array of transactions | 400, 500 |

Query parameters:

| Parameter | Meaning |
| --- | --- |
| `month` | Month filter in `YYYY-MM` format |
| `category` | Category ID |
| `type` | `income` or `expense` |
| `search` | Search term |
| `limit` | Max rows returned, default `100` |

Response shape:

```json
[
  {
    "id": "string",
    "description": "string",
    "amount": 123.45,
    "categoryId": "string",
    "type": "income",
    "date": "2024-01-15"
  }
]
```

Example:

```bash
curl "http://localhost:3000/api/transactions?month=2024-01&limit=50" \
  -H "x-user-id: demo-user"
```

### Create Transaction

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| POST | `/api/transactions` | `{ date, amount, description, categoryId, type, notes? }` | Created transaction object | 400, 500 |

Request example:

```json
{
  "date": "2024-01-15",
  "amount": 45.99,
  "description": "Woolworths groceries",
  "categoryId": "category-id",
  "type": "expense",
  "notes": "Weekly shop"
}
```

Example:

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -d '{"date":"2024-01-15","amount":45.99,"description":"Woolworths groceries","categoryId":"category-id","type":"expense"}'
```

### Transaction Summary

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/transactions/summary` | None | `{ totalIncome, totalExpenses, netSavings, byCategory, dailyTotals }` | 400, 500 |

Query parameters:

| Parameter | Meaning |
| --- | --- |
| `month` | Optional month in `YYYY-MM` format |

Response shape:

```json
{
  "totalIncome": 5000,
  "totalExpenses": 1234.56,
  "netSavings": 3765.44,
  "byCategory": [
    { "categoryName": "Groceries", "total": 200, "count": 3 }
  ],
  "dailyTotals": [
    { "date": "2024-01-15", "income": 0, "expenses": 45.99 }
  ]
}
```

Example:

```bash
curl "http://localhost:3000/api/transactions/summary?month=2024-01" \
  -H "x-user-id: demo-user"
```

### Update Transaction

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| PUT | `/api/transactions/:id` | Partial transaction fields | Updated transaction object | 400, 403, 404, 500 |

Example:

```bash
curl -X PUT http://localhost:3000/api/transactions/transaction-id \
  -H "Content-Type: application/json" \
  -H "x-user-id: demo-user" \
  -d '{"amount":55.99,"notes":"Updated amount"}'
```

### Delete Transaction

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| DELETE | `/api/transactions/:id` | None | Soft-deleted transaction object | 403, 404, 500 |

Example:

```bash
curl -X DELETE http://localhost:3000/api/transactions/transaction-id \
  -H "x-user-id: demo-user"
```

### Import Transactions From CSV

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| POST | `/api/transactions/import` | Multipart form with `file` | `{ imported, skipped, errors }` | 400, 500 |

This route is the simpler CSV upload path used by the transaction router.

Example:

```bash
curl -X POST http://localhost:3000/api/transactions/import \
  -H "x-user-id: demo-user" \
  -F "file=@./statement.csv"
```

## Categories

### List Categories

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/categories` | None | Array of categories | 500 |

Query parameters:

| Parameter | Meaning |
| --- | --- |
| `active` | Set to `true` or `false` to filter active categories |
| `type` | Filter by `income`, `expense`, or `transfer` |

Example:

```bash
curl "http://localhost:3000/api/categories?active=true"
```

### Create Category

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| POST | `/api/categories` | `{ name, type, description?, color?, icon? }` | Created category object | 400, 409, 500 |

Example:

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"Fuel","type":"expense","color":"#2563eb","icon":"⛽"}'
```

### Get Category

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/categories/:id` | None | Category object | 404, 500 |

Example:

```bash
curl http://localhost:3000/api/categories/category-id
```

### Update Category

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| PUT | `/api/categories/:id` | Partial category fields | Updated category object | 404, 500 |

Example:

```bash
curl -X PUT http://localhost:3000/api/categories/category-id \
  -H "Content-Type: application/json" \
  -d '{"icon":"⛽","color":"#0ea5e9"}'
```

### Delete Category

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| DELETE | `/api/categories/:id` | None | Empty body with status `204` | 404, 500 |

Example:

```bash
curl -X DELETE http://localhost:3000/api/categories/category-id
```

## CSV Import

### Upload CSV With Enhanced Importer

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| POST | `/api/import/csv` | Multipart form with `file` | `201` or `207` with import result | 400, 500 |

This route uses the higher-level CSV importer and accepts optional form fields such as `dateFormat` and `amountMultiplier`.

Example:

```bash
curl -X POST http://localhost:3000/api/import/csv \
  -F "file=@./statement.csv" \
  -F "dateFormat=YYYY-MM-DD" \
  -F "amountMultiplier=1"
```

### Download CSV Template

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/import/template` | None | CSV file download | None in normal flow |

Example:

```bash
curl -o transaction_template.csv http://localhost:3000/api/import/template
```

## Power BI Embed

These routes depend on `POWER_BI_WORKSPACE_ID` and `POWER_BI_REPORT_ID`.

### Get Embed Config

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/embed/config` | None | Embed token/config object | 400, 500 |

Example:

```bash
curl http://localhost:3000/api/embed/config
```

### Refresh Dataset

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| POST | `/api/embed/refresh` | `{ datasetId }` | `{ status: 'initiated' }` | 400, 500 |

Example:

```bash
curl -X POST http://localhost:3000/api/embed/refresh \
  -H "Content-Type: application/json" \
  -d '{"datasetId":"dataset-id"}'
```

### Get Refresh History

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/embed/refresh-history/:datasetId` | None | Array of refresh history entries | 400, 500 |

Example:

```bash
curl "http://localhost:3000/api/embed/refresh-history/dataset-id?top=10"
```

### Get Report Pages

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/embed/pages/:reportId` | None | Array of report page objects | 400, 500 |

Example:

```bash
curl http://localhost:3000/api/embed/pages/report-id
```

## Sync

### Get Sync Status

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| GET | `/api/sync/status` | None | `{ lastSyncAt, status, pendingCount }` | 500 |

Example:

```bash
curl http://localhost:3000/api/sync/status
```

### Trigger Full Sync

| Method | Path | Request body | Success response | Error codes |
| --- | --- | --- | --- | --- |
| POST | `/api/sync/trigger` | None | `{ status: 'pending', message: 'Full sync started' }` | 500 |

This runs the push-dataset sync and the CSV export/refresh sync.

Example:

```bash
curl -X POST http://localhost:3000/api/sync/trigger
```

## Using Summary Data For Your Own Reports

The endpoint most people want for custom reporting is `GET /api/transactions/summary`.

It returns:

| Field | Meaning |
| --- | --- |
| `totalIncome` | Sum of all income transactions in the selected period |
| `totalExpenses` | Sum of all expense transactions in the selected period |
| `netSavings` | `totalIncome - totalExpenses` |
| `byCategory` | Category totals and counts, sorted by total descending |
| `dailyTotals` | Daily income and expense totals, sorted by date ascending |

You can use this response to build your own charts, notebooks, or Power BI visuals without touching the raw transaction rows. For example, a simple monthly chart only needs `dailyTotals`, while a category bar chart can use `byCategory`.

If you build a separate reporting app, start with this endpoint before reading raw transactions. It already does the grouping for you.