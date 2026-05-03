import os from 'node:os';
import path from 'node:path';

import { jest } from '@jest/globals';
import type Database from 'better-sqlite3';

export async function createTestHarness(): Promise<{
  db: Database.Database;
  closeDatabase: () => void;
  createApp: () => import('express').Express;
  CategoryRepository: typeof import('../src/data/categoryRepo.js').CategoryRepository;
  TransactionRepository: typeof import('../src/data/transactionRepo.js').TransactionRepository;
}> {
  jest.resetModules();

  process.env.DB_PATH = ':memory:';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  process.env.CORS_ORIGIN = 'http://localhost:3000';
  process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'finance-dashboard-test-uploads');

  const dbModule = await import('../src/data/db.js');
  const appModule = await import('../src/server/app.js');
  const categoryModule = await import('../src/data/categoryRepo.js');
  const transactionModule = await import('../src/data/transactionRepo.js');

  return {
    db: dbModule.db as Database.Database,
    closeDatabase: dbModule.closeDatabase,
    createApp: appModule.createApp,
    CategoryRepository: categoryModule.CategoryRepository,
    TransactionRepository: transactionModule.TransactionRepository,
  };
}

export function fixturePath(fileName: string): string {
  return path.resolve(process.cwd(), 'tests', 'fixtures', fileName);
}