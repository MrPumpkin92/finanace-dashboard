# Categories

This app uses categories to group transactions for the dashboard and Power BI reports. Good categories make the monthly totals, charts, and CSV auto-categorization much more reliable.

## Built-In Categories

The database seeds these categories on first run.

| Name | Icon | Type | Intended use |
| --- | --- | --- | --- |
| Salary | 💼 | income | Regular paycheck or payroll income |
| Freelance | 💻 | income | Contract work, side gigs, and freelance income |
| Groceries | 🛒 | expense | Supermarkets, food shops, and household staples |
| Rent | 🏠 | expense | Rent, lease payments, and housing payments |
| Utilities | 💡 | expense | Electricity, water, internet, and other household bills |
| Transport | 🚗 | expense | Uber, fuel, taxi, parking, and commuting costs |
| Dining Out | 🍽️ | expense | Restaurants, takeout, coffee, and eating out |
| Entertainment | 🎬 | expense | Movies, events, hobbies, and general leisure |
| Betting | 🎲 | expense | Betting sites, gambling, and similar transactions |
| Subscriptions | 📱 | expense | Netflix, Spotify, Prime, DSTV, and recurring services |
| Healthcare | 🏥 | expense | Doctor visits, medicine, and medical costs |
| Clothing | 👕 | expense | Clothes, shoes, and accessories |
| Savings | 🏦 | expense | Money set aside for savings or planned transfers |
| Transfer | 🔄 | expense | Internal transfers between your own accounts |
| Other | 📦 | expense | Anything that does not fit a more specific category |

> ⚠️ The seeded category types matter. For example, `Savings` and `Transfer` are seeded as expense categories in this project, so keep that in mind when creating reports.

## How Auto-Categorization Works

When you import a CSV, the importer looks at each transaction description and tries to match keywords first. The matching happens in this order:

1. Check the transaction description against built-in keyword rules.
2. If no keyword matches, use the category column if the CSV provides one.
3. If that still does not match, fall back to `Other`.
4. If `Other` does not exist, use the first category found in the database.

The current keyword rules are:

| Keyword pattern | Category |
| --- | --- |
| `woolworths`, `checkers`, `pick n pay`, `spar` | Groceries |
| `rent`, `lease` | Rent |
| `uber`, `lyft`, `petrol`, `fuel`, `bp`, `shell` | Transport |
| `netflix`, `spotify`, `amazon prime`, `dstv` | Subscriptions |
| `betway`, `sportpesa`, `hollywoodbets`, `casino` | Betting |
| `salary`, `payroll`, `wages` | Salary |

> ⚠️ The importer matches against the description text, so spelling changes, abbreviations, and bank-specific merchant names can affect the result.

## Add Custom Categories

There is no finished category-management screen in the current UI yet. The reliable way to add categories today is through the API.

### Via the API

Create a category with `POST /api/categories`.

Example request body:

```json
{
  "name": "Fuel",
  "type": "expense",
  "color": "#2563eb",
  "icon": "⛽"
}
```

The response includes the stored category record with its generated `id`.

### Via the UI

If you build a UI screen for categories, wire it to the existing category API and the frontend `useCreateCategory` hook. The backend already supports category creation, editing, listing, and deletion.

## Why Consistent Categorization Matters

Consistent category names give you cleaner totals in the dashboard and more useful Power BI visuals. If the same merchant sometimes lands in `Other` and sometimes in `Transport`, your reports will look noisy and the monthly totals will be less trustworthy.

Use these habits to keep your data clean:

- Pick one category name for each recurring merchant.
- Keep names short and stable.
- Put unknown or one-off transactions into `Other` only when needed.
- Re-check imports after changing keyword rules.
- Avoid creating duplicate categories with slightly different spellings.

The main goal is not just tidy data entry. It is accurate reporting on your real spending.