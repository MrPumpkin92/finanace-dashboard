import axios from 'axios';
import { Transaction, Category, PaginatedResponse, CreateTransactionInput, MonthSummary } from '../types/index';

const API_BASE = 'http://localhost:5000/api';

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
    if (categoryId) params.append('categoryId', categoryId);
    if (type) params.append('type', type);

    const response = await apiClient.get(`/transactions?${params.toString()}`);
    return response.data;
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
    const response = await apiClient.get(`/transactions/summary/${month}`);
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
    const response = await apiClient.get('/embed-token');
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
    const response = await apiClient.post('/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data || response.data;
  },
};

export default apiClient;
