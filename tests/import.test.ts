import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { fixturePath } from './helpers.js';

const tempFiles: string[] = [];

async function freshImporter(): Promise<{
  db: any;
  closeDatabase: () => void;
  importCSV: (filePath: string, mapping?: Record<string, string>) => { imported: number; skipped: number; errors: string[] };
}> {
  jest.resetModules();
  process.env.DB_PATH = ':memory:';
  process.env.LOG_LEVEL = 'silent';

  const dbModule = await import('../src/data/db.js');
  const importerModule = await import('../src/import/csvImporter.js');

  return {
    db: dbModule.db,
    closeDatabase: dbModule.closeDatabase,
    importCSV: importerModule.importCSV,
  };
}

function writeTempCsv(content: string): string {
  const filePath = path.join(os.tmpdir(), `finance-import-${Date.now()}-${Math.random().toString(16).slice(2)}.csv`);
  fs.writeFileSync(filePath, content, 'utf-8');
  tempFiles.push(filePath);
  return filePath;
}

afterEach(() => {
  for (const filePath of tempFiles) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  tempFiles.length = 0;
});

describe('CSV import pipeline', () => {
  it('imports the standard bank CSV fixture correctly', async () => {
    const { db, closeDatabase, importCSV } = await freshImporter();
    try {
      const result = importCSV(fixturePath('standard-bank.csv'));

      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);

      const rows = db
        .prepare(
          `
            SELECT t.date, t.amount, t.type, t.description, c.name AS categoryName
            FROM transactions t
            JOIN categories c ON c.id = t.category_id
            ORDER BY t.date ASC
          `
        )
        .all() as Array<{ date: string; amount: number; type: string; description: string; categoryName: string }>;

      expect(rows).toEqual([
        { date: '2024-01-15', amount: 125.5, type: 'expense', description: 'Woolworths groceries', categoryName: 'Groceries' },
        { date: '2024-01-16', amount: 5000, type: 'income', description: 'Salary January', categoryName: 'Salary' },
        { date: '2024-01-17', amount: 250, type: 'expense', description: 'Betway deposit', categoryName: 'Betting' },
      ]);
    } finally {
      closeDatabase();
    }
  });

  it('imports the credit card CSV fixture correctly', async () => {
    const { db, closeDatabase, importCSV } = await freshImporter();
    try {
      const result = importCSV(fixturePath('credit-card.csv'));

      expect(result.imported).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.errors).toEqual([]);

      const categories = db
        .prepare(
          `
            SELECT t.description, t.date, c.name AS categoryName
            FROM transactions t
            JOIN categories c ON c.id = t.category_id
            ORDER BY t.date ASC
          `
        )
        .all() as Array<{ description: string; date: string; categoryName: string }>;

      expect(categories).toEqual([
        { description: 'Netflix subscription', date: '2024-02-03', categoryName: 'Subscriptions' },
        { description: 'Woolworths online', date: '2024-03-03', categoryName: 'Groceries' },
        { description: 'Betway wager', date: '2024-04-03', categoryName: 'Betting' },
      ]);
    } finally {
      closeDatabase();
    }
  });

  it('normalizes DD/MM/YYYY and MM-DD-YYYY dates to YYYY-MM-DD', async () => {
    const { db, closeDatabase, importCSV } = await freshImporter();
    try {
      const result = importCSV(
        writeTempCsv(`Date,Description,Debit,Credit,Balance
15/04/2024,Woolworths groceries,12.50,,1000
04-16-2024,Netflix,18.99,,981.01`)
      );

      expect(result.imported).toBe(2);

      const dates = db.prepare('SELECT date FROM transactions ORDER BY date ASC').all() as Array<{ date: string }>;
      expect(dates.map((row) => row.date)).toEqual(['2024-04-15', '2024-04-16']);
    } finally {
      closeDatabase();
    }
  });

  it('deduplicates rows with identical import hashes and reports skipped rows accurately', async () => {
    const { db, closeDatabase, importCSV } = await freshImporter();
    try {
      const result = importCSV(
        writeTempCsv(`Date,Description,Debit,Credit,Balance
15/04/2024,Woolworths groceries,12.50,,1000
15/04/2024,Woolworths groceries,12.50,,1000`)
      );

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toEqual([]);

      const count = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
      expect(count.count).toBe(1);
    } finally {
      closeDatabase();
    }
  });

  it('auto-matches keyword categories for groceries, subscriptions, and betting', async () => {
    const { db, closeDatabase, importCSV } = await freshImporter();
    try {
      const result = importCSV(
        writeTempCsv(`Date,Description,Debit,Credit,Balance
15/04/2024,Woolworths groceries,12.50,,1000
16/04/2024,Netflix monthly,18.99,,981.01
17/04/2024,Betway deposit,50.00,,931.01`)
      );

      expect(result.imported).toBe(3);

      const rows = db
        .prepare(
          `
            SELECT t.description, c.name AS categoryName
            FROM transactions t
            JOIN categories c ON c.id = t.category_id
            ORDER BY t.date ASC
          `
        )
        .all() as Array<{ description: string; categoryName: string }>;

      expect(rows).toEqual([
        { description: 'Woolworths groceries', categoryName: 'Groceries' },
        { description: 'Netflix monthly', categoryName: 'Subscriptions' },
        { description: 'Betway deposit', categoryName: 'Betting' },
      ]);
    } finally {
      closeDatabase();
    }
  });
});
