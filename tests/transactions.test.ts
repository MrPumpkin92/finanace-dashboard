import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { createTestHarness } from './helpers.js';

let harness: Awaited<ReturnType<typeof createTestHarness>>;
let app: any;
let agent: any;
let db: any;

function getCategoryId(name: string): string {
  const row = db.prepare('SELECT id FROM categories WHERE name = ?').get(name) as { id: string };
  return row.id;
}

async function setup(): Promise<void> {
  harness = await createTestHarness();
  app = harness.createApp();
  agent = request(app);
  db = harness.db;
}

afterEach(() => {
  harness?.closeDatabase();
});

describe('Transactions API', () => {
  beforeEach(async () => {
    await setup();
  });

  it('creates a transaction with valid data', async () => {
    const categoryId = getCategoryId('Groceries');

    const response = await agent
      .post('/api/transactions')
      .set('x-user-id', 'user-1')
      .send({
        date: '2024-03-05',
        amount: 125.5,
        description: 'Weekly groceries',
        categoryId,
        type: 'expense',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      date: '2024-03-05',
      amount: 125.5,
      description: 'Weekly groceries',
      categoryId,
      type: 'expense',
      userId: 'user-1',
    });
  });

  it.each([
    ['date'],
    ['amount'],
    ['categoryId'],
  ])('rejects missing required field %s', async (missingField) => {
    const categoryId = getCategoryId('Groceries');
    const payload: Record<string, unknown> = {
      date: '2024-03-05',
      amount: 125.5,
      description: 'Weekly groceries',
      categoryId,
      type: 'expense',
    };

    delete payload[missingField as string];

    const response = await agent.post('/api/transactions').set('x-user-id', 'user-1').send(payload).expect(400);

    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects amount values less than or equal to zero', async () => {
    const categoryId = getCategoryId('Groceries');

    const response = await agent
      .post('/api/transactions')
      .set('x-user-id', 'user-1')
      .send({
        date: '2024-03-05',
        amount: 0,
        description: 'Invalid transaction',
        categoryId,
        type: 'expense',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      error: 'Amount must be a positive number',
      code: 'VALIDATION_ERROR',
    });
  });

  it('returns all transactions and supports month, category, and type filters', async () => {
    const groceries = getCategoryId('Groceries');
    const salary = getCategoryId('Salary');

    await agent.post('/api/transactions').set('x-user-id', 'user-1').send({
      date: '2024-03-05',
      amount: 125.5,
      description: 'Weekly groceries',
      categoryId: groceries,
      type: 'expense',
    });

    await agent.post('/api/transactions').set('x-user-id', 'user-1').send({
      date: '2024-03-15',
      amount: 5000,
      description: 'March salary',
      categoryId: salary,
      type: 'income',
    });

    await agent.post('/api/transactions').set('x-user-id', 'user-1').send({
      date: '2024-04-02',
      amount: 89.99,
      description: 'April groceries',
      categoryId: groceries,
      type: 'expense',
    });

    const allResponse = await agent.get('/api/transactions').set('x-user-id', 'user-1').expect(200);
    expect(allResponse.body).toHaveLength(3);
    expect(allResponse.body[0].date).toBe('2024-04-02');

    const filtered = await agent
      .get('/api/transactions')
      .set('x-user-id', 'user-1')
      .query({ month: '2024-03', category: groceries, type: 'expense' })
      .expect(200);

    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0]).toMatchObject({
      date: '2024-03-05',
      categoryId: groceries,
      type: 'expense',
    });
  });

  it('returns correct summary totals and groupings', async () => {
    const groceries = getCategoryId('Groceries');
    const salary = getCategoryId('Salary');

    await agent.post('/api/transactions').set('x-user-id', 'user-1').send({
      date: '2024-03-01',
      amount: 1500,
      description: 'March salary',
      categoryId: salary,
      type: 'income',
    });

    await agent.post('/api/transactions').set('x-user-id', 'user-1').send({
      date: '2024-03-01',
      amount: 100,
      description: 'Groceries run',
      categoryId: groceries,
      type: 'expense',
    });

    await agent.post('/api/transactions').set('x-user-id', 'user-1').send({
      date: '2024-03-02',
      amount: 25,
      description: 'Second groceries run',
      categoryId: groceries,
      type: 'expense',
    });

    const response = await agent.get('/api/transactions/summary').set('x-user-id', 'user-1').expect(200);

    expect(response.body).toMatchObject({
      totalIncome: 1500,
      totalExpenses: 125,
      netSavings: 1375,
    });

    expect(response.body.byCategory).toEqual([
      { categoryName: 'Salary', total: 1500, count: 1 },
      { categoryName: 'Groceries', total: 125, count: 2 },
    ]);

    expect(response.body.dailyTotals).toEqual([
      { date: '2024-03-01', income: 1500, expenses: 100 },
      { date: '2024-03-02', income: 0, expenses: 25 },
    ]);
  });

  it('soft deletes transactions and preserves them in the database', async () => {
    const groceries = getCategoryId('Groceries');

    const created = await agent
      .post('/api/transactions')
      .set('x-user-id', 'user-1')
      .send({
        date: '2024-03-05',
        amount: 42,
        description: 'Coffee and snacks',
        categoryId: groceries,
        type: 'expense',
      })
      .expect(201);

    const deleted = await agent
      .delete(`/api/transactions/${created.body.id}`)
      .set('x-user-id', 'user-1')
      .expect(200);

    expect(deleted.body.deletedAt || deleted.body.deleted_at).toBeTruthy();

    const row = db.prepare('SELECT deletedAt, deleted_at FROM transactions WHERE id = ?').get(created.body.id) as {
      deletedAt: string | null;
      deleted_at: string | null;
    };

    expect(row.deletedAt || row.deleted_at).toBeTruthy();
    const count = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE id = ?').get(created.body.id) as {
      count: number;
    };
    expect(count.count).toBe(1);
  });

  it('excludes deleted transactions from summaries', async () => {
    const groceries = getCategoryId('Groceries');

    const deleted = await agent
      .post('/api/transactions')
      .set('x-user-id', 'user-1')
      .send({
        date: '2024-03-05',
        amount: 42,
        description: 'Coffee and snacks',
        categoryId: groceries,
        type: 'expense',
      })
      .expect(201);

    await agent.delete(`/api/transactions/${deleted.body.id}`).set('x-user-id', 'user-1').expect(200);

    await agent
      .post('/api/transactions')
      .set('x-user-id', 'user-1')
      .send({
        date: '2024-03-06',
        amount: 58,
        description: 'Lunch',
        categoryId: groceries,
        type: 'expense',
      })
      .expect(201);

    const summary = await agent.get('/api/transactions/summary').set('x-user-id', 'user-1').expect(200);

    expect(summary.body.totalExpenses).toBe(58);
    expect(summary.body.byCategory).toEqual([{ categoryName: 'Groceries', total: 58, count: 1 }]);
  });
});