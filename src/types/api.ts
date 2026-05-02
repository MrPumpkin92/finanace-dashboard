/**
 * API Response Types
 */

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  timestamp: string;
}
