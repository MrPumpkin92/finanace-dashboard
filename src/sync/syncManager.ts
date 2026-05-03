/**
 * Sync orchestration for transaction updates and scheduled refreshes.
 */
import cron from 'node-cron';
import { EventEmitter } from 'node:events';

import { Logger } from '../utils/logger.js';
import { exportAndRefresh } from './exportAndRefresh.js';
import { syncPushDataset } from './pushDataset.js';
import { SyncQueue } from './syncQueue.js';

export interface SyncStatusSnapshot {
  lastSyncAt: string | null;
  status: 'synced' | 'pending' | 'failed';
  pendingCount: number;
}

export interface SyncManagerConfig {
  workspaceId?: string;
  pushDatasetId?: string;
  refreshDatasetId?: string;
  refreshCron?: string;
}

class SyncManager extends EventEmitter {
  private readonly config: SyncManagerConfig;
  private readonly pushQueue: SyncQueue;
  private scheduledTask: ReturnType<typeof cron.schedule> | null = null;
  private status: SyncStatusSnapshot = {
    lastSyncAt: null,
    status: 'synced',
    pendingCount: 0,
  };

  constructor(config: SyncManagerConfig = {}) {
    super();
    this.config = config;
    this.pushQueue = new SyncQueue(() => this.runPushDatasetSync());

    this.pushQueue.on('sync:success', (event) => {
      this.status = {
        lastSyncAt: new Date().toISOString(),
        status: 'synced',
        pendingCount: this.pushQueue.getPendingCount(),
      };
      this.emit('sync:success', event);
    });

    this.pushQueue.on('sync:failed', (event) => {
      this.status = {
        lastSyncAt: this.status.lastSyncAt,
        status: 'failed',
        pendingCount: this.pushQueue.getPendingCount(),
      };
      this.emit('sync:failed', event);
    });
  }

  public enqueueTransactionSync(): void {
    this.status = {
      lastSyncAt: this.status.lastSyncAt,
      status: 'pending',
      pendingCount: this.pushQueue.getPendingCount() + 1,
    };
    this.pushQueue.enqueue();
  }

  public getStatus(): SyncStatusSnapshot {
    return {
      lastSyncAt: this.status.lastSyncAt,
      status: this.status.status,
      pendingCount: this.pushQueue.getPendingCount(),
    };
  }

  public triggerFullSync(): void {
    this.pushQueue.clearPending();
    this.status = {
      lastSyncAt: this.status.lastSyncAt,
      status: 'pending',
      pendingCount: 0,
    };

    void this.runFullSync().catch((error) => {
      Logger.error('Manual full sync failed', {
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      this.status = {
        lastSyncAt: this.status.lastSyncAt,
        status: 'failed',
        pendingCount: 0,
      };
      this.emit('sync:failed', {
        attemptCount: 1,
        pendingCount: 0,
        durationMs: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  public startScheduler(): void {
    if (this.scheduledTask) {
      return;
    }

    const cronExpression = this.config.refreshCron || process.env.REFRESH_CRON || '0 0 * * *';
    if (!cron.validate(cronExpression)) {
      Logger.warn('Invalid REFRESH_CRON expression; scheduled refresh disabled', {
        cronExpression,
      });
      return;
    }

    this.scheduledTask = cron.schedule(cronExpression, () => {
      void this.runScheduledRefresh().catch((error) => {
        Logger.error('Scheduled refresh execution failed', {
          errorType: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      });
    });

    Logger.info('Power BI scheduled refresh started', { cronExpression });
  }

  private async runFullSync(): Promise<void> {
    await this.runPushDatasetSync();
    await this.runCsvRefreshSync();

    this.status = {
      lastSyncAt: new Date().toISOString(),
      status: 'synced',
      pendingCount: 0,
    };
  }

  private async runPushDatasetSync(): Promise<void> {
    const result = await syncPushDataset({
      workspaceId: this.config.workspaceId || process.env.POWER_BI_WORKSPACE_ID || undefined,
      datasetId: this.config.pushDatasetId || process.env.POWER_BI_PUSH_DATASET_ID || process.env.POWER_BI_DATASET_ID || undefined,
    });

    this.status = {
      lastSyncAt: new Date().toISOString(),
      status: 'synced',
      pendingCount: this.pushQueue.getPendingCount(),
    };

    Logger.info('Push dataset sync completed from sync manager', result);
  }

  private async runCsvRefreshSync(): Promise<void> {
    const result = await exportAndRefresh({
      workspaceId: this.config.workspaceId || process.env.POWER_BI_WORKSPACE_ID || undefined,
      datasetId: this.config.refreshDatasetId || process.env.POWER_BI_REFRESH_DATASET_ID || process.env.POWER_BI_DATASET_ID || undefined,
    });

    this.status = {
      lastSyncAt: new Date().toISOString(),
      status: 'synced',
      pendingCount: this.pushQueue.getPendingCount(),
    };

    Logger.info('CSV export and refresh sync completed from sync manager', result);
  }

  private async runScheduledRefresh(): Promise<void> {
    this.status = {
      lastSyncAt: this.status.lastSyncAt,
      status: 'pending',
      pendingCount: this.pushQueue.getPendingCount(),
    };

    try {
      await this.runCsvRefreshSync();
    } catch (error) {
      this.status = {
        lastSyncAt: this.status.lastSyncAt,
        status: 'failed',
        pendingCount: this.pushQueue.getPendingCount(),
      };
      this.emit('sync:failed', {
        attemptCount: 1,
        pendingCount: this.pushQueue.getPendingCount(),
        durationMs: 0,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const syncManager = new SyncManager();