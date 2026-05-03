# Personal Finance Dashboard

Track income and expenses in one place, import bank CSVs, and visualize your spending in Power BI.

## What It Does

This app stores transactions in a local SQLite database, lets you add or import income and expenses, and pushes the data into Power BI for reporting. It is built for personal use, so the setup stays lightweight while still giving you dashboards for totals, category breakdowns, and monthly trends.

## Screenshots

### Transactions Page
> Placeholder: add a screenshot of the Transactions page here.

Caption: list transactions, filter by month, category, and type, and import a bank CSV.

### Report Page
> Placeholder: add a screenshot of the Report page here.

Caption: view the embedded Power BI report that summarizes your spending.

## Prerequisites

- Azure subscription
- Power BI Pro license
- Node.js 18 or later
- npm

## Setup

1. Clone the repository.
```bash
git clone <repository-url>
cd finanace-dashboard
```

2. Install dependencies.
```bash
npm install
```

3. Configure your environment.
Create a `.env` file in the project root and add at least these values:
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
POWER_BI_WORKSPACE_ID=your-workspace-id
POWER_BI_REPORT_ID=your-report-id
POWER_BI_DATASET_ID=your-dataset-id
PORT=3000
DB_PATH=./data/finance.db
```

4. Create the local database and seed the built-in categories.
```bash
npm run db:migrate
```

5. Start the development server.
```bash
npm run dev
```

> ⚠️ Keep your Azure client secret out of source control. The `.env` file should stay local.

## Import Your First Bank CSV

The simplest path is to open the Transactions page, use the import control, and upload a CSV export from your bank. The backend accepts the two CSV shapes described in [CSV import documentation](docs/CSV_IMPORT.md).

If you are calling the API directly, the current import endpoint is `POST /api/import/csv` and it expects a multipart form upload with a field named `file`.

After import, check the Transactions page to confirm the rows landed in the right categories.

> ⚠️ If the file headers do not match a supported format, the importer may skip rows or assign a fallback category.

## Categories

The app seeds a built-in category list the first time you run the database migration. The default categories are:

- Salary
- Freelance
- Groceries
- Rent
- Utilities
- Transport
- Dining Out
- Entertainment
- Betting
- Subscriptions
- Healthcare
- Clothing
- Savings
- Transfer
- Other

You can add custom categories through the category API. The current UI does not ship with a finished category management screen yet, so the API is the reliable path today. See [Categories documentation](docs/CATEGORIES.md) for the built-in list and the rules used by CSV auto-categorization.

## Run Tests

```bash
npm test
```

Other useful checks:

```bash
npm run test:coverage
npm run typecheck
```

## Troubleshooting

### Authentication failures

If Power BI calls fail with missing token or auth errors, check these first:

- `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET` are set
- `POWER_BI_WORKSPACE_ID` and `POWER_BI_REPORT_ID` are set
- The app registration has Power BI API permissions with admin consent
- The Power BI workspace allows service principals

### CSV import errors

- Make sure the file is a CSV, not XLSX or PDF
- Check that the headers match a supported bank export format
- Confirm dates use one of the supported formats listed in [CSV import documentation](docs/CSV_IMPORT.md)
- Confirm amounts are numeric and do not contain stray text

### Power BI not loading

- Confirm the workspace and report IDs are correct
- Confirm the report exists in the workspace
- Confirm the signed-in Power BI user has access to the report and workspace
- If the report area is blank, check whether the embed token request is failing in the server logs

> ⚠️ The app can only show the Power BI report if the Azure app registration and Power BI workspace permissions are set up correctly.

## More Documentation

- [API reference](docs/API.md)
- [Category reference](docs/CATEGORIES.md)
- [CSV import guide](docs/CSV_IMPORT.md)
- [Azure setup guide](docs/AZURE_SETUP.md)

### Database Lock Issues
SQLite can experience lock contention. For high-concurrency scenarios, consider migrating to PostgreSQL.

### Power BI Token Expiration
Tokens are automatically refreshed 5 minutes before expiry. Ensure clock synchronization across servers.

### CSV Import Failures
- Verify CSV format matches template
- Check category names match existing database entries
- Ensure date format is recognized (ISO, US, or EU format)

## Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit.test.ts
```

## Contributing

1. Create a feature branch
2. Make changes with appropriate tests
3. Ensure linting and formatting pass
4. Submit pull request

## License

MIT

## Support

For issues, questions, or suggestions, please create an issue in the repository.

## Changelog

### v1.0.0 (Initial Release)
- Core transaction management
- CSV import functionality
- Power BI integration
- RESTful API
- SQLite database
- Azure AD authentication

## Future Enhancements

- [ ] Budget planning and alerts
- [ ] Recurring transaction templates
- [ ] Multi-user account sharing
- [ ] Advanced analytics and forecasting
- [ ] Mobile app (React Native)
- [ ] Voice-controlled transaction logging
- [ ] Machine learning categorization
- [ ] Bank API direct integration
- [ ] Multi-currency support
- [ ] Expense splitting features
