/**
 * Database Module
 * Handles SQLite database connection, migrations, and default seeding.
 */
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_CATEGORIES } from '../models/Category.js';

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'finance.db');
const DB_DIR = DB_PATH === ':memory:' ? null : path.dirname(DB_PATH);

let dbInstance: Database.Database | null = null;

function createDatabase(): Database.Database {
  if (DB_DIR && !fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const database = new Database(DB_PATH);
  database.pragma('foreign_keys = ON');
  runMigrations(database);
  return database;
}

/**
 * Initialize database connection.
 */
export function initializeDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = createDatabase();
  }

  return dbInstance;
}

/**
 * Exported singleton database instance.
 */
export const db: Database.Database = initializeDatabase();

/**
 * Get database connection.
 */
export function getDatabase(): Database.Database {
  return initializeDatabase();
}

/**
 * Close database connection.
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'transfer')),
      color TEXT NOT NULL,
      icon TEXT,
      isDefault INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      amount REAL NOT NULL CHECK(amount > 0),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      description TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id),
      notes TEXT,
      source TEXT NOT NULL DEFAULT 'manual' CHECK(source IN ('manual', 'csv_import', 'csv-import')),
      import_hash TEXT,
      created_at TEXT NOT NULL,
      deleted_at TEXT,
      userId TEXT,
      categoryId TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_import_hash
      ON transactions(import_hash)
      WHERE import_hash IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
  `);

  seedDefaultCategories(database);
}

function seedDefaultCategories(database: Database.Database): void {
  const now = new Date().toISOString();
  const insertCategory = database.prepare(`
    INSERT OR IGNORE INTO categories (
      id, name, type, color, icon, isDefault, description, isActive, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const createId = (name: string): string =>
    crypto.createHash('sha256').update(`default-category:${name}`).digest('hex').slice(0, 32);

  for (const category of DEFAULT_CATEGORIES) {
    insertCategory.run(
      createId(category.name),
      category.name,
      category.type,
      category.color,
      category.icon || null,
      category.isDefault ?? 1,
      category.description || null,
      category.isActive ? 1 : 0,
      now,
      now
    );
  }
}

/**
 * Run migrations from CLI.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    initializeDatabase();
    console.info('✓ Database migrations completed successfully');
  } catch (error) {
    console.error('✗ Database migration failed:', error);
    process.exit(1);
  }
}

export default db;
