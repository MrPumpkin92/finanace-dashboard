/**
 * Transactions Routes
 * REST API endpoints for transaction management
 * Powers the finance dashboard's data entry and retrieval
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { TransactionRepository } from '../../data/transactionRepo.js';
import { CategoryRepository } from '../../data/categoryRepo.js';
import { CreateTransactionInput, UpdateTransactionInput } from '../../models/Transaction.js';
import { Validators } from '../../utils/validators.js';
import { Logger } from '../../utils/logger.js';
import { importCSV } from '../../import/csvImporter.js';
import { syncManager } from '../../sync/syncManager.js';

const router = Router();
const transactionRepo = new TransactionRepository();
const categoryRepo = new CategoryRepository();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      cb(null, true);
      return;
    }

    cb(new Error('Only CSV files are allowed'));
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/**
 * Helper: Extract user ID from request (or default user)
 */
function getUserId(req: Request): string {
  return req.user?.id || 'default-user';
}

/**
 * Helper: Parse month query string (e.g., "2024-03") into date range
 */
function parseMonthRange(monthStr?: string): { startDate: string; endDate: string } | null {
  if (!monthStr) return null;
  
  if (!/^\d{4}-\d{2}$/.test(monthStr)) {
    return null;
  }

  const [year, month] = monthStr.split('-');
  const startDate = `${year}-${month}-01`;
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0); // Last day of month
  const endDate = date.toISOString().split('T')[0];

  return { startDate, endDate };
}

/**
 * POST /api/transactions
 * Create a new transaction
 * Body: { date, amount, description, categoryId, type: "income"|"expense", notes? }
 * Validates: date is valid, amount > 0, categoryId exists
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getUserId(req);
    const input = req.body as CreateTransactionInput;

    // Validate required fields
    if (!input.date || input.amount === undefined || !input.description || !input.categoryId || !input.type) {
      res.status(400).json({
        error: 'Missing required fields: date, amount, description, categoryId, type',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate date format
    if (!Validators.isValidISODate(input.date)) {
      res.status(400).json({
        error: 'Invalid date format. Use ISO format: YYYY-MM-DD',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate amount is positive
    if (!Validators.isValidAmount(input.amount)) {
      res.status(400).json({
        error: 'Amount must be a positive number',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Validate transaction type
    if (!Validators.isValidTransactionType(input.type)) {
      res.status(400).json({
        error: 'Type must be "income" or "expense"',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Verify categoryId exists
    const category = categoryRepo.getById(input.categoryId);
    if (!category) {
      res.status(400).json({
        error: `Category with ID ${input.categoryId} does not exist`,
        code: 'INVALID_CATEGORY',
      });
      return;
    }

    const transaction = transactionRepo.create(userId, input);
    res.status(201).json(transaction);
    Logger.info('Transaction created', { userId, transactionId: transaction.id });
    syncManager.enqueueTransactionSync();
  } catch (error) {
    Logger.error('Error creating transaction', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to create transaction',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * GET /api/transactions
 * Query params: ?month=2024-03&category=groceries&type=expense&limit=100
 * Returns: filtered list of transactions, sorted by date desc
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const userId = getUserId(req);
    const limit = parseInt((req.query.limit as string) || '100', 10);

    // Parse month if provided (e.g., "2024-03")
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (req.query.month as string) {
      const monthRange = parseMonthRange(req.query.month as string);
      if (monthRange) {
        startDate = monthRange.startDate;
        endDate = monthRange.endDate;
      } else {
        res.status(400).json({
          error: 'Invalid month format. Use YYYY-MM format (e.g., 2024-03)',
          code: 'VALIDATION_ERROR',
        });
        return;
      }
    }

    // Normalize query params: ensure category is a single string and type is a string
    const categoryParam = req.query.category;
    let categoryId: string | undefined;
    if (typeof categoryParam === 'string') {
      categoryId = categoryParam;
    } else if (Array.isArray(categoryParam) && categoryParam.length > 0) {
      const firstCategory = categoryParam[0];
      if (typeof firstCategory === 'string') {
        categoryId = firstCategory;
      }
    }

    const typeParam = req.query.type;
    const type = typeof typeParam === 'string' ? (typeParam as 'income' | 'expense') : undefined;

    const filter = {
      startDate,
      endDate,
      categoryId,
      type,
      searchTerm: req.query.search as string | undefined,
    };

    // Validate type if provided
    if (filter.type && !Validators.isValidTransactionType(filter.type)) {
      res.status(400).json({
        error: 'Type must be "income" or "expense"',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    let transactions = transactionRepo.getByUserId(userId, filter);
    
    // Filter out soft-deleted transactions
    transactions = transactions.filter(t => !t.deletedAt);
    
    // Apply limit
    transactions = transactions.slice(0, limit);

    res.json(transactions);
  } catch (error) {
    Logger.error('Error fetching transactions', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to fetch transactions',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * POST /api/transactions/import
 * Import transactions from an uploaded CSV file
 */
router.post('/import', upload.single('file'), (req: Request, res: Response): void => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  try {
    const result = importCSV(file.path, {});
    res.json(result);
  } catch (error) {
    Logger.error('Error importing transactions', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to import transactions',
      code: 'INTERNAL_ERROR',
    });
  } finally {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
});

