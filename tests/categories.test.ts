import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { createTestHarness } from './helpers.js';

let harness: Awaited<ReturnType<typeof createTestHarness>>;
let app: any;
let agent: any;

async function setup(): Promise<void> {
  harness = await createTestHarness();
  app = harness.createApp();
  agent = request(app);
}

afterEach(() => {
  harness?.closeDatabase();
});

describe('Categories API', () => {
  beforeEach(async () => {
    await setup();
  });

  it('seeds default categories on first database init', async () => {
    const response = await agent.get('/api/categories').expect(200);

    expect(response.body.length).toBeGreaterThanOrEqual(15);
    expect(response.body.map((category: { name: string }) => category.name)).toEqual(
      expect.arrayContaining(['Groceries', 'Salary', 'Subscriptions', 'Betting'])
    );
  });

  it('creates a custom category', async () => {
    const response = await agent
      .post('/api/categories')
      .send({
        name: 'Gifts',
        type: 'expense',
        description: 'Gift purchases',
        color: '#123456',
        icon: '🎁',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Gifts',
      type: 'expense',
      description: 'Gift purchases',
      color: '#123456',
      icon: '🎁',
      isActive: 1,
    });
  });

  it('rejects duplicate category names', async () => {
    await agent
      .post('/api/categories')
      .send({
        name: 'Travel',
        type: 'expense',
      })
      .expect(201);

    const duplicate = await agent
      .post('/api/categories')
      .send({
        name: 'Travel',
        type: 'expense',
      })
      .expect(409);

    expect(duplicate.body).toMatchObject({
      error: 'Category with this name already exists',
      code: 'CONFLICT',
    });
  });
});