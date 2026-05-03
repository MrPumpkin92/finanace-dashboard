import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';

const tempFiles: string[] = [];
let cleanupDatabase: (() => void) | null = null;

async function loadImporter() {
  vi.resetModules();
  process.env.DB_PATH = path.join(
    os.tmpdir(),
    `finance-dashboard-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
  );

  const dbModule = await import('../src/data/db.js');
  const importerModule = await import('../src/import/csvImporter.js');

  cleanupDatabase = dbModule.closeDatabase;

  return {
    db: dbModule.db as Database.Database,
    importCSV: importerModule.importCSV as (
      filePath: string,
      mapping: Record<string, string>
    ) => { imported: number; skipped: number; errors: string[] },
  };
}

function createCsv(content: string): string {
  const filePath = path.join(os.tmpdir(), `finance-import-${Date.now()}-${Math.random()}.csv`);
  fs.writeFileSync(filePath, content, 'utf-8');
  tempFiles.push(filePath);
  return filePath;
}

beforeEach(() => {
  tempFiles.length = 0;
  cleanupDatabase = null;
});

afterEach(() => {
  if (cleanupDatabase) {
    cleanupDatabase();
  }

  for (const filePath of tempFiles) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  tempFiles.length = 0;
  cleanupDatabase = null;
  delete process.env.DB_PATH;
});

describe('csv import pipeline', () => {
  it('imports format A rows and maps categories', async () => {
    const { db, importCSV } = await loadImporter();
    const filePath = createCsv(`Date,Description,Debit,Credit,Balance
15/01/2024,Woolworths groceries,120.50,,1000.00
01-16-2024,Salary January,,2500.00,3500.00`);

    const result = importCSV(filePath, {});

    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.errors).toEqual([]);

    const rows = db
      .prepare('SELECT date, amount, type, description, source FROM transactions ORDER BY date')
      .all() as Array<Record<string, string | number>>;

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      date: '2024-01-15',
      amount: 120.5,
      type: 'expense',
      source: 'csv_import',
    });
    expect(rows[1]).toMatchObject({
      date: '2024-01-16',
      amount: 2500,
      type: 'income',
      source: 'csv_import',
    });
  });

  it('skips duplicate rows by import hash', async () => {
    const { db, importCSV } = await loadImporter();
    const filePath = createCsv(`Date,Description,Debit,Credit,Balance
2024-01-20,Rent payment,1500,,0`);

    const first = importCSV(filePath, {});
    const second = importCSV(filePath, {});

    expect(first.imported).toBe(1);
    expect(first.skipped).toBe(0);
    expect(second.imported).toBe(0);
    expect(second.skipped).toBe(1);

    const count = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
    expect(count.count).toBe(1);
  });

  it('normalizes supported date formats', async () => {
    const { db, importCSV } = await loadImporter();
    const filePath = createCsv(`Transaction Date,Merchant,Amount,Category
2024-02-01,Spotify,9.99,Subscriptions
01/02/2024,Spar,45.00,Groceries
02-03-2024,Shell Fuel,-60.00,Transport`);

    const result = importCSV(filePath, {});

    expect(result.imported).toBe(3);

    const dates = db.prepare('SELECT date FROM transactions ORDER BY date').all() as Array<{
      date: string;
    }>;

    expect(dates.map((row) => row.date)).toEqual(['2024-02-01', '2024-02-01', '2024-02-03']);
  });

  it('matches keywords to the expected categories', async () => {
    const { db, importCSV } = await loadImporter();
    const filePath = createCsv(`Date,Description,Debit,Credit,Balance
2024-03-01,Woolworths online order,250,,
2024-03-02,Uber trip downtown,55,,
2024-03-03,Netflix monthly subscription,18,,
2024-03-04,Betway winnings,100,,
2024-03-05,Monthly salary,,5000,`);

    const result = importCSV(filePath, {});

    expect(result.imported).toBe(5);

    const rows = db
      .prepare(
        `
        SELECT t.description, c.name AS categoryName
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        ORDER BY t.date
      `
      )
      .all() as Array<{ description: string; categoryName: string }>;

    expect(rows.map((row) => [row.description, row.categoryName])).toEqual([
      ['Woolworths online order', 'Groceries'],
      ['Uber trip downtown', 'Transport'],
      ['Netflix monthly subscription', 'Subscriptions'],
      ['Betway winnings', 'Betting'],
      ['Monthly salary', 'Salary'],
    ]);
  });
});
