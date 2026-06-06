/**
 * Frontend Type Definitions
 */

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  color: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  categoryName?: string;
  type: 'income' | 'expense';
  date: string;
  notes?: string;
  source?: 'manual' | 'csv-import';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransactionInput {
  description: string;
  amount: number;
  categoryId: string;
  type: 'income' | 'expense';
  date: string;
  notes?: string;
}

export interface UpdateTransactionInput {
  description?: string;
  amount?: number;
  categoryId?: string;
  type?: 'income' | 'expense';
  date?: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  largestExpenseCategory?: {
    name: string;
    icon?: string;
    color: string;
    amount: number;
  };
}

export interface ImportResult {
  imported: number;
  failed: number;
  errors?: string[];
}

export interface DashboardAnalytics {
  kpis: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
  };
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  categoryBreakdown: Array<{
    categoryName: string;
    total: number;
    count: number;
    color: string;
  }>;
  recentTransactions: Transaction[];
}
