/**
 * Category Model
 * Represents expense and income categories
 */
export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  color: string;
  icon?: string;
  isDefault?: number;
  description?: string;
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
  { name: 'Salary', type: 'income', color: '#22c55e', icon: '💼', isDefault: 1, isActive: true },
  { name: 'Freelance', type: 'income', color: '#16a34a', icon: '💻', isDefault: 1, isActive: true },
  { name: 'Groceries', type: 'expense', color: '#f97316', icon: '🛒', isDefault: 1, isActive: true },
  { name: 'Rent', type: 'expense', color: '#ef4444', icon: '🏠', isDefault: 1, isActive: true },
  { name: 'Utilities', type: 'expense', color: '#f59e0b', icon: '💡', isDefault: 1, isActive: true },
  { name: 'Transport', type: 'expense', color: '#3b82f6', icon: '🚗', isDefault: 1, isActive: true },
  { name: 'Dining Out', type: 'expense', color: '#ec4899', icon: '🍽️', isDefault: 1, isActive: true },
  { name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: '🎬', isDefault: 1, isActive: true },
  { name: 'Betting', type: 'expense', color: '#dc2626', icon: '🎲', isDefault: 1, isActive: true },
  { name: 'Subscriptions', type: 'expense', color: '#06b6d4', icon: '📱', isDefault: 1, isActive: true },
  { name: 'Healthcare', type: 'expense', color: '#10b981', icon: '🏥', isDefault: 1, isActive: true },
  { name: 'Clothing', type: 'expense', color: '#f472b6', icon: '👕', isDefault: 1, isActive: true },
  { name: 'Savings', type: 'expense', color: '#6366f1', icon: '🏦', isDefault: 1, isActive: true },
  { name: 'Transfer', type: 'expense', color: '#9ca3af', icon: '🔄', isDefault: 1, isActive: true },
  { name: 'Other', type: 'expense', color: '#6b7280', icon: '📦', isDefault: 1, isActive: true },
];
