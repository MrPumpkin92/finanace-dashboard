# Frontend Architecture

## Component Hierarchy

```
App
├── Sidebar
│   ├── Navigation Links
│   │   ├── Dashboard
│   │   ├── Transactions
│   │   ├── Report
│   │   └── Settings
│   └── Logo/Branding
│
├── Routes
│   ├── Dashboard (/)
│   │
│   ├── TransactionsPage (/transactions)
│   │   ├── Header
│   │   ├── MonthlySummaryBar
│   │   │   ├── Total Income Card
│   │   │   ├── Total Expenses Card
│   │   │   ├── Net Savings Card
│   │   │   └── Largest Expense Card
│   │   │
│   │   ├── FilterBar
│   │   │   ├── MonthPicker (→ ←)
│   │   │   ├── TypeFilter (All/Income/Expense)
│   │   │   ├── CategoryFilter (dropdown)
│   │   │   ├── SearchBox
│   │   │   ├── AddTransaction Button (→ Modal)
│   │   │   └── ImportCSV Button (→ FilePicker)
│   │   │
│   │   ├── TransactionTable
│   │   │   ├── Row (Date, Description, Category, Type, Amount, Notes, Actions)
│   │   │   │   ├── CategoryBadge
│   │   │   │   ├── AmountDisplay
│   │   │   │   ├── Edit Button
│   │   │   │   └── Delete Button
│   │   │   └── LoadingState / EmptyState
│   │   │
│   │   ├── Pagination
│   │   └── ImportStatus Alert
│   │
│   ├── ReportPage (/report)
│   │   ├── Header
│   │   ├── Toolbar
│   │   │   ├── Refresh Button
│   │   │   ├── Full Screen Button
│   │   │   └── Export PDF Button
│   │   └── PowerBiReportContainer
│   │       ├── LoadingSpinner
│   │       └── ErrorState (with Retry)
│   │
│   └── Settings (/settings)
│       └── Coming Soon
│
└── Modals
    ├── AddTransactionModal
    │   └── TransactionForm
    │       ├── TypeToggle
    │       ├── DatePicker
    │       ├── AmountInput
    │       ├── CategoryDropdown
    │       ├── DescriptionInput
    │       ├── NotesTextarea
    │       └── SubmitButton
    └── ImportResultsModal
```

## Data Flow

```
API Calls (React Query)
├── useTransactions(page, limit, month, category, type)
├── useMonthlySummary(month)
├── useCreateTransaction()
├── useUpdateTransaction()
├── useDeleteTransaction()
├── useImportCsv()
├── useCategories()
├── useCreateCategory()
└── useEmbedToken()
       ↓
    API Client (Axios)
       ↓
    Backend API (port 5000)
       ↓
    SQLite Database
```

## State Management

```
Routing State
├── Current Route (React Router)
└── Navigation State

Query State (React Query)
├── Transactions Cache
├── Categories Cache
├── Summary Cache
└── Embed Token Cache

Form State (React Hook Form)
├── Transaction Form
│   ├── date
│   ├── amount
│   ├── type
│   ├── categoryId
│   ├── description
│   └── notes
└── Validation (Zod)

UI State (Component State)
├── Modal Open/Close
├── Month Selection
├── Category Filter
├── Type Filter
├── Search Query
├── Current Page
└── Import Status
```

## API Endpoints

```
GET /api/transactions
  Query: page, limit, month, categoryId, type
  Response: PaginatedResponse<Transaction>

GET /api/transactions/summary/{month}
  Response: MonthSummary

POST /api/transactions
  Body: CreateTransactionInput
  Response: Transaction

PUT /api/transactions/{id}
  Body: UpdateTransactionInput
  Response: Transaction

DELETE /api/transactions/{id}
  Response: void

GET /api/transactions/search
  Query: q (search query)
  Response: Transaction[]

POST /api/transactions/import
  Body: FormData (CSV file)
  Response: { imported, failed }

GET /api/categories
  Response: Category[]

POST /api/categories
  Body: CreateCategoryInput
  Response: Category

GET /api/embed-token
  Response: { token, reportId, groupId, datasetId }

POST /api/import
  Body: FormData (CSV file)
  Response: { imported, failed }
```

## Styling Architecture

