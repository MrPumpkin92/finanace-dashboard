import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { formatMonth, getCurrentMonth } from '../utils/formatting';
import { useTransactions, useMonthlySummary, useCreateTransaction, useDeleteTransaction, useImportCsv } from '../hooks/useApi';
import { useCategoryMap } from '../hooks/useCategories';
import { CreateTransactionFormData } from '../utils/validation';
import MonthPicker from '../components/MonthPicker';
import MonthlySummaryBar from '../components/MonthlySummaryBar';
import TransactionTable from '../components/TransactionTable';
import TransactionForm from '../components/TransactionForm';
import FilePicker from '../components/FilePicker';
import Modal from '../components/Modal';

export const TransactionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(getCurrentMonth());
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importStatus, setImportStatus] = useState<{ imported: number; failed: number } | null>(null);

  const categoryMap = useCategoryMap();
  const { data: summaryData, isLoading: summaryLoading } = useMonthlySummary(month);
  
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions(
    page,
    50,
    month,
    categoryFilter,
    typeFilter === 'all' ? undefined : typeFilter
  );

  const createTransactionMutation = useCreateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();
  const importCsvMutation = useImportCsv();

  const handleAddTransaction = async (formData: CreateTransactionFormData) => {
    try {
      await createTransactionMutation.mutateAsync(formData);
      setShowAddModal(false);
      // Refetch transactions
      queryClient.invalidateQueries('transactions');
      queryClient.invalidateQueries(['monthly-summary', month]);
    } catch (error) {
      alert('Failed to add transaction');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransactionMutation.mutateAsync(id);
      queryClient.invalidateQueries('transactions');
      queryClient.invalidateQueries(['monthly-summary', month]);
    } catch (error) {
      alert('Failed to delete transaction');
    }
  };

  const handleCsvImport = async (file: File) => {
    try {
      const result = await importCsvMutation.mutateAsync(file);
      setImportStatus(result);
      queryClient.invalidateQueries('transactions');
      queryClient.invalidateQueries(['monthly-summary', month]);
      setTimeout(() => setImportStatus(null), 5000); // Auto-hide after 5s
    } catch (error) {
      alert('Failed to import CSV');
    }
  };

  const transactions = transactionsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">📋 Transactions</h1>
        <p className="text-gray-400">Manage your income and expenses</p>
      </div>

      {/* Import Status Alert */}
      {importStatus && (
        <div className="card bg-green-900/20 border-green-700 p-4">
          <p className="text-green-400">
            ✓ Import successful: {importStatus.imported} transactions imported
            {importStatus.failed > 0 && `, ${importStatus.failed} failed`}
          </p>
        </div>
      )}

      {/* Summary Bar */}
      <MonthlySummaryBar summary={summaryData} isLoading={summaryLoading} />

      {/* Controls Bar */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Month Picker */}
          <MonthPicker value={month} onChange={setMonth} />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              ➕ Add Transaction
            </button>
            <FilePicker onFileSelect={handleCsvImport} disabled={importCsvMutation.isLoading} />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as any);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="all">All</option>
              <option value="income">💰 Income</option>
              <option value="expense">💸 Expense</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="input-field"
            >
              <option value="">All Categories</option>
              {Object.values(categoryMap).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <TransactionTable
          transactions={transactions}
          categories={categoryMap}
          isLoading={transactionsLoading}
          onDelete={handleDeleteTransaction}
        />
      </div>

      {/* Pagination */}
      {transactionsData && transactionsData.hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setPage(page + 1)}
            className="btn-secondary"
          >
            Load More
          </button>
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddModal}
        title="➕ Add Transaction"
        onClose={() => setShowAddModal(false)}
        size="md"
      >
        <TransactionForm
          onSubmit={handleAddTransaction}
          isLoading={createTransactionMutation.isLoading}
        />
      </Modal>
    </div>
  );
};

export default TransactionsPage;
