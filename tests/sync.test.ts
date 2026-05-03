import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SyncQueue } from '../src/sync/syncQueue.js';
import { pollRefreshCompletion } from '../src/sync/exportAndRefresh.js';

function createTempFilePath(fileName: string): string {
  return path.join(os.tmpdir(), `${fileName}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

describe('sync queue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('debounces rapid enqueue calls into a single sync execution', async () => {
    const executor = jest.fn().mockResolvedValue(undefined);
    const queue = new SyncQueue(executor, { debounceMs: 2000 });
    const success = new Promise<void>((resolve) => {
      queue.on('sync:success', () => resolve());
    });

    queue.enqueue();
    queue.enqueue();
    queue.enqueue();

    await jest.advanceTimersByTimeAsync(1999);
    expect(executor).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(1);
    await success;

    expect(executor).toHaveBeenCalledTimes(1);
    expect(queue.getPendingCount()).toBe(0);
  });

  it('retries failed sync operations and writes a failure log after the final attempt', async () => {
    const failureLogPath = createTempFilePath('sync-failures.jsonl');
    const executor = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('still failing'))
      .mockRejectedValueOnce(new Error('permanent failure'));
    const sleep = jest.fn().mockResolvedValue(undefined);
    const queue = new SyncQueue(executor, {
      debounceMs: 1,
      maxRetries: 3,
      baseRetryDelayMs: 100,
      sleep,
      failureLogPath,
    });

    await expect(queue.flushNow()).rejects.toThrow('permanent failure');
    expect(executor).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenNthCalledWith(1, 100);
    expect(sleep).toHaveBeenNthCalledWith(2, 200);

    const failureLog = fs.readFileSync(failureLogPath, 'utf-8').trim().split('\n');
    expect(failureLog).toHaveLength(1);
    expect(JSON.parse(failureLog[0])).toMatchObject({
      pendingCount: 1,
      error: 'permanent failure',
    });

    if (fs.existsSync(failureLogPath)) {
      fs.unlinkSync(failureLogPath);
    }
  });
});

describe('refresh polling', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('polls until the refresh completes', async () => {
    const api = {
      getLatestRefresh: jest
        .fn()
        .mockResolvedValueOnce({ id: 'refresh-1', status: 'InProgress', startTime: '2026-05-02T00:00:00.000Z' })
        .mockResolvedValueOnce({ id: 'refresh-1', status: 'InProgress', startTime: '2026-05-02T00:00:00.000Z' })
        .mockResolvedValueOnce({ id: 'refresh-1', status: 'Completed', startTime: '2026-05-02T00:00:00.000Z' }),
    };
    const sleep = jest.fn().mockResolvedValue(undefined);

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

  it('throws when the refresh fails', async () => {
    const api = {
      getLatestRefresh: jest
        .fn()
        .mockResolvedValueOnce({ id: 'refresh-1', status: 'InProgress', startTime: '2026-05-02T00:00:00.000Z' })
        .mockResolvedValueOnce({
          id: 'refresh-1',
          status: 'Failed',
          startTime: '2026-05-02T00:00:00.000Z',
          serviceExceptionJson: 'boom',
        }),
    };
    const sleep = jest.fn().mockResolvedValue(undefined);

    await expect(
      pollRefreshCompletion(api as never, {
        pollIntervalMs: 30,
        timeoutMs: 200,
        sleep,
        baselineRefreshId: 'baseline-refresh',
      })
    ).rejects.toThrow('Power BI refresh failed: boom');
  });
});

describe('scheduled refresh', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('registers the configured cron expression and runs the callback', async () => {
    jest.useFakeTimers();
    process.env.REFRESH_CRON = '15 6 * * *';

    const scheduleMock = jest.fn((expression: string, callback: () => void) => {
      setTimeout(callback, 1000);
      return { stop: jest.fn(), start: jest.fn(), destroy: jest.fn() };
    });
    const validateMock = jest.fn(() => true);
    const exportAndRefreshMock = jest.fn().mockResolvedValue({
      datasetId: 'dataset-1',
      exportedCount: 2,
      outputPath: '/tmp/transactions.csv',
      refreshStatus: 'Completed',
    });

    await jest.unstable_mockModule('node-cron', () => ({
      default: {
        schedule: scheduleMock,
        validate: validateMock,
      },
      schedule: scheduleMock,
      validate: validateMock,
    }));

    await jest.unstable_mockModule('../src/sync/exportAndRefresh.js', () => ({
      exportAndRefresh: exportAndRefreshMock,
    }));

    const { syncManager } = await import('../src/sync/syncManager.js');

    syncManager.startScheduler();
    expect(validateMock).toHaveBeenCalledWith('15 6 * * *');
    expect(scheduleMock).toHaveBeenCalledWith('15 6 * * *', expect.any(Function));

    await jest.advanceTimersByTimeAsync(1000);
    await Promise.resolve();

    expect(exportAndRefreshMock).toHaveBeenCalledTimes(1);
    expect(syncManager.getStatus()).toMatchObject({ status: 'synced' });
  });
});
