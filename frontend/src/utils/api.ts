import axios from 'axios';
import { Transaction, Category, PaginatedResponse, CreateTransactionInput, MonthSummary, DashboardAnalytics } from '../types/index';

// Relative base: the Vite dev server proxies "/api" to the backend (see
// vite.config.ts). Override with VITE_API_BASE for a non-proxied deployment.
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Transactions API
 */
export const transactionsApi = {
  list: async (
    page = 1,
    limit = 50,
    month?: string,
    categoryId?: string,
    type?: 'income' | 'expense'
  ): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (month) params.append('month', month);
    if (categoryId) params.append('category', categoryId);
    if (type) params.append('type', type);

    const response = await apiClient.get(`/transactions?${params.toString()}`);
    const payload = response.data?.data || response.data;
    const rows = Array.isArray(payload) ? payload : payload?.data || [];

    return {
      data: rows,
      total: rows.length,
      page,
      limit,
      hasMore: rows.length === limit,
    };
  },

  create: async (data: CreateTransactionInput): Promise<Transaction> => {
    const response = await apiClient.post('/transactions', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<CreateTransactionInput>): Promise<Transaction> => {
    const response = await apiClient.put(`/transactions/${id}`, data);
    return response.data.data || response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/transactions/${id}`);
  },

  search: async (query: string): Promise<Transaction[]> => {
    const response = await apiClient.get('/transactions/search', {
      params: { q: query },
    });
    return response.data.data || response.data;
  },

  getMonthlySummary: async (month: string): Promise<MonthSummary> => {
    const response = await apiClient.get('/transactions/summary', {
      params: { month },
    });
    return response.data.data || response.data;
  },

  getAnalytics: async (months = 12): Promise<DashboardAnalytics> => {
    const response = await apiClient.get('/transactions/analytics', {
      params: { months },
    });
    return response.data.data || response.data;
  },

  importCsv: async (file: File): Promise<{ imported: number; failed: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/transactions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data || response.data;
  },
};

/**
 * Categories API
 */
export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data.data || response.data;
  },

  create: async (data: {
    name: string;
    type: 'income' | 'expense' | 'transfer';
    color?: string;
    icon?: string;
  }): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data.data || response.data;
  },

  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    const response = await apiClient.put(`/categories/${id}`, data);
    return response.data.data || response.data;
  },
};

/**
 * Embed API for Power BI
 */
export const embedApi = {
  getToken: async (): Promise<{
    token: string;
    reportId: string;
    groupId: string;
    datasetId: string;
  }> => {
    const response = await apiClient.get('/embed/config');
    return response.data.data || response.data;
  },
};

/**
 * Import API
 */
export const importApi = {
  uploadCsv: async (file: File): Promise<{ imported: number; failed: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const payload = response.data?.data || response.data;

    return {
      imported: payload.imported ?? payload.importedCount ?? 0,
      failed: payload.failed ?? payload.failedCount ?? 0,
    };
  },
};

export default apiClient;