/**
 * GET /api/transactions/summary
 * Query params: ?month=2024-03
 * Returns:
 * {
 *   totalIncome: number,
 *   totalExpenses: number,
 *   netSavings: number,
 *   byCategory: { categoryName: string, total: number, count: number }[],
 *   dailyTotals: { date: string, income: number, expenses: number }[]
 * }
 */
router.get('/summary', (req: Request, res: Response): void => {
  try {
    const userId = getUserId(req);

    // Parse month if provided
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (req.query.month as string) {
      const monthRange = parseMonthRange(req.query.month as string);
      if (monthRange) {
        startDate = monthRange.startDate;
        endDate = monthRange.endDate;
      } else {
        res.status(400).json({
          error: 'Invalid month format. Use YYYY-MM format (e.g., 2024-03)',
          code: 'VALIDATION_ERROR',
        });
        return;
      }
    }

    const filter = {
      startDate,
      endDate,
    };

    // Get all transactions for the user in the date range, excluding deleted ones
    let transactions = transactionRepo.getByUserId(userId, filter);
    transactions = transactions.filter(t => !t.deletedAt);

    // Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryMap = new Map<string, { total: number; count: number }>();
    const dailyMap = new Map<string, { income: number; expenses: number }>();

    for (const tx of transactions) {
      // Update totals
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
      }

      // Update category breakdown
      const categoryName = tx.categoryName || 'Uncategorized';
      const existing = categoryMap.get(categoryName) || { total: 0, count: 0 };
      categoryMap.set(categoryName, {
        total: existing.total + tx.amount,
        count: existing.count + 1,
      });

      // Update daily totals
      const dailyKey = tx.date;
      const dailyExisting = dailyMap.get(dailyKey) || { income: 0, expenses: 0 };
      if (tx.type === 'income') {
        dailyExisting.income += tx.amount;
      } else {
        dailyExisting.expenses += tx.amount;
      }
      dailyMap.set(dailyKey, dailyExisting);
    }

    // Format response
    const byCategory = Array.from(categoryMap.entries())
      .map(([categoryName, data]) => ({
        categoryName,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total); // Sort by total descending

    const dailyTotals = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        income: data.income,
        expenses: data.expenses,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending

    res.json({
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      byCategory,
      dailyTotals,
    });

    Logger.info('Transaction summary retrieved', {
      userId,
      period: req.query.month || 'all-time',
      transactionCount: transactions.length,
    });
  } catch (error) {
    Logger.error('Error fetching transaction summary', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to fetch transaction summary',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * PUT /api/transactions/:id
 * Update any field on a transaction
 */
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const userId = getUserId(req);
    const transaction = transactionRepo.getById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        error: 'Transaction not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Verify ownership
    if (transaction.userId !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN',
      });
      return;
    }

    // Don't allow updating deleted transactions
    if (transaction.deletedAt) {
      res.status(404).json({
        error: 'Transaction has been deleted',
        code: 'NOT_FOUND',
      });
      return;
    }

    const input = req.body as UpdateTransactionInput;

    // Validate fields if provided
    if (input.amount !== undefined && !Validators.isValidAmount(input.amount)) {
      res.status(400).json({
        error: 'Amount must be a positive number',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (input.type !== undefined && !Validators.isValidTransactionType(input.type)) {
      res.status(400).json({
        error: 'Type must be "income" or "expense"',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    if (input.date !== undefined && !Validators.isValidISODate(input.date)) {
      res.status(400).json({
        error: 'Invalid date format. Use ISO format: YYYY-MM-DD',
        code: 'VALIDATION_ERROR',
      });
      return;
    }

    // Verify categoryId exists if provided
    if (input.categoryId) {
      const category = categoryRepo.getById(input.categoryId);
      if (!category) {
        res.status(400).json({
          error: `Category with ID ${input.categoryId} does not exist`,
          code: 'INVALID_CATEGORY',
        });
        return;
      }
    }

    const updated = transactionRepo.update(req.params.id, input);
    res.json(updated);
    Logger.info('Transaction updated', { userId, transactionId: req.params.id });
    syncManager.enqueueTransactionSync();
  } catch (error) {
    Logger.error('Error updating transaction', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to update transaction',
      code: 'INTERNAL_ERROR',
    });
  }
});

/**
 * DELETE /api/transactions/:id
 * Soft delete (set deletedAt timestamp, never hard delete financial records)
 */
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const userId = getUserId(req);
    const transaction = transactionRepo.getById(req.params.id);

    if (!transaction) {
      res.status(404).json({
        error: 'Transaction not found',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Verify ownership
    if (transaction.userId !== userId) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'FORBIDDEN',
      });
      return;
    }

    if (transaction.deletedAt) {
      res.status(404).json({
        error: 'Transaction has already been deleted',
        code: 'NOT_FOUND',
      });
      return;
    }

    // Soft delete by setting deletedAt timestamp
    const deleted = transactionRepo.softDelete(req.params.id);
    res.json(deleted);
    Logger.info('Transaction soft deleted', { userId, transactionId: req.params.id });
    syncManager.enqueueTransactionSync();
  } catch (error) {
    Logger.error('Error deleting transaction', {
      errorType: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({
      error: 'Failed to delete transaction',
      code: 'INTERNAL_ERROR',
    });
  }
});

export default router;
