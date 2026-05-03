import { format, parse, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date: string | Date, formatStr = 'MMM dd, yyyy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
};

/**
 * Parse month string (YYYY-MM)
 */
export const parseMonth = (monthStr: string): Date => {
  return parse(monthStr, 'yyyy-MM', new Date());
};

/**
 * Get month range
 */
export const getMonthRange = (monthStr: string): { start: string; end: string } => {
  const date = parseMonth(monthStr);
  const start = format(startOfMonth(date), 'yyyy-MM-dd');
  const end = format(endOfMonth(date), 'yyyy-MM-dd');
  return { start, end };
};

/**
 * Format month (YYYY-MM)
 */
export const formatMonth = (date: Date): string => {
  return format(date, 'yyyy-MM');
};

/**
 * Get current month
 */
export const getCurrentMonth = (): string => {
  return formatMonth(new Date());
};

/**
 * Add/subtract months
 */
export const addMonths = (monthStr: string, months: number): string => {
  const date = parseMonth(monthStr);
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return formatMonth(newDate);
};

/**
 * Format relative date
 */
export const formatRelativeDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
    return 'Today';
  }

  if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
    return 'Yesterday';
  }

  return format(date, 'MMM dd, yyyy');
};
