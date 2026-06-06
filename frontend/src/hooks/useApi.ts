import { useQuery, useMutation, UseQueryResult } from 'react-query';
import { transactionsApi, categoriesApi, embedApi, importApi } from '../utils/api';
import { Transaction, PaginatedResponse, CreateTransactionInput } from '../types/index';

/**
 * Transactions Hooks
 */
export const useTransactions = (page = 1, limit = 50, month?: string, categoryId?: string, type?: 'income' | 'expense'): UseQueryResult<PaginatedResponse<Transaction>, Error> => {
  return useQuery(
    ['transactions', page, limit, month, categoryId, type],
    () => transactionsApi.list(page, limit, month, categoryId, type),
    {
      keepPreviousData: true,
    }
  );
};

export const useTransactionSearch = (query: string) => {
  return useQuery(
    ['transactions-search', query],
    () => transactionsApi.search(query),
    {
      enabled: query.length > 0,
    }
  );
};

export const useMonthlySummary = (month: string) => {
  return useQuery(
    ['monthly-summary', month],
    () => transactionsApi.getMonthlySummary(month)
  );
};

export const useAnalytics = (months = 12) => {
  return useQuery(['analytics', months], () => transactionsApi.getAnalytics(months));
};

export const useCreateTransaction = () => {
  return useMutation((data: CreateTransactionInput) => transactionsApi.create(data));
};

export const useUpdateTransaction = () => {
  return useMutation(({ id, data }: { id: string; data: Partial<CreateTransactionInput> }) =>
    transactionsApi.update(id, data)
  );
};

export const useDeleteTransaction = () => {
  return useMutation((id: string) => transactionsApi.delete(id));
};

export const useImportCsv = () => {
  return useMutation((file: File) => importApi.uploadCsv(file));
};

/**
 * Categories Hooks
 */
export const useCategories = () => {
  return useQuery('categories', () => categoriesApi.list());
};

export const useCreateCategory = () => {
  return useMutation((data: any) => categoriesApi.create(data));
};

/**
 * Embed Hooks
 */
export const useEmbedToken = () => {
  return useQuery('embed-token', () => embedApi.getToken());
};
