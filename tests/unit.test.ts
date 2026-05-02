/**
 * Unit Tests
 * Test suite for repositories and utilities
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { CategoryRepository } from '../src/data/categoryRepo';
import { TransactionRepository } from '../src/data/transactionRepo';
import { initializeDatabase, closeDatabase } from '../src/data/db';
import { CSVImporter } from '../src/import/csvImporter';

let db: Database.Database;
let categoryRepo: CategoryRepository;
let transactionRepo: TransactionRepository;

beforeAll(() => {
  // Use in-memory database for testing
  db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  // Run migrations manually for test DB
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
      description TEXT,
      color TEXT,
      icon TEXT,
      isActive BOOLEAN NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      categoryId TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      notes TEXT,
      source TEXT CHECK(source IN ('manual', 'csv-import')),
      FOREIGN KEY(categoryId) REFERENCES categories(id)
    );
  `);

  categoryRepo = new CategoryRepository(db);
  transactionRepo = new TransactionRepository(db);
});

afterAll(() => {
  closeDatabase();
});

describe('CategoryRepository', () => {
  it('should create a category', () => {
    const category = categoryRepo.create({
      name: 'Test Category',
      type: 'expense',
      description: 'Test description',
    });

    expect(category).toBeDefined();
    expect(category.name).toBe('Test Category');
    expect(category.type).toBe('expense');
  });

  it('should retrieve a category by ID', () => {
    const created = categoryRepo.create({
      name: 'Groceries',
      type: 'expense',
    });

    const retrieved = categoryRepo.getById(created.id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('Groceries');
  });

  it('should get all categories', () => {
    categoryRepo.create({
      name: 'Salary',
      type: 'income',
    });

    categoryRepo.create({
      name: 'Rent',
      type: 'expense',
    });

    const all = categoryRepo.getAll();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('should get categories by type', () => {
    const expenses = categoryRepo.getByType('expense');
    expect(expenses.every((c) => c.type === 'expense')).toBe(true);
  });

  it('should update a category', () => {
    const created = categoryRepo.create({
      name: 'Original Name',
      type: 'expense',
    });

    const updated = categoryRepo.update(created.id, {
      name: 'Updated Name',
    });

    expect(updated.name).toBe('Updated Name');
  });

  it('should delete a category', () => {
    const created = categoryRepo.create({
      name: 'To Delete',
      type: 'expense',
    });

    const deleted = categoryRepo.delete(created.id);
    expect(deleted).toBe(true);

    const retrieved = categoryRepo.getById(created.id);
    expect(retrieved).toBeNull();
  });
});

describe('TransactionRepository', () => {
  it('should create a transaction', () => {
    const category = categoryRepo.create({
      name: 'Test Expense',
      type: 'expense',
    });

    const transaction = transactionRepo.create('user1', {
      description: 'Test transaction',
      amount: 100,
      categoryId: category.id,
      type: 'expense',
      date: '2024-01-15',
    });

    expect(transaction).toBeDefined();
    expect(transaction.amount).toBe(100);
    expect(transaction.type).toBe('expense');
  });

  it('should retrieve transactions by user ID', () => {
    const category = categoryRepo.create({
      name: 'Food',
      type: 'expense',
    });

    transactionRepo.create('user2', {
      description: 'Lunch',
      amount: 25,
      categoryId: category.id,
      type: 'expense',
      date: '2024-01-15',
    });

    const userTransactions = transactionRepo.getByUserId('user2');
    expect(userTransactions.length).toBeGreaterThan(0);
    expect(userTransactions.every((t) => t.userId === 'user2')).toBe(true);
  });

  it('should get transaction statistics', () => {
    const category = categoryRepo.create({
      name: 'Stats Test',
      type: 'expense',
    });

    transactionRepo.create('user3', {
      description: 'Expense 1',
      amount: 50,
      categoryId: category.id,
      type: 'expense',
      date: '2024-01-15',
    });

    const stats = transactionRepo.getStatistics('user3');
    expect(stats.totalExpense).toBeGreaterThan(0);
    expect(stats.transactionCount).toBeGreaterThan(0);
  });

  it('should filter transactions by date range', () => {
    const category = categoryRepo.create({
      name: 'Date Filter Test',
      type: 'expense',
    });

    transactionRepo.create('user4', {
      description: 'Early transaction',
      amount: 30,
      categoryId: category.id,
      type: 'expense',
      date: '2024-01-01',
    });

    transactionRepo.create('user4', {
      description: 'Late transaction',
      amount: 40,
      categoryId: category.id,
      type: 'expense',
      date: '2024-01-31',
    });

    const filtered = transactionRepo.getByUserId('user4', {
      startDate: '2024-01-15',
      endDate: '2024-01-31',
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((t) => t.date >= '2024-01-15')).toBe(true);
  });
});

describe('CSVImporter', () => {
  it('should import valid CSV data', async () => {
    const category = categoryRepo.create({
      name: 'Import Test',
      type: 'expense',
    });

    const csvContent = `date,description,amount,type,category
2024-01-15,Test transaction,100,expense,Import Test`;

    const importer = new CSVImporter();
    const result = await importer.importCSV(csvContent, 'user5');

    expect(result.success).toBe(true);
    expect(result.importedCount).toBeGreaterThan(0);
  });

  it('should handle CSV with missing fields', async () => {
    const csvContent = `date,description,amount
2024-01-15,Incomplete row,`;

    const importer = new CSVImporter();
    const result = await importer.importCSV(csvContent, 'user6');

    expect(result.failedCount).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
