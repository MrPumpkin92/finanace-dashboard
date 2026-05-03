import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTransactionSchema, CreateTransactionFormData } from '../utils/validation';
import { useCategories } from '../hooks/useApi';
import { useExpenseCategories, useIncomeCategories } from '../hooks/useCategories';
import { format } from 'date-fns';

interface TransactionFormProps {
  onSubmit: (data: CreateTransactionFormData) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<CreateTransactionFormData>;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  isLoading = false,
  defaultValues,
}) => {
  const { data: allCategories = [] } = useCategories();
  const expenseCategories = useExpenseCategories();
  const incomeCategories = useIncomeCategories();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateTransactionFormData>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      date: defaultValues?.date || format(new Date(), 'yyyy-MM-dd'),
      type: defaultValues?.type || 'expense',
      amount: defaultValues?.amount,
      categoryId: defaultValues?.categoryId,
      description: defaultValues?.description,
      notes: defaultValues?.notes,
    },
  });

  const transactionType = watch('type');
  const categories = transactionType === 'income' ? incomeCategories : expenseCategories;

  const handleFormSubmit = async (data: CreateTransactionFormData) => {
    await onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => field.onChange('income')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  field.value === 'income'
                    ? 'bg-green-600 text-white'
                    : 'bg-dark-bg border border-dark-border text-gray-300 hover:border-dark-border/50'
                }`}
              >
                💰 Income
              </button>
              <button
                type="button"
                onClick={() => field.onChange('expense')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                  field.value === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-dark-bg border border-dark-border text-gray-300 hover:border-dark-border/50'
                }`}
              >
                💸 Expense
              </button>
            </div>
          )}
        />
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
          Date
        </label>
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="date"
              id="date"
              className="input-field"
            />
          )}
        />
        {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
      </div>

      {/* Amount */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
          Amount
        </label>
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="number"
              id="amount"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="input-field"
              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
            />
          )}
        />
        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
      </div>

      {/* Category */}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-300 mb-2">
          Category
        </label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              id="categoryId"
              className="input-field"
            >
              <option value="">Select a category...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </option>
              ))}
            </select>
          )}
        />
        {errors.categoryId && (
          <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              type="text"
              id="description"
              placeholder="e.g., Grocery shopping"
              className="input-field"
            />
          )}
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
          Notes (optional)
        </label>
        <Controller
          name="notes"
          control={control}
          render={({ field }) => (
            <textarea
              {...field}
              id="notes"
              rows={3}
              placeholder="Add any additional notes..."
              className="input-field resize-none"
            />
          )}
        />
        {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Adding...' : 'Add Transaction'}
      </button>
    </form>
  );
};

export default TransactionForm;