```
Tailwind CSS
├── Dark Theme
│   ├── Background: #0f172a (dark-bg)
│   ├── Surface: #1e293b (dark-surface)
│   ├── Border: #334155 (dark-border)
│   └── Text: Gray 100-600
│
├── Component Classes
│   ├── .btn-primary (blue button)
│   ├── .btn-secondary (surface button)
│   ├── .card (surface with border)
│   ├── .input-field (dark input)
│   ├── .table-header (table header)
│   ├── .table-cell (table cell)
│   └── Category Colors (various)
│
├── Accent Colors
│   ├── Income: Green (#22c55e)
│   ├── Expense: Red (#ef4444)
│   ├── Primary: Blue (#3b82f6)
│   └── Category: Dynamic colors
│
└── Responsive Breakpoints
    ├── Mobile: < 768px
    ├── Tablet: 768px - 1024px
    └── Desktop: > 1024px
```

## File Organization

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── CategoryBadge.tsx
│   │   ├── AmountDisplay.tsx
│   │   ├── MonthPicker.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Modal.tsx
│   │   ├── FilePicker.tsx
│   │   ├── TransactionForm.tsx
│   │   ├── TransactionTable.tsx
│   │   └── MonthlySummaryBar.tsx
│   │
│   ├── pages/               # Page/Route components
│   │   ├── Dashboard.tsx
│   │   ├── TransactionsPage.tsx
│   │   ├── ReportPage.tsx
│   │   └── Settings.tsx
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useApi.ts        # API and data hooks
│   │   └── useCategories.ts # Category utilities
│   │
│   ├── utils/               # Helper functions
│   │   ├── api.ts           # Axios API client
│   │   ├── formatting.ts    # Date/currency formatting
│   │   ├── validation.ts    # Zod schemas
│   │   └── queryClient.ts   # React Query setup
│   │
│   ├── types/               # TypeScript definitions
│   │   └── index.ts
│   │
│   ├── styles/              # CSS files
│   │   └── index.css        # Global + Tailwind
│   │
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
│
├── public/                  # Static assets
├── dist/                    # Build output (generated)
├── index.html               # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.json
├── .gitignore
├── .env.example
├── README.md
├── DEPLOYMENT.md
└── BUILD_SUMMARY.md
```

## Performance Considerations

```
Code Splitting
├── Route-based splitting (via React Router)
└── Component lazy loading (future enhancement)

Caching Strategy
├── React Query Cache
│   ├── Transactions: 5min stale time
│   ├── Categories: Session duration
│   └── Summary: 5min stale time
└── Browser Cache
    └── Static assets: Long-lived

Optimization Techniques
├── Memoization (useMemo, useCallback)
├── Lazy rendering (TransactionTable pagination)
├── Image optimization
└── CSS minification (production)

Bundle Size
├── Main JS: ~150KB (gzipped)
├── React: ~40KB
├── React Query: ~15KB
├── Tailwind: ~30KB
└── Other: ~65KB
```

## Security Architecture

```
Authentication
├── Backend handles session/tokens
└── Frontend includes credentials in requests

API Security
├── CORS configured on backend
├── Request validation via Zod
├── XSS prevention (React escaping)
└── CSRF token support (if needed)

Data Protection
├── No sensitive data in localStorage
├── Passwords never handled frontend
└── HTTPS required in production

Content Security
├── CSP headers configured
├── No inline scripts
├── External scripts restricted
└── Frame-ancestors policy set
```

## Error Handling

```
API Errors
├── Network errors → Retry with exponential backoff
├── 401/403 → Redirect to login (future)
├── 400 → Show validation errors
├── 500 → Show error alert + retry
└── Timeout → Show timeout message

Form Errors
├── Client-side validation (Zod)
├── Server-side validation response
├── Field-level error display
└── Form-level error messages

Component Errors
├── Error boundaries (future enhancement)
├── Fallback UI for failed components
├── Error logging/reporting
└── Graceful degradation
```

## Testing Strategy (Future)

```
Unit Tests
├── Utils (formatting, validation)
├── Hooks (custom logic)
└── Components (isolated)

Integration Tests
├── Form submission flow
├── Transaction CRUD
├── Category filtering
└── Navigation

E2E Tests
├── Full transaction workflow
├── CSV import process
├── Report viewing
└── Filter combinations
```

---

This architecture provides:
- ✅ Scalable component structure
- ✅ Clean separation of concerns
- ✅ Efficient state management
- ✅ Performance optimization
- ✅ Type safety throughout
- ✅ Dark theme consistency
- ✅ Responsive design
- ✅ Error handling
- ✅ API integration
- ✅ Form validation
