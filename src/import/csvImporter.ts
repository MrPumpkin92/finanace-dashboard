/**
 * CSV Importer
 * Handles CSV bank export imports and transaction creation.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { v4 as uuidv4 } from 'uuid';

import { Transaction, CreateTransactionInput } from '../models/Transaction.js';
import { TransactionRepository } from '../data/transactionRepo.js';
import { CategoryRepository } from '../data/categoryRepo.js';
import { getDatabase } from '../data/db.js';

export interface ColumnMapping {
  date?: string;
  description?: string;
  debit?: string;
  credit?: string;
  amount?: string;
  category?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface LegacyImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: Array<{ row: number; error: string }>;
  transactions: Transaction[];
}

type CsvRow = Record<string, string>;
type CategoryLookup = Map<string, { id: string; name: string }>;

type NormalizedTransaction = {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category_id: string;
  notes: string | null;
  source: 'csv_import';
  import_hash: string;
  created_at: string;
  deleted_at: string | null;
  userId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
};

const CATEGORY_KEYWORDS = [
  { pattern: /payroll|salary|wages|paycheck|direct deposit/i, category: 'Salary' },
  { pattern: /freelance|invoice|contract|consult/i, category: 'Freelance' },
  { pattern: /woolworths|checkers|pick n pay|spar|grocer|loblaws|sobeys|metro|walmart|costco|no frills|food basics/i, category: 'Groceries' },
  { pattern: /rent|lease|landlord|mortgage/i, category: 'Rent' },
  { pattern: /uber|lyft|petrol|fuel|bp|shell|esso|petro|gas station|transit|presto|parking/i, category: 'Transport' },
  { pattern: /netflix|spotify|amazon prime|dstv|disney|apple\.com\/bill|youtube premium|subscription/i, category: 'Subscriptions' },
  { pattern: /restaurant|cafe|coffee|starbucks|tim hortons|mcdonald|dining|dinner|lunch|bar &|pub/i, category: 'Dining Out' },
  { pattern: /cinema|movie|concert|theatre|theater|steam|playstation|xbox|spotify/i, category: 'Entertainment' },
  { pattern: /pharmacy|chemist|clinic|dental|doctor|hospital|shoppers drug|health/i, category: 'Healthcare' },
  { pattern: /hydro|water|electric|utility|internet|telus|rogers|bell|gas bill/i, category: 'Utilities' },
  { pattern: /savings|invest|wealthsimple|rrsp|tfsa/i, category: 'Savings' },
  { pattern: /betway|sportpesa|hollywoodbets|casino|bet365|draftkings/i, category: 'Betting' },
  { pattern: /transfer|e-transfer|etransfer/i, category: 'Transfer' },
] as const;

/**
 * Import a CSV file into the database.
 */
