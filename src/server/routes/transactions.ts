/**
 * Transactions Routes
 * CRUD endpoints for transaction management
 */
import { Router, Request, Response } from 'express';
import { TransactionRepository } from '../../data/transactionRepo.js';
import { CreateTransactionInput, UpdateTransactionInput } from '../../models/Transaction.js';

const router = Router();
const transactionRepo = new TransactionRepository();

/**
 * POST /api/transactions
 * Create a new transaction
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id || 'default-user';
    const input = req.body as CreateTransactionInput;

    // Validate input
    if (!input.description || input.amount === undefined || !input.categoryId || !input.type || !input.date) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const transaction = transactionRepo.create(userId, input);
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

/**
 * GET /api/transactions
 * Get all transactions for current user
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id || 'default-user';
    const filter = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      type: req.query.type as 'income' | 'expense' | undefined,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
      searchTerm: req.query.search as string | undefined,
    };

    const transactions = transactionRepo.getByUserId(userId, filter);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

/**
 * GET /api/transactions/:id
 * Get a specific transaction
 */
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const transaction = transactionRepo.getById(req.params.id);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Verify ownership
    if (transaction.userId !== (req.user?.id || 'default-user')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

/**
 * PUT /api/transactions/:id
 * Update a transaction
 */
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const transaction = transactionRepo.getById(req.params.id);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Verify ownership
    if (transaction.userId !== (req.user?.id || 'default-user')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const input = req.body as UpdateTransactionInput;
    const updated = transactionRepo.update(req.params.id, input);
    res.json(updated);
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const transaction = transactionRepo.getById(req.params.id);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Verify ownership
    if (transaction.userId !== (req.user?.id || 'default-user')) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    transactionRepo.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

/**
 * GET /api/transactions/stats
 * Get transaction statistics
 */
router.get('/stats/summary', (req: Request, res: Response): void => {
  try {
    const userId = req.user?.id || 'default-user';
    const stats = transactionRepo.getStatistics(
      userId,
      req.query.startDate as string | undefined,
      req.query.endDate as string | undefined
    );
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
