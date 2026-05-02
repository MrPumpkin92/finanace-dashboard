/**
 * CSV Importer
 * Handles CSV bank export imports and transaction creation
 */
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, CreateTransactionInput } from '../models/Transaction.js';
import { TransactionRepository } from '../data/transactionRepo.js';
import { CategoryRepository } from '../data/categoryRepo.js';
import { getDatabase } from '../data/db.js';

export interface CSVRow {
  date?: string;
  description?: string;
  amount?: string;
  type?: string;
  category?: string;
  [key: string]: unknown;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; error: string }>;
  transactions: Transaction[];
}

export class CSVImporter {
  private transactionRepo: TransactionRepository;
  private categoryRepo: CategoryRepository;

  constructor() {
    const db = getDatabase();
    this.transactionRepo = new TransactionRepository(db);
    this.categoryRepo = new CategoryRepository(db);
  }

  /**
   * Import transactions from CSV content
   */
  public async importCSV(
    csvContent: string,
    userId: string,
    options?: {
      dateFormat?: string;
      amountMultiplier?: number;
    }
  ): Promise<ImportResult> {
    const errors: Array<{ row: number; error: string }> = [];
    const transactions: Transaction[] = [];
    let failedCount = 0;

    try {
      // Parse CSV
      const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CSVRow[];

      // Process each row
      rows.forEach((row, index) => {
        try {
          const transaction = this.parseCSVRow(row, userId, options);
          if (transaction) {
            const created = this.transactionRepo.create(userId, transaction);
            transactions.push(created);
          }
        } catch (error) {
          failedCount++;
          errors.push({
            row: index + 2, // +2 because of header and 0-indexing
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });

      return {
        success: failedCount === 0,
        importedCount: transactions.length,
        failedCount,
        errors,
        transactions,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse a single CSV row to transaction
   */
  private parseCSVRow(
    row: CSVRow,
    userId: string,
    options?: {
      dateFormat?: string;
      amountMultiplier?: number;
    }
  ): CreateTransactionInput | null {
    // Extract fields (case-insensitive)
    const date = this.getField(row, ['date', 'transaction_date', 'post_date', 'date']);
    const description = this.getField(row, ['description', 'memo', 'payee', 'details']);
    const amountStr = this.getField(row, ['amount', 'value', 'transaction_amount']);
    const type = this.getField(row, ['type', 'transaction_type']) as 'income' | 'expense' | null;
    const categoryName = this.getField(row, ['category', 'category_name']);

    // Validate required fields
    if (!date || !description || !amountStr) {
      throw new Error('Missing required fields: date, description, or amount');
    }

    // Parse amount
    let amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      throw new Error(`Invalid amount: ${amountStr}`);
    }

    // Apply multiplier if needed
    if (options?.amountMultiplier) {
      amount *= options.amountMultiplier;
    }

    amount = Math.abs(amount);

    // Determine transaction type
    let transactionType = type || 'expense';
    if (amountStr.startsWith('-')) {
      transactionType = 'expense';
    } else if (amountStr.startsWith('+')) {
      transactionType = 'income';
    }

    // Parse date (assume ISO format or basic formats)
    const parsedDate = this.parseDate(date);
    if (!parsedDate) {
      throw new Error(`Invalid date format: ${date}`);
    }

    // Find category
    let categoryId: string;
    if (categoryName) {
      const category = this.categoryRepo.getByName(categoryName);
      if (!category) {
        throw new Error(`Category not found: ${categoryName}`);
      }
      categoryId = category.id;
    } else {
      // Default to 'Other' category
      const otherCategory = this.categoryRepo.getByName('Other');
      if (!otherCategory) {
        throw new Error('Default "Other" category not found');
      }
      categoryId = otherCategory.id;
    }

    return {
      description,
      amount,
      categoryId,
      type: transactionType,
      date: parsedDate,
      source: 'csv-import',
    };
  }

  /**
   * Get field from row (case-insensitive)
   */
  private getField(row: CSVRow, fieldNames: string[]): string | null {
    const lowerRow = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value])
    );

    for (const fieldName of fieldNames) {
      const value = lowerRow[fieldName.toLowerCase()];
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  /**
   * Parse date string to ISO format
   */
  private parseDate(dateStr: string): string | null {
    // Try to parse various date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}/, // ISO: YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // US: MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/, // EU: DD-MM-YYYY
    ];

    let date: Date | null = null;

    for (const format of formats) {
      if (format.test(dateStr)) {
        date = new Date(dateStr);
        break;
      }
    }

    if (!date || isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().split('T')[0];
  }
}
