/**
 * Transaction Model
 * Represents a single financial transaction
 */
export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  categoryId: string;
  categoryName?: string;
  type: 'income' | 'expense';
  date: string; // ISO 8601 date format
  createdAt: string;
  updatedAt: string;
  notes?: string;
  source?: 'manual' | 'csv-import';
}

export interface CreateTransactionInput {
  description: string;
  amount: number;
  categoryId: string;
  type: 'income' | 'expense';
  date: string;
  notes?: string;
  source?: 'manual' | 'csv-import';
}

export interface UpdateTransactionInput {
  description?: string;
  amount?: number;
  categoryId?: string;
  type?: 'income' | 'expense';
  date?: string;
  notes?: string;
}

export interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}
