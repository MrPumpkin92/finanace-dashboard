import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pollRefreshCompletion } from '../src/sync/exportAndRefresh.js';
import { SyncQueue } from '../src/sync/syncQueue.js';

describe('sync queue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('debounces rapid enqueue calls into a single sync execution', async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const queue = new SyncQueue(executor, { debounceMs: 2000 });
    const success = new Promise<void>((resolve) => {
      queue.on('sync:success', () => resolve());
    });

    queue.enqueue();
    queue.enqueue();
    queue.enqueue();

    await vi.advanceTimersByTimeAsync(1999);
    expect(executor).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await success;

    expect(executor).toHaveBeenCalledTimes(1);
    expect(queue.getPendingCount()).toBe(0);
  });

  it('retries failed sync operations with exponential backoff', async () => {
    const executor = vi.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('still failing'))
      .mockResolvedValueOnce(undefined);
    const sleep = vi.fn().mockResolvedValue(undefined);
    const queue = new SyncQueue(executor, {
      debounceMs: 1,
      maxRetries: 3,
      baseRetryDelayMs: 100,
      sleep,
    });

    await queue.flushNow();

    expect(executor).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 100);
    expect(sleep).toHaveBeenNthCalledWith(2, 200);
  });
});

describe('refresh polling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('polls until the refresh completes', async () => {
    const api = {
      getLatestRefresh: vi
        .fn()
        .mockResolvedValueOnce({ id: 'refresh-1', status: 'InProgress', startTime: '2026-05-02T00:00:00.000Z' })
        .mockResolvedValueOnce({ id: 'refresh-1', status: 'InProgress', startTime: '2026-05-02T00:00:00.000Z' })
        .mockResolvedValueOnce({ id: 'refresh-1', status: 'Completed', startTime: '2026-05-02T00:00:00.000Z' }),
    };
    const sleep = vi.fn().mockResolvedValue(undefined);

    const refresh = await pollRefreshCompletion(api as never, {
      pollIntervalMs: 30,
      timeoutMs: 200,
      sleep,
      baselineRefreshId: 'baseline-refresh',
    });

    expect(refresh.status).toBe('Completed');
    expect(api.getLatestRefresh).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledWith(30);
  });
});