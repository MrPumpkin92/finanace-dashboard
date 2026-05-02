/**
 * Project Structure & File Inventory
 */

# Finance Dashboard - Complete File Inventory

## Root Configuration Files

### `.env.example`
Environment variables template with all required and optional settings

### `.gitignore`
Git exclusion rules for node_modules, build artifacts, sensitive files

### `.eslintrc.json`
ESLint configuration with TypeScript support and strict rules

### `.prettierrc.json`
Prettier configuration for code formatting

### `.prettierignore` & `.eslintignore`
Ignore patterns for formatting and linting

### `package.json`
- Dependencies (Express, SQLite, Azure AD, CSV parser, etc.)
- Dev dependencies (TypeScript, ESLint, Prettier, Vitest)
- npm scripts for build, dev, test, lint, db operations

### `tsconfig.json`
TypeScript compiler options with strict mode enabled

### `vitest.config.ts`
Test runner configuration

### `docker-compose.yml`
Docker compose setup for containerized deployment

### `Dockerfile`
Multi-stage Docker image with Alpine Linux

---

## Documentation

### `README.md`
Comprehensive project overview, features, installation, API endpoints, schema

### `API_DOCUMENTATION.md`
Complete REST API reference with all endpoints, request/response examples

### `DEVELOPMENT.md`
Local development guide, setup, debugging, testing, code style

### `DEPLOYMENT.md`
Production deployment guide for Docker, Azure, scaling, security

---

## VS Code Configuration

### `.vscode/settings.json`
- Prettier as default formatter
- ESLint auto-fix on save
- TypeScript settings
- Exclusion patterns

### `.vscode/extensions.json`
Recommended extensions (Prettier, ESLint, TypeScript, Git Lens, Docker)

---

## GitHub Configuration

### `.github/workflows/ci.yml`
CI/CD pipeline:
- Run linting
- Type checking
- Unit tests
- Build verification
- Docker image build and test

---

## Source Code Structure

### `src/index.ts`
Application entry point that starts the server

### `src/types/`
**global.d.ts** - Global environment variable types
**api.ts** - API response and error types

### `src/config/`
**environment.ts** - Environment configuration loader with validation
**constants.ts** - API constants, limits, error codes

### `src/utils/`
**logger.ts** - Logging utility with log levels
**date.ts** - Date utility functions
**validators.ts** - Input validation helpers
**errors.ts** - Custom error classes (ApiError, ValidationError, etc.)

### `src/auth/`
**auth.ts** - Azure AD authentication using MSAL, Power BI token management

### `src/models/`
**Transaction.ts** - Transaction interfaces and types
**Category.ts** - Category interfaces with default categories
**PowerBI.ts** - Power BI API models and embed configuration

### `src/data/`
**db.ts** - SQLite initialization, migrations, connection management
**categoryRepo.ts** - Category CRUD repository (15+ predefined categories)
**transactionRepo.ts** - Transaction CRUD repository with statistics
**seed.ts** - Database seeding with default categories

### `src/api/`
**powerBIClient.ts** - Power BI REST API client for:
  - Embed token generation
  - Dataset refresh
  - Refresh history
  - Report pages retrieval

### `src/import/`
**csvImporter.ts** - CSV parsing and transaction import with:
  - Multiple date format support
  - Category mapping
  - Error handling and reporting

### `src/server/`
**app.ts** - Express application setup with:
  - Security middleware (Helmet, CORS)
  - Error handling
  - Request logging
  - Health check endpoint

### `src/server/routes/`
**transactions.ts** - Transaction endpoints:
  - CRUD operations
  - Filtering
  - Statistics

**categories.ts** - Category endpoints:
  - CRUD operations
  - Type filtering
  - Active status filtering

**embed.ts** - Power BI embedding endpoints:
  - Embed configuration
  - Dataset refresh
  - Refresh history
  - Report pages

**import.ts** - CSV import endpoints:
  - File upload
  - Template download
  - Import result reporting

---

## Data Layer

### `data/`
**finance.db** - SQLite database (gitignored)
**.gitkeep** - Directory marker

### `uploads/`
**[CSV files]** - Temporary upload directory (gitignored)
**.gitkeep** - Directory marker

### `reports/`
**[.pbix files]** - Power BI report files
**.gitkeep** - Directory marker

---

## Testing

### `tests/unit.test.ts`
Comprehensive test suite using Vitest:
- CategoryRepository tests
- TransactionRepository tests
- CSVImporter tests
- Database fixture setup/teardown

---

## Directory Tree

