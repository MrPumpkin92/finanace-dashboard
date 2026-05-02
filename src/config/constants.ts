/**
 * API Constants
 */

export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export const CATEGORY_TYPES = ['income', 'expense', 'transfer'] as const;
export const CSV_IMPORT_SOURCES = ['manual', 'csv-import'] as const;

export const API_LIMITS = {
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMPORT_ROWS: 10000,
  MAX_PAGE_SIZE: 1000,
  DEFAULT_PAGE_SIZE: 50,
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  MULTI_STATUS: 207,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};
