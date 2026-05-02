/**
 * Database Module
 * Handles SQLite database connection and migrations
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/finance.db';
const DB_DIR = path.dirname(DB_PATH);

let db: Database.Database | null = null;

/**
 * Initialize database connection
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations(db);

  return db;
}

/**
 * Get database connection
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Run database migrations
 */
function runMigrations(database: Database.Database): void {
  // Create categories table
  database.exec(`
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
    )
  `);

  // Create transactions table
  database.exec(`
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
    )
  `);

  // Create indices for common queries
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);
    CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_transactions_userId_date ON transactions(userId, date);
  `);
}

/**
 * Run migrations from CLI
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
