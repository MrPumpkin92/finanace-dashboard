/**
 * Development Guide
 * Comprehensive guide for local development
 */

# Development Guide

## Quick Start

1. **Clone Repository**
```bash
git clone <repository-url>
cd finance-dashboard
```

2. **Install Dependencies**
```bash
npm install
```

3. **Setup Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Initialize Database**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start Development Server**
```bash
npm run dev
```

Server will be available at `http://localhost:3000`

---

## Development Scripts

### Build
```bash
npm run build
```
Compiles TypeScript to JavaScript in `dist/` directory.

### Development Mode
```bash
npm run dev
```
Starts server with hot-reload using ts-node.

### Testing
```bash
npm test              # Run all tests once
npm run test:ui       # Interactive test UI
npm run test:coverage # Generate coverage report
```

### Linting
```bash
npm run lint          # Check for errors
npm run lint:fix      # Auto-fix errors
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

### Type Checking
```bash
npm run typecheck
```
Validates TypeScript without emitting files.

### Database
```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed default data
```

---

## Project Structure

```
src/
├── auth/              # Authentication & OAuth2
│   └── auth.ts       # Azure AD configuration
├── api/               # External API clients
│   └── powerBIClient.ts  # Power BI REST API
├── data/              # Database layer
│   ├── db.ts         # Connection & migrations
│   ├── categoryRepo.ts
│   ├── transactionRepo.ts
│   └── seed.ts       # Default data
├── models/            # TypeScript interfaces
│   ├── Transaction.ts
│   ├── Category.ts
│   └── PowerBI.ts
├── import/            # CSV import
│   └── csvImporter.ts
├── server/            # Express app
│   ├── routes/       # API endpoints
│   └── app.ts        # Server setup
├── config/            # Configuration
├── types/             # Global types
├── utils/             # Utilities
└── index.ts          # Entry point
```

---

## Environment Configuration

### Required Variables
```env
# Azure AD
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-secret

# Power BI
POWER_BI_WORKSPACE_ID=workspace-id
POWER_BI_REPORT_ID=report-id

# Server
PORT=3000
NODE_ENV=development
DB_PATH=./data/finance.db
CORS_ORIGIN=http://localhost:3000
```

### Optional Variables
```env
UPLOAD_DIR=./uploads
```

---

## Database Operations

### Create Categories
```typescript
import { CategoryRepository } from './src/data/categoryRepo';

const repo = new CategoryRepository();
const category = repo.create({
  name: 'My Category',
  type: 'expense',
  description: 'Description',
  color: '#FF6B6B'
});
```

### Create Transactions
```typescript
import { TransactionRepository } from './src/data/transactionRepo';

const repo = new TransactionRepository();
const transaction = repo.create('user-id', {
  description: 'Grocery Store',
  amount: 45.99,
  categoryId: 'category-uuid',
  type: 'expense',
  date: '2024-01-16'
});
```

### Query Transactions
```typescript
// Get all user transactions
const all = repo.getByUserId('user-id');

// Filter by date range
const filtered = repo.getByUserId('user-id', {
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

// Get statistics
const stats = repo.getStatistics('user-id');
```

---

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/unit.test.ts

# Run with coverage
npm run test:coverage

# Interactive mode
npm run test:ui
```

### Writing Tests
```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    expect(2 + 2).toBe(4);
  });
});
```

### Test Database
Tests use an in-memory SQLite database, so they don't affect your development database.

---

## API Development

### Adding New Endpoint
1. Create route file in `src/server/routes/`
2. Define endpoints with Express Router
3. Import and use in `src/server/app.ts`

Example:
```typescript
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello' });
});

export default router;
```

### Error Handling
```typescript
import { ValidationError, NotFoundError } from '../utils/errors';

// Validation error
throw new ValidationError('Invalid input');

// Not found
throw new NotFoundError('Resource');
```

---

## CSV Import Development

### Testing Import
1. Create test CSV file:
```csv
date,description,amount,type,category
2024-01-15,Test,100,expense,Groceries
```

2. Use import endpoint:
```bash
curl -X POST http://localhost:3000/api/import/csv \
  -F "file=@test.csv"
```

### Debugging Import
```typescript
import { CSVImporter } from './src/import/csvImporter';

const importer = new CSVImporter();
const result = await importer.importCSV(csvContent, 'user-id');

console.log(result.errors); // See any import errors
```

---

## Power BI Integration

### Local Testing
1. Configure `.env` with real Power BI credentials
2. Test embed endpoint:
```bash
curl http://localhost:3000/api/embed/config
```

### Token Management
Access tokens are automatically refreshed:
- Tokens cached for 60 minutes
- Refreshed 5 minutes before expiry
- Can be manually refreshed by making new request

---

## Performance Optimization

### Database Indices
Indices are automatically created during migration:
- `userId` - Fast user lookups
- `categoryId` - Fast category lookups
- `date` - Fast date range queries
- `userId + date` - Optimized combined queries

### Query Optimization Tips
1. Always filter by userId when possible
2. Use date ranges to limit result sets
3. Avoid searching large text fields without indexing
4. Consider pagination for large result sets

---

## Debugging

### Enable Debug Logging
Set environment variable:
```bash
NODE_DEBUG=*
```

### Debug with VS Code
1. Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "program": "${workspaceFolder}/src/index.ts",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

2. Set breakpoints and press F5

### Common Issues

**Database Lock**
- SQLite can lock if multiple processes access it
- Solution: Ensure only one process accesses at a time
- For production: Migrate to PostgreSQL

**Port Already in Use**
- Change PORT in .env or:
```bash
PORT=3001 npm run dev
```

**Missing Environment Variables**
- Ensure `.env` has all required variables
- Check `.env.example` for complete list

**Build Errors**
- Run `npm run typecheck` to find type errors
- Run `npm run lint` to find linting issues

---

## Code Style

### TypeScript
- Strict mode enabled (no `any` types)
- Explicit return types required
- No unused variables or parameters

### Formatting
- Prettier automatically formats on save
- 100 character line width
- 2 space indentation
- Single quotes

### Linting
- ESLint enforces best practices
- Auto-fix available: `npm run lint:fix`

---

## Git Workflow

1. Create feature branch:
```bash
git checkout -b feature/my-feature
```

2. Make changes and commit:
```bash
git add .
git commit -m "Add feature"
```

3. Ensure tests pass:
```bash
npm test
npm run lint
npm run typecheck
```

4. Push and create PR:
```bash
git push origin feature/my-feature
```

---

## Useful Resources

- [Express Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Power BI API](https://learn.microsoft.com/en-us/power-bi/developer/rest-api-overview)
- [Azure AD Authentication](https://learn.microsoft.com/en-us/azure/active-directory/develop/)

---

## Support

For issues or questions:
1. Check existing issues/PRs
2. Review error logs
3. Consult documentation
4. Create detailed issue with reproduction steps
