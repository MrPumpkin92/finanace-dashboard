/**
 * Transaction Model
 * Represents a single financial transaction
 */
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  category_id?: string;
  categoryName?: string;
  type: 'income' | 'expense';
  date: string; // ISO 8601 date format
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  deletedAt?: string | null; // Soft delete timestamp
  deleted_at?: string | null;
  notes?: string;
  source?: 'manual' | 'csv-import' | 'csv_import';
  import_hash?: string;
  userId?: string;
}

export interface CreateTransactionInput {
  description: string;
  amount: number;
  categoryId: string;
  type: 'income' | 'expense';
  date: string;
  notes?: string;
  source?: 'manual' | 'csv-import' | 'csv_import';
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
