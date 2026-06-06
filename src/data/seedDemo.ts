/**
 * Demo Data Seeder
 * Populates ~6 months of realistic income/expense transactions so the
 * dashboard renders meaningful charts out of the box. Safe to run repeatedly:
 * it skips seeding when transactions already exist unless `--force` is passed,
 * in which case it removes the previously seeded demo rows first.
 *
 * Usage:
 *   npm run db:seed:demo
 *   npm run db:seed:demo -- --force
 */
import { initializeDatabase, getDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import { CategoryRepository } from './categoryRepo.js';
import { TransactionRepository } from './transactionRepo.js';
import { CreateTransactionInput } from '../models/Transaction.js';

const DEMO_USER = 'default-user';
const DEMO_TAG = '[demo]';

/**
 * Small deterministic pseudo-random generator so every run produces the same
 * (natural looking) numbers — handy for screenshots and demos.
 */
function makeRng(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function vary(base: number, spread: number, rng: () => number): number {
  const delta = (rng() * 2 - 1) * spread;
  return Math.round((base + delta) * 100) / 100;
}

function lastNMonths(n: number): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

function day(month: string, dayOfMonth: number): string {
  return `${month}-${String(dayOfMonth).padStart(2, '0')}`;
}

export async function seedDemoData(force = false): Promise<void> {
  initializeDatabase();
  await seedDatabase();

  const db = getDatabase();
  const categoryRepo = new CategoryRepository();
  const transactionRepo = new TransactionRepository();

  const existing = db
    .prepare("SELECT COUNT(*) AS count FROM transactions WHERE userId = ? AND deletedAt IS NULL")
    .get(DEMO_USER) as { count: number };

  if (existing.count > 0 && !force) {
    console.info(
      `✓ ${existing.count} transactions already present — skipping demo seed (use --force to reseed)`
    );
    return;
  }

  if (force) {
    const removed = db
      .prepare("DELETE FROM transactions WHERE userId = ? AND notes LIKE ?")
      .run(DEMO_USER, `%${DEMO_TAG}%`);
    console.info(`↺ Removed ${removed.changes} previously seeded demo transactions`);
  }

  const categoryByName = new Map<string, string>();
  for (const category of categoryRepo.getAll()) {
    categoryByName.set(category.name, category.id);
  }

  const resolve = (name: string): string => {
    const id = categoryByName.get(name);
    if (!id) {
      throw new Error(`Demo seed expected category "${name}" to exist`);
    }
    return id;
  };

  const months = lastNMonths(6);
  const inserts: CreateTransactionInput[] = [];

  months.forEach((month, index) => {
    const rng = makeRng(index + 1);

    // Income
    inserts.push({
      date: day(month, 1),
      amount: vary(5200, 120, rng),
      type: 'income',
      description: 'Monthly Salary',
      categoryId: resolve('Salary'),
      notes: DEMO_TAG,
    });
    if (rng() > 0.5) {
      inserts.push({
        date: day(month, 17),
        amount: vary(650, 250, rng),
        type: 'income',
        description: 'Freelance Project',
        categoryId: resolve('Freelance'),
        notes: DEMO_TAG,
      });
    }

    // Recurring expenses
    inserts.push({
      date: day(month, 2),
      amount: 1800,
      type: 'expense',
      description: 'Apartment Rent',
      categoryId: resolve('Rent'),
      notes: DEMO_TAG,
    });
    inserts.push({
      date: day(month, 5),
      amount: vary(145, 35, rng),
      type: 'expense',
      description: 'Hydro & Water',
      categoryId: resolve('Utilities'),
      notes: DEMO_TAG,
    });
    inserts.push({
      date: day(month, 6),
      amount: 34.99,
      type: 'expense',
      description: 'Netflix + Spotify',
      categoryId: resolve('Subscriptions'),
      notes: DEMO_TAG,
    });
    inserts.push({
      date: day(month, 28),
      amount: vary(500, 150, rng),
      type: 'expense',
      description: 'Transfer to Savings',
      categoryId: resolve('Savings'),
      notes: DEMO_TAG,
    });

    // Variable expenses (a few each month)
    const groceryRuns = 3 + Math.floor(rng() * 2);
    for (let g = 0; g < groceryRuns; g++) {
      inserts.push({
        date: day(month, 4 + g * 7),
        amount: vary(95, 40, rng),
        type: 'expense',
        description: 'Grocery Shopping',
        categoryId: resolve('Groceries'),
        notes: DEMO_TAG,
      });
    }
    inserts.push({
      date: day(month, 9),
      amount: vary(60, 25, rng),
      type: 'expense',
      description: 'Fuel',
      categoryId: resolve('Transport'),
      notes: DEMO_TAG,
    });
    inserts.push({
      date: day(month, 14),
      amount: vary(55, 30, rng),
      type: 'expense',
      description: 'Restaurant',
      categoryId: resolve('Dining Out'),
      notes: DEMO_TAG,
    });
    if (rng() > 0.4) {
      inserts.push({
        date: day(month, 21),
        amount: vary(40, 20, rng),
        type: 'expense',
        description: 'Movie / Concert',
        categoryId: resolve('Entertainment'),
        notes: DEMO_TAG,
      });
    }
    if (rng() > 0.7) {
      inserts.push({
        date: day(month, 19),
        amount: vary(80, 40, rng),
        type: 'expense',
        description: 'Pharmacy',
        categoryId: resolve('Healthcare'),
        notes: DEMO_TAG,
      });
    }
  });

  const insertMany = db.transaction((rows: CreateTransactionInput[]) => {
    for (const row of rows) {
      transactionRepo.create(DEMO_USER, row);
    }
  });
  insertMany(inserts);

  console.info(
    `✓ Seeded ${inserts.length} demo transactions across ${months.length} months (${months[0]} → ${months[months.length - 1]})`
  );
}

// Run if executed directly
if (process.argv[1] && /[\\/]seedDemo\.(ts|js)$/.test(process.argv[1])) {
  const force = process.argv.includes('--force');
  void seedDemoData(force)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('✗ Demo seed failed:', error);
      process.exit(1);
    });
}
