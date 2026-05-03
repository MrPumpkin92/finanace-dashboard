/**
 * Debounced retry queue for sync operations.
 */
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';

import { Logger } from '../utils/logger.js';

export interface SyncQueueOptions {
  debounceMs?: number;
  maxRetries?: number;
  baseRetryDelayMs?: number;
  failureLogPath?: string;
  sleep?: (ms: number) => Promise<void>;
}

export interface SyncSuccessEvent {
  attemptCount: number;
  pendingCount: number;
  durationMs: number;
}

export interface SyncFailureEvent {
  attemptCount: number;
  pendingCount: number;
  durationMs: number;
  error: string;
}

export class SyncQueue extends EventEmitter {
  private pendingCount = 0;
  private debounceTimer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    private readonly executor: () => Promise<void>,
    private readonly options: SyncQueueOptions = {}
  ) {
    super();
  }

  public enqueue(): void {
    this.pendingCount += 1;
    this.schedule();
  }

  public getPendingCount(): number {
    return this.pendingCount;
  }

  public clearPending(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.pendingCount = 0;
  }

  public async flushNow(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    await this.runQueuedSync(true);
  }

  private schedule(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    const debounceMs = this.options.debounceMs ?? 2000;
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.runQueuedSync(false).catch((error) => {
        Logger.error('Unexpected sync queue failure', {
          errorType: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      });
    }, debounceMs);
  }

  private async runQueuedSync(force: boolean): Promise<void> {
    if (this.running) {
      if (force) {
        return;
      }

      return;
    }

    if (!force && this.pendingCount === 0) {
      return;
    }

    const pendingCount = force ? Math.max(this.pendingCount, 1) : this.pendingCount;
    this.pendingCount = 0;
    this.running = true;
    const startedAt = Date.now();

    try {
      await this.executeWithRetry();
      const durationMs = Date.now() - startedAt;
      this.emit('sync:success', {
        attemptCount: this.options.maxRetries ?? 3,
        pendingCount,
        durationMs,
      } satisfies SyncSuccessEvent);
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('sync:failed', {
        attemptCount: this.options.maxRetries ?? 3,
        pendingCount,
        durationMs,
        error: errorMessage,
      } satisfies SyncFailureEvent);
      await this.appendFailureLog(errorMessage, pendingCount, durationMs);
    } finally {
      this.running = false;

      if (this.pendingCount > 0 && !this.debounceTimer) {
        this.schedule();
      }
    }
  }

  private async executeWithRetry(): Promise<void> {
    const maxRetries = this.options.maxRetries ?? 3;
    const baseDelayMs = this.options.baseRetryDelayMs ?? 500;
    const sleep = this.options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        await this.executor();
        return;
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        const backoffMs = baseDelayMs * 2 ** (attempt - 1);
        Logger.warn('Sync attempt failed; retrying', {
          attempt,
          backoffMs,
          errorType: error instanceof Error ? error.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        await sleep(backoffMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private async appendFailureLog(error: string, pendingCount: number, durationMs: number): Promise<void> {
    const failureLogPath = this.options.failureLogPath || path.resolve(process.cwd(), 'logs', 'sync-failures.jsonl');
    fs.mkdirSync(path.dirname(failureLogPath), { recursive: true });

    const entry = {
      timestamp: new Date().toISOString(),
      pendingCount,
      durationMs,
      error,
    };

    fs.appendFileSync(failureLogPath, `${JSON.stringify(entry)}\n`, 'utf-8');
  }
}