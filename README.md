# Personal Finance Dashboard

A production-ready personal finance dashboard application that integrates with Microsoft Power BI for advanced data visualization and reporting.

## Features

- **Transaction Management**: Manually log or import transactions from CSV bank exports
- **Categorization**: Organize transactions into 15+ predefined categories (Salary, Rent, Groceries, Dining, etc.)
- **CSV Import**: Batch import bank statements with automatic parsing and validation
- **Power BI Integration**: Interactive dashboards for spending trends, category breakdowns, and budget analysis
- **RESTful API**: Complete CRUD operations for transactions and categories
- **SQLite Database**: Lightweight, file-based data persistence
- **Authentication**: Azure AD / OAuth2 integration for secure access
- **Type Safety**: Full TypeScript with strict mode enabled
- **Production Ready**: Includes error handling, security middleware, and comprehensive logging

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Microsoft Power BI**: Tenant access and report configured
- **Azure AD**: Application registration for authentication
- **SQLite**: Included via better-sqlite3

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd finance-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your credentials:
```env
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
POWER_BI_WORKSPACE_ID=your-workspace-id
POWER_BI_REPORT_ID=your-report-id
PORT=3000
DB_PATH=./data/finance.db
```

5. Initialize database and seed default categories:
```bash
npm run db:migrate
npm run db:seed
```

## Development

### Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Build TypeScript
```bash
npm run build
```

Output goes to `dist/` directory

### Run Tests
```bash
npm test           # Run all tests
npm run test:ui    # Run with UI dashboard
npm run test:coverage  # Generate coverage report
```

### Linting & Formatting
```bash
npm run lint       # Check for linting errors
npm run lint:fix   # Fix linting errors
npm run format     # Format code with Prettier
npm run format:check  # Check formatting
```

## Production Build

1. Build the application:
```bash
npm run build
```

2. Set environment to production:
```bash
NODE_ENV=production
```

3. Start the server:
```bash
npm run start
```

## API Endpoints

### Transactions
- `GET /api/transactions` - List user transactions with optional filters
- `POST /api/transactions` - Create a new transaction
- `GET /api/transactions/:id` - Get a specific transaction
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction
- `GET /api/transactions/stats/summary` - Get transaction statistics

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create a new category
- `GET /api/categories/:id` - Get a specific category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### CSV Import
- `POST /api/import/csv` - Import transactions from CSV file
- `GET /api/import/template` - Download CSV template

### Power BI Integration
- `GET /api/embed/config` - Get report embed configuration
- `POST /api/embed/refresh` - Trigger dataset refresh
- `GET /api/embed/refresh-history/:datasetId` - Get refresh history
- `GET /api/embed/pages/:reportId` - Get report pages

### Health Check
- `GET /api/health` - Server health status

## CSV Import Format

Expected CSV columns:
- `date` - Transaction date (YYYY-MM-DD, MM/DD/YYYY, or DD-MM-YYYY)
- `description` - Transaction description
- `amount` - Transaction amount (positive number)
- `type` - `income` or `expense`
- `category` - Category name (must exist in database)

Example:
```csv
date,description,amount,type,category
2024-01-15,Salary Deposit,2500,income,Salary
2024-01-16,Grocery Store,45.99,expense,Groceries
2024-01-17,Rent Payment,1200,expense,Rent
```

## Default Categories

### Income
- Salary
- Freelance Income

### Expenses
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

### Transfer
- Transfer
- Other

## Architecture

```
src/
├── auth/                 # Azure AD authentication
├── api/                  # Power BI REST API client
├── data/                 # Database layer and repositories
├── models/               # TypeScript interfaces
├── import/               # CSV import logic
└── server/               # Express application
    ├── routes/           # API route handlers
    └── app.ts            # Express setup
```

## Database Schema

### Categories Table
- `id` (PRIMARY KEY)
- `name` (UNIQUE)
- `type` (income | expense | transfer)
- `description`
- `color`
- `icon`
- `isActive`
- `createdAt`
- `updatedAt`

### Transactions Table
- `id` (PRIMARY KEY)
- `userId`
- `description`
- `amount`
- `categoryId` (FOREIGN KEY)
- `type` (income | expense)
- `date`
- `notes`
- `source` (manual | csv-import)
- `createdAt`
- `updatedAt`

## Security Features

- **Helmet.js**: HTTP security headers
- **CORS**: Cross-Origin Resource Sharing configuration
- **Input Validation**: Zod schema validation (extensible)
- **SQL Injection Prevention**: Parameterized queries via better-sqlite3
- **Foreign Key Constraints**: Referential integrity
- **User Isolation**: Per-user transaction filtering
- **TypeScript Strict Mode**: Type safety

## Performance Optimization

- **Database Indices**: Optimized query performance
  - `userId`, `categoryId`, `date` indexed
  - Composite index on `userId + date`
- **Connection Pooling**: SQLite connection management
- **Request Logging**: Built-in performance monitoring
- **Graceful Shutdown**: Clean resource cleanup

## Deployment

### Docker
1. Build image:
```bash
docker build -t finance-dashboard .
```

2. Run container:
```bash
docker run -p 3000:3000 --env-file .env finance-dashboard
```

### Azure App Service
1. Create App Service
2. Configure Azure AD
3. Deploy to Azure using GitHub Actions or Azure DevOps
4. Configure database backup strategy

### Environment Variables
All configuration is managed via `.env` file. See `.env.example` for required variables.

## Troubleshooting

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
