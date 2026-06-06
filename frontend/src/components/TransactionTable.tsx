import React from 'react';
import { formatRelativeDate } from '../utils/formatting';
import { Transaction, Category } from '../types/index';
import CategoryBadge from './CategoryBadge';
import AmountDisplay from './AmountDisplay';

interface TransactionTableProps {
  transactions: Transaction[];
  categories: Record<string, Category>;
  isLoading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: string) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  categories,
  isLoading = false,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-400">No transactions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-dark-border">
            <th className="table-header">Date</th>
            <th className="table-header">Description</th>
            <th className="table-header">Category</th>
            <th className="table-header">Type</th>
            <th className="table-header text-right">Amount</th>
            <th className="table-header">Notes</th>
            <th className="table-header text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const category = categories[transaction.categoryId];
            return (
              <tr key={transaction.id} className="hover:bg-dark-bg transition">
                <td className="table-cell">
                  {formatRelativeDate(transaction.date)}
                </td>
                <td className="table-cell font-medium">{transaction.description}</td>
                <td className="table-cell">
                  {category && <CategoryBadge category={category} />}
                </td>
                <td className="table-cell">
                  <span className={transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                    {transaction.type === 'income' ? '📈 Income' : '📉 Expense'}
                  </span>
                </td>
                <td className="table-cell text-right">
                  <AmountDisplay amount={transaction.amount} type={transaction.type} />
                </td>
                <td className="table-cell text-sm text-gray-400">
                  {transaction.notes ? (
                    <span title={transaction.notes} className="truncate block max-w-xs">
                      {transaction.notes}
                    </span>
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </td>
                <td className="table-cell">
                  <div className="flex justify-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(transaction)}
                        className="p-1 hover:bg-blue-600/20 rounded text-blue-400 hover:text-blue-300 transition"
                        title="Edit"
                      >
                        ✎
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this transaction?')) {
                            onDelete(transaction.id);
                          }
                        }}
                        className="p-1 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300 transition"
                        title="Delete"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
