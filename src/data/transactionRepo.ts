/**
 * Transaction Repository
 * CRUD operations for transactions
 */
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import {
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from '../models/Transaction.js';
import { getDatabase } from './db.js';

export class TransactionRepository {
  private db: Database.Database;

  constructor(database?: Database.Database) {
    this.db = database || getDatabase();
  }

  /**
   * Create a new transaction
   */
  public create(userId: string, input: CreateTransactionInput): Transaction {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO transactions (
        id, userId, description, amount, category_id, categoryId, type, date,
        created_at, deleted_at, createdAt, updatedAt, notes, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      input.description,
      input.amount,
      input.categoryId,
      input.categoryId,
      input.type,
      input.date,
      now,
      null,
      now,
      now,
      input.notes || null,
      input.source || 'manual'
    );

    return this.getById(id) as Transaction;
  }

  /**
   * Get transaction by ID
   */
  public getById(id: string): Transaction | null {
    const stmt = this.db.prepare('SELECT * FROM transactions WHERE id = ?');
    return (stmt.get(id) as Transaction) || null;
  }

  /**
   * Get all transactions for a user with optional filters
   */
  public getByUserId(userId: string, filter?: TransactionFilter): Transaction[] {
    let query = `
      SELECT t.*, c.name AS categoryName
      FROM transactions t
      LEFT JOIN categories c ON c.id = COALESCE(t.categoryId, t.category_id)
      WHERE t.userId = ?
    `;
    const params: unknown[] = [userId];

    if (filter?.startDate) {
      query += ' AND date >= ?';
      params.push(filter.startDate);
    }

    if (filter?.endDate) {
      query += ' AND date <= ?';
      params.push(filter.endDate);
    }

    if (filter?.categoryId) {
      query += ' AND COALESCE(t.categoryId, t.category_id) = ?';
      params.push(filter.categoryId);
    }

    if (filter?.type) {
      query += ' AND type = ?';
      params.push(filter.type);
    }

    if (filter?.minAmount !== undefined) {
      query += ' AND amount >= ?';
      params.push(filter.minAmount);
    }

    if (filter?.maxAmount !== undefined) {
      query += ' AND amount <= ?';
      params.push(filter.maxAmount);
    }

    if (filter?.searchTerm) {
      query += ' AND (description LIKE ? OR notes LIKE ?)';
      const searchPattern = `%${filter.searchTerm}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY t.date DESC, COALESCE(t.createdAt, t.created_at) DESC';

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Transaction[];
  }

  /**
   * Update a transaction
   */
  public update(id: string, input: UpdateTransactionInput): Transaction {
    const transaction = this.getById(id);
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.amount !== undefined) {
      updates.push('amount = ?');
      values.push(input.amount);
    }
    if (input.categoryId !== undefined) {
      updates.push('categoryId = ?');
      values.push(input.categoryId);
    }
    if (input.type !== undefined) {
      updates.push('type = ?');
      values.push(input.type);
    }
    if (input.date !== undefined) {
      updates.push('date = ?');
      values.push(input.date);
    }
    if (input.notes !== undefined) {
      updates.push('notes = ?');
      values.push(input.notes || null);
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    const stmt = this.db.prepare(
      `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`
    );
    stmt.run(...values);

    return this.getById(id) as Transaction;
  }

  /**
   * Delete a transaction (hard delete - be careful!)
   * @deprecated Use softDelete instead for financial records
   */
  public delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Soft delete a transaction (set deletedAt timestamp)
   * Preserves the record for audit purposes
   */
  public softDelete(id: string): Transaction {
    const transaction = this.getById(id);
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const now = new Date().toISOString();
    const stmt = this.db.prepare(
      'UPDATE transactions SET deletedAt = ?, deleted_at = ?, updatedAt = ? WHERE id = ?'
    );
    stmt.run(now, now, now, id);

    return this.getById(id) as Transaction;
  }

  /**
   * Get transaction statistics for a user
   */
  public getStatistics(userId: string, startDate?: string, endDate?: string): {
    totalIncome: number;
    totalExpense: number;
    transactionCount: number;
    categoryBreakdown: Array<{ categoryId: string; categoryName: string; total: number }>;
  } {
    let filterQuery = 'WHERE userId = ?';
    const params: unknown[] = [userId];

    if (startDate) {
      filterQuery += ' AND date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      filterQuery += ' AND date <= ?';
      params.push(endDate);
    }

    // Total income and expense
    const statsStmt = this.db.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
        COUNT(*) as transactionCount
      FROM transactions
      ${filterQuery}
    `);

    const stats = statsStmt.get(...params) as {
      totalIncome: number;
      totalExpense: number;
      transactionCount: number;
    };

    // Category breakdown
    const categoryStmt = this.db.prepare(`
      SELECT 
        t.categoryId,
        c.name as categoryName,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.categoryId = c.id
      ${filterQuery}
      GROUP BY t.categoryId, c.name
      ORDER BY total DESC
    `);

    const categoryBreakdown = categoryStmt.all(
      ...params
    ) as Array<{ categoryId: string; categoryName: string; total: number }>;

    return {
      ...stats,
      categoryBreakdown,
    };
  }
}