```
finance-dashboard/
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── .github/
│   └── workflows/
│       └── ci.yml
├── src/
│   ├── index.ts
│   ├── config/
│   │   ├── environment.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── global.d.ts
│   │   └── api.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── date.ts
│   │   ├── validators.ts
│   │   └── errors.ts
│   ├── auth/
│   │   └── auth.ts
│   ├── models/
│   │   ├── Transaction.ts
│   │   ├── Category.ts
│   │   └── PowerBI.ts
│   ├── data/
│   │   ├── db.ts
│   │   ├── categoryRepo.ts
│   │   ├── transactionRepo.ts
│   │   └── seed.ts
│   ├── api/
│   │   └── powerBIClient.ts
│   ├── import/
│   │   └── csvImporter.ts
│   └── server/
│       ├── app.ts
│       └── routes/
│           ├── transactions.ts
│           ├── categories.ts
│           ├── embed.ts
│           └── import.ts
├── data/
│   └── .gitkeep
├── reports/
│   └── .gitkeep
├── uploads/
│   └── .gitkeep
├── tests/
│   └── unit.test.ts
├── dist/
│   └── [compiled files]
├── .env.example
├── .env (gitignored)
├── .gitignore
├── .eslintrc.json
├── .eslintignore
├── .prettierrc.json
├── .prettierignore
├── package.json
├── package-lock.json (gitignored)
├── tsconfig.json
├── vitest.config.ts
├── docker-compose.yml
├── Dockerfile
├── README.md
├── API_DOCUMENTATION.md
├── DEVELOPMENT.md
└── DEPLOYMENT.md
```

---

## File Statistics

- **Total Files**: 40+
- **TypeScript Files**: 20+
- **Configuration Files**: 8
- **Documentation Files**: 4
- **Test Files**: 1
- **Docker Files**: 2

---

## Dependencies Summary

### Core Dependencies
- `express` - Web framework
- `better-sqlite3` - SQLite database
- `axios` - HTTP client
- `dotenv` - Environment variables
- `uuid` - UUID generation
- `cors` - CORS middleware
- `helmet` - Security headers
- `multer` - File uploads
- `csv-parse` - CSV parsing
- `zod` - Schema validation

### Authentication
- `@azure/identity` - Azure authentication
- `@azure/msal-node` - MSAL for OAuth2

### Development Tools
- `typescript` - TypeScript compiler
- `eslint` - Linting
- `prettier` - Code formatting
- `vitest` - Test framework
- `ts-node` - TypeScript execution

---

## Key Features by File

### Data Persistence
- SQLite with foreign keys
- Automatic migrations on startup
- WAL mode for concurrent access
- Proper indices for performance

### Security
- Helmet.js security headers
- CORS configuration
- Parameterized SQL queries
- Input validation
- User isolation

### API Design
- RESTful endpoints
- Consistent error responses
- Proper HTTP status codes
- Type-safe requests/responses

### CSV Import
- Multiple date formats
- Category mapping
- Batch error reporting
- Transaction source tracking

### Power BI Integration
- Token generation and caching
- Dataset refresh triggering
- Refresh history retrieval
- Report page listing

### Testing
- In-memory database for tests
- Repository pattern testing
- Import logic testing
- No external dependencies in tests

---

## Scalability Considerations

### Current Limitations
- SQLite: Single process access
- File-based database: Limited concurrency
- No data replication

### Migration Path
1. PostgreSQL for multi-instance
2. Redis for session management
3. Kubernetes for orchestration
4. Object storage for uploads

---

## Security Checklist

✓ TypeScript strict mode
✓ Input validation
✓ Parameterized SQL
✓ Security headers (Helmet)
✓ CORS configuration
✓ Error handling
✓ Logging (no sensitive data)
✓ Type safety
✓ User isolation
✓ Foreign key constraints

---

## Performance Optimizations

✓ Database indices
✓ Composite indices
✓ Connection pooling ready
✓ Response compression ready
✓ Query optimization
✓ Error caching ready
✓ Graceful shutdown

---

## Deployment Ready

✓ Docker container
✓ Environment configuration
✓ Health check endpoint
✓ Graceful shutdown
✓ Logging setup
✓ Error handling
✓ Security hardening
✓ CI/CD pipeline
✓ Backup strategy guide

---

## Next Steps (Future Enhancements)

- [ ] Implement real OAuth2 flow
- [ ] Add pagination
- [ ] Add rate limiting
- [ ] Add request logging middleware
- [ ] Add data encryption
- [ ] Add cache layer (Redis)
- [ ] Implement subscription support
- [ ] Add API key management
- [ ] Add audit logging
- [ ] Add multi-tenant support
