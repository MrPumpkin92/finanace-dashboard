/**
 * Category Model
 * Represents expense and income categories
 */
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  type: 'income' | 'expense' | 'transfer';
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  type?: 'income' | 'expense' | 'transfer';
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'Salary', type: 'income', isActive: true },
  { name: 'Freelance Income', type: 'income', isActive: true },
  { name: 'Groceries', type: 'expense', isActive: true },
  { name: 'Rent', type: 'expense', isActive: true },
  { name: 'Utilities', type: 'expense', isActive: true },
  { name: 'Transport', type: 'expense', isActive: true },
  { name: 'Dining Out', type: 'expense', isActive: true },
  { name: 'Entertainment', type: 'expense', isActive: true },
  { name: 'Betting', type: 'expense', isActive: true },
  { name: 'Subscriptions', type: 'expense', isActive: true },
  { name: 'Healthcare', type: 'expense', isActive: true },
  { name: 'Clothing', type: 'expense', isActive: true },
  { name: 'Savings', type: 'expense', isActive: true },
  { name: 'Transfer', type: 'transfer', isActive: true },
  { name: 'Other', type: 'expense', isActive: true },
];