export function importCSV(filePath: string, mapping: ColumnMapping = {}): ImportResult {
  const database = getDatabase();
  const rawContent = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = rawContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      imported: 0,
      skipped: 0,
      errors: ['CSV file is empty'],
    };
  }

  const headerRow = parse(lines[0], { trim: true }) as string[][];
  const headers = headerRow[0] ?? [];
  const resolvedMapping = resolveColumnMapping(headers, mapping);
  const categories = loadCategoryLookup(database);
  const insertTransaction = database.prepare(`
    INSERT INTO transactions (
      id, date, amount, type, description, category_id, notes, source, import_hash,
      created_at, deleted_at, userId, categoryId, createdAt, updatedAt
    ) VALUES (
      @id, @date, @amount, @type, @description, @category_id, @notes, @source, @import_hash,
      @created_at, @deleted_at, @userId, @categoryId, @createdAt, @updatedAt
    )
  `);
  const hashExists = database.prepare('SELECT 1 FROM transactions WHERE import_hash = ? LIMIT 1');

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let index = 1; index < lines.length; index++) {
    const line = lines[index];

    try {
      const parsedRows = parse(line, {
        columns: headers,
        trim: true,
        skip_empty_lines: true,
        relax_column_count: true,
      }) as CsvRow[];

      const record = parsedRows[0];
      if (!record) {
        continue;
      }

      const importHash = crypto.createHash('sha256').update(line.trim()).digest('hex');
      if (hashExists.get(importHash)) {
        skipped++;
        continue;
      }

      const normalized = normalizeTransaction(record, resolvedMapping, categories, importHash);
      insertTransaction.run(normalized);
      imported++;
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { imported, skipped, errors };
}

function resolveColumnMapping(headers: string[], mapping: ColumnMapping): Required<ColumnMapping> {
  const resolve = (value?: string, fallbacks: string[] = []): string => {
    for (const candidate of [value, ...fallbacks].filter(Boolean) as string[]) {
      const match = headers.find((header) => normalizeKey(header) === normalizeKey(candidate));
      if (match) {
        return match;
      }
    }

    return '';
  };

  return {
    date: resolve(mapping.date, ['Date', 'Transaction Date']),
    description: resolve(mapping.description, ['Description', 'Merchant']),
    debit: resolve(mapping.debit, ['Debit']),
    credit: resolve(mapping.credit, ['Credit']),
    amount: resolve(mapping.amount, ['Amount']),
    category: resolve(mapping.category, ['Category']),
  };
}

function loadCategoryLookup(database: ReturnType<typeof getDatabase>): CategoryLookup {
  const categories = database.prepare('SELECT id, name FROM categories').all() as Array<{
    id: string;
    name: string;
  }>;

  return new Map(categories.map((category) => [normalizeKey(category.name), category]));
}

function normalizeTransaction(
  record: CsvRow,
  mapping: Required<ColumnMapping>,
  categories: CategoryLookup,
  importHash: string
): NormalizedTransaction {
  const dateValue = getValue(record, mapping.date);
  const descriptionValue = getValue(record, mapping.description);
  const debitValue = getValue(record, mapping.debit);
  const creditValue = getValue(record, mapping.credit);
  const amountValue = getValue(record, mapping.amount);
  const categoryValue = getValue(record, mapping.category);

  if (!dateValue) {
    throw new Error('Missing date');
  }

  if (!descriptionValue) {
    throw new Error('Missing description');
  }

  const date = normalizeDate(dateValue);
  if (!date) {
    throw new Error(`Invalid date format: ${dateValue}`);
  }

  const { amount, type } = resolveAmountAndType(amountValue, debitValue, creditValue);
  const categoryId = resolveCategoryId(descriptionValue, categoryValue, categories);
  const now = new Date().toISOString();

  return {
    id: uuidv4(),
    date,
    amount,
    type,
    description: descriptionValue,
    category_id: categoryId,
    notes: categoryValue || null,
    source: 'csv_import',
    import_hash: importHash,
    created_at: now,
    deleted_at: null,
    userId: 'default-user',
    categoryId,
    createdAt: now,
    updatedAt: now,
  };
}

function resolveAmountAndType(
  amountValue: string,
  debitValue: string,
  creditValue: string
): { amount: number; type: 'income' | 'expense' } {
  if (creditValue) {
    return { amount: Math.abs(parseCurrencyValue(creditValue)), type: 'income' };
  }

  if (debitValue) {
    return { amount: Math.abs(parseCurrencyValue(debitValue)), type: 'expense' };
  }

  if (!amountValue) {
    throw new Error('Missing amount');
  }

  const parsedAmount = parseCurrencyValue(amountValue);
  return {
    amount: Math.abs(parsedAmount),
    type: parsedAmount >= 0 ? 'income' : 'expense',
  };
}

function resolveCategoryId(description: string, categoryValue: string, categories: CategoryLookup): string {
  for (const rule of CATEGORY_KEYWORDS) {
    if (rule.pattern.test(description)) {
      const match = categories.get(normalizeKey(rule.category));
      if (match) {
        return match.id;
      }
    }
  }

  if (categoryValue) {
    const explicitCategory = categories.get(normalizeKey(categoryValue));
    if (explicitCategory) {
      return explicitCategory.id;
    }
  }

  const otherCategory = categories.get(normalizeKey('Other'));
  if (otherCategory) {
    return otherCategory.id;
  }

  const fallbackCategory = categories.values().next().value as { id: string } | undefined;
  if (!fallbackCategory) {
    throw new Error('No categories available for import');
  }

  return fallbackCategory.id;
}

function getValue(record: CsvRow, headerName: string): string {
  if (!headerName) {
    return '';
  }

  return (record[headerName] || '').trim();
}

function parseCurrencyValue(value: string): number {
  const normalized = value
    .trim()
    .replace(/\((.*)\)/, '-$1')
    .replace(/[^0-9.-]/g, '')
    .replace(/(\..*)\./g, '$1');

  const parsed = Number.parseFloat(normalized);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid amount: ${value}`);
  }

  return parsed;
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }

  const dayFirst = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dayFirst) {
    return `${dayFirst[3]}-${dayFirst[2]}-${dayFirst[1]}`;
  }

  const monthFirst = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (monthFirst) {
    return `${monthFirst[3]}-${monthFirst[1]}-${monthFirst[2]}`;
  }

  return null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, ' ');
}

/**
 * Legacy CSV importer retained for existing tests and routes.
 */
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
  ): Promise<LegacyImportResult> {
    const errors: Array<{ row: number; error: string }> = [];
    const transactions: Transaction[] = [];
    let failedCount = 0;

    try {
      const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as CsvRow[];

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
            row: index + 2,
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
    row: CsvRow,
    _userId: string,
    options?: {
      dateFormat?: string;
      amountMultiplier?: number;
    }
  ): CreateTransactionInput | null {
    const date = this.getField(row, ['date', 'transaction_date', 'transaction date', 'post_date']);
    const description = this.getField(row, ['description', 'memo', 'payee', 'details', 'merchant']);
    const amountStr = this.getField(row, ['amount', 'value', 'transaction_amount']);
    const debitStr = this.getField(row, ['debit']);
    const creditStr = this.getField(row, ['credit']);
    const type = this.getField(row, ['type', 'transaction_type']) as 'income' | 'expense' | null;
    const categoryName = this.getField(row, ['category', 'category_name']);

    if (!date || !description || (!amountStr && !debitStr && !creditStr)) {
      throw new Error('Missing required fields: date, description, or amount');
    }

    const resolvedAmount = amountStr || creditStr || debitStr || '';
    let amount = parseFloat(this.normalizeAmountString(resolvedAmount));
    if (Number.isNaN(amount)) {
      throw new Error(`Invalid amount: ${resolvedAmount}`);
    }

    if (options?.amountMultiplier) {
      amount *= options.amountMultiplier;
    }

    amount = Math.abs(amount);

    let transactionType = type || 'expense';
    if (creditStr) {
      transactionType = 'income';
    } else if (debitStr) {
      transactionType = 'expense';
    } else if ((amountStr || '').startsWith('-')) {
      transactionType = 'expense';
    } else if ((amountStr || '').startsWith('+')) {
      transactionType = 'income';
    }

    const parsedDate = this.parseDate(date);
    if (!parsedDate) {
      throw new Error(`Invalid date format: ${date}`);
    }

    let categoryId: string;
    if (categoryName) {
      const category = this.categoryRepo.getByName(categoryName);
      if (!category) {
        throw new Error(`Category not found: ${categoryName}`);
      }
      categoryId = category.id;
    } else {
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
      source: 'csv_import',
    };
  }

  private normalizeAmountString(value: string): string {
    return value
      .trim()
      .replace(/\((.*)\)/, '-$1')
      .replace(/[^0-9.-]/g, '')
      .replace(/(\..*)\./g, '$1');
  }

  private getField(row: CsvRow, fieldNames: string[]): string | null {
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

  private parseDate(dateStr: string): string | null {
    const trimmed = dateStr.trim();
    let isoDate: string | null = null;

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      isoDate = `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    const dayFirstMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!isoDate && dayFirstMatch) {
      isoDate = `${dayFirstMatch[3]}-${dayFirstMatch[2]}-${dayFirstMatch[1]}`;
    }

    const monthFirstMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!isoDate && monthFirstMatch) {
      isoDate = `${monthFirstMatch[3]}-${monthFirstMatch[1]}-${monthFirstMatch[2]}`;
    }

    if (!isoDate) {
      return null;
    }

    const parsed = new Date(`${isoDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return isoDate;
  }
}
