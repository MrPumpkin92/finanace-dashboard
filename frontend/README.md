# Finance Dashboard Frontend

A modern React TypeScript frontend for the personal finance dashboard with Power BI integration.

## Features

- **Transactions Management**: Add, view, filter, and manage financial transactions
- **CSV Import**: Bulk import transactions from CSV files
- **Month-based Filtering**: View transactions and summaries by month
- **Category Management**: Organize transactions with color-coded categories
- **Power BI Integration**: Embedded analytics and reporting
- **Dark Theme**: Modern dark interface for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop and tablet

## Quick Start

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Building

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── CategoryBadge.tsx
│   ├── AmountDisplay.tsx
│   ├── MonthPicker.tsx
│   ├── Sidebar.tsx
│   ├── Modal.tsx
│   ├── FilePicker.tsx
│   ├── TransactionForm.tsx
│   ├── TransactionTable.tsx
│   └── MonthlySummaryBar.tsx
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── TransactionsPage.tsx
│   └── ReportPage.tsx
├── hooks/              # Custom React hooks
│   ├── useApi.ts
│   └── useCategories.ts
├── utils/              # Utility functions
│   ├── api.ts          # API client
│   ├── formatting.ts   # Date/currency formatting
│   ├── validation.ts   # Zod schemas
│   └── queryClient.ts  # React Query setup
├── types/              # TypeScript definitions
│   └── index.ts
├── styles/             # CSS and Tailwind
│   └── index.css
├── App.tsx             # Main App component with routing
└── main.tsx            # Entry point
```

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Validation schemas
- **Tailwind CSS** - Styling
- **Power BI Client** - Report embedding
- **Axios** - HTTP client
- **Date-fns** - Date utilities

## API Configuration

The frontend communicates with the backend at `http://localhost:5000/api`. This can be configured in the Vite config:

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

## Environment

Create a `.env.local` file if needed to override the default API base URL.

## Styling

The app uses Tailwind CSS with a dark theme:
- Background: `#0f172a` (dark-bg)
- Surface: `#1e293b` (dark-surface)
- Income: Green (#22c55e)
- Expenses: Red (#ef4444)

## Component Documentation

### TransactionForm
Form component for adding/editing transactions with validation using React Hook Form and Zod.

### TransactionTable
Displays transactions in a table with category badges, formatted amounts, and action buttons.

### MonthlySummaryBar
Shows monthly financial summary: total income, expenses, savings, and largest expense category.

### MonthPicker
Navigation component with prev/next buttons for month selection.

### Sidebar
Navigation sidebar with links to Dashboard, Transactions, Reports, and Settings.

## Features in Detail

### Add Transaction
- Opens modal form
- Defaults to today's date
- Dynamic category dropdown based on transaction type
- Form validation with Zod
- Automatic summary refresh after creation

### Import CSV
- File picker for CSV selection
- Shows import results (imported/failed count)
- Auto-refreshes transactions and summaries
- Supports bulk transaction imports

### Filtering
- Filter by month
- Filter by category
- Filter by type (All/Income/Expense)
- Search transactions by description

### Power BI Reports
- Full-width embedded Power BI reports
- Toolbar with Refresh, Full Screen, Export options
- Responsive container
- Error handling with retry button

## Error Handling

- API errors show user-friendly alerts
- Transaction operations have loading states
- Modal escape key closes dialogs
- Validation errors show inline messages

## Performance

- React Query caching for optimized API calls
- Previous data kept during refetch
- Pagination support for large transaction lists
- Memoized category maps for filtering

## Building for Production

```bash
npm run build
# Output: dist/

# Preview production build
npm run preview
```

## Type Safety

Full TypeScript support with:
- Typed API responses
- Form data schemas with Zod
- Component prop interfaces
- Custom hook return types

## Future Enhancements

- Settings page for preferences
- Export transaction data
- Budget tracking and alerts
- Transaction tags/labels
- Multi-currency support
- Mobile app version
