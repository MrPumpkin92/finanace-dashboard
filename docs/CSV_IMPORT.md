# CSV Import Guide

This project imports bank CSV files into the local SQLite database and assigns categories automatically where possible.

## Supported CSV Formats

The importer is built to handle the two common export shapes used in the repository tests.

| Format | Typical columns | Notes |
| --- | --- | --- |
| Standard bank export | `Date`, `Description`, `Debit`, `Credit`, `Balance` | Dates like `15/01/2024` work, and debit/credit columns are used to determine the transaction type |
| Credit card export | `Transaction Date`, `Merchant`, `Amount`, `Category` | Dates like `02-03-2024` work, and the category column can help with fallback categorization |

The importer also accepts a generic column mapping in the lower-level import function for custom integrations.

> ⚠️ The current upload flow is strict about CSV files. Do not upload XLSX, PDF, or other bank statement formats.

## How To Export From Common Banks

Exact menu names vary by bank and sometimes by mobile app version, but the export flow is usually similar.

| Bank | Typical export steps |
| --- | --- |
| FNB | Open the account or card transaction history, choose export or download, select CSV, then save the file locally |
| Capitec | Open transactions, find the share/export option, choose CSV or spreadsheet export, then download the statement |
| Standard Bank | Open the transaction list or statement view, select export, choose CSV, and save the file |
| Nedbank | Open account activity or statements, choose download/export, then select CSV or spreadsheet format |

Practical tips:

- Export the smallest time range that contains the transactions you need.
- Use a fresh export if the bank offers date filters.
- If the bank lets you choose between CSV and Excel, pick CSV.
- Keep the original download filename until the import succeeds.

## Column Mapping Guide

The importer looks for common column names automatically.

| Logical field | Common headers it recognizes |
| --- | --- |
| Date | `Date`, `Transaction Date` |
| Description | `Description`, `Merchant` |
| Debit | `Debit` |
| Credit | `Credit` |
| Amount | `Amount` |
| Category | `Category` |

The importer uses these rules when it reads a row:

| Situation | Result |
| --- | --- |
| Credit column has a value | Transaction is treated as income |
| Debit column has a value | Transaction is treated as expense |
| Only Amount column exists | Positive amounts are income, negative amounts are expense |
| No category match is found | The row falls back to `Other` |

Supported date formats include:

| Example | Interpreted as |
| --- | --- |
| `2024-01-15` | ISO date |
| `15/01/2024` | Day/month/year |
| `02-03-2024` | Month-day-year |

## Duplicate Detection

Duplicate rows are blocked using `import_hash`.

How it works:

1. Each CSV data row is trimmed.
2. The importer hashes the full row text with SHA-256.
3. The hash is stored in `transactions.import_hash`.
4. The database has a unique index on `import_hash`, so the same row will be skipped if you import it again.

What you will see:

| Case | Result |
| --- | --- |
| Same row imported twice | The second copy is skipped |
| Similar row with a changed amount or date | Treated as a new transaction |
| Blank or malformed row | Reported as an error or ignored depending on the input |

> ⚠️ Duplicate detection only works if the row text is identical. If the bank changes spacing, punctuation, or date formatting, the row may look new.

## If Rows Land In The Wrong Category

Start with the transaction description. The auto-categorizer uses keyword matching on the description, then falls back to the CSV category column, then `Other`.

Try this checklist:

1. Check the imported row in the Transactions page.
2. Confirm the merchant name contains a keyword that maps to the category you expected.
3. Add or rename a custom category if you want a different default.
4. Adjust the source CSV headers or import flow if the bank export is unusually structured.

If you are building a custom CSV source, keep descriptions consistent. That has the biggest effect on category accuracy.

## Example CSV

```csv
Date,Description,Debit,Credit,Balance
15/01/2024,Woolworths groceries,125.50,,1000.00
16/01/2024,Salary January,,5000.00,6000.00
17/01/2024,Betway deposit,250.00,,5750.00
```

This sample imports as expense, income, and expense respectively.