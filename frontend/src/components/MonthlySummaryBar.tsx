import React from 'react';
import { formatCurrency } from '../utils/formatting';
import { MonthSummary } from '../types/index';
import CategoryBadge from './CategoryBadge';

interface MonthlySummaryBarProps {
  summary: MonthSummary | undefined;
  isLoading?: boolean;
}

export const MonthlySummaryBar: React.FC<MonthlySummaryBarProps> = ({ summary, isLoading = false }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-dark-bg rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-dark-bg rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Income */}
      <div className="card">
        <p className="text-sm text-gray-400 mb-2">💰 Total Income</p>
        <p className="text-2xl font-bold text-green-500">
          {formatCurrency(summary.totalIncome)}
        </p>
      </div>

      {/* Total Expenses */}
      <div className="card">
        <p className="text-sm text-gray-400 mb-2">💸 Total Expenses</p>
        <p className="text-2xl font-bold text-red-500">
          {formatCurrency(summary.totalExpenses)}
        </p>
      </div>

      {/* Net Savings */}
      <div className="card">
        <p className="text-sm text-gray-400 mb-2">📊 Net Savings</p>
        <p className={`text-2xl font-bold ${summary.netSavings >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
          {formatCurrency(summary.netSavings)}
        </p>
      </div>

      {/* Largest Expense Category */}
      <div className="card">
        <p className="text-sm text-gray-400 mb-2">📈 Largest Expense</p>
        {summary.largestExpenseCategory ? (
          <div>
            <p className="text-sm font-medium mb-1">{summary.largestExpenseCategory.name}</p>
            <p className="text-lg font-bold text-red-500">
              {formatCurrency(summary.largestExpenseCategory.amount)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No expenses</p>
        )}
      </div>
    </div>
  );
};

export default MonthlySummaryBar;
