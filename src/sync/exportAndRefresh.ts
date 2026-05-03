/**
 * Strategy B: CSV export plus Power BI dataset refresh.
 */
import fs from 'node:fs';
import path from 'node:path';

import { Logger } from '../utils/logger.js';
import { PowerBiSyncApi } from './powerBiSyncApi.js';
import { SyncTransactionRow, loadNonDeletedTransactions } from './pushDataset.js';

export interface ExportAndRefreshOptions {
  datasetId?: string;
  workspaceId?: string;
  outputPath?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export interface PollRefreshOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  baselineRefreshId?: string | null;
}

const DEFAULT_EXPORT_PATH = path.resolve(process.cwd(), 'reports', 'transactions_export.csv');
const CSV_COLUMNS = [
  'id',
  'date',
  'amount',
  'type',
  'description',
  'categoryId',
  'category_id',
  'categoryName',
  'notes',
  'source',
  'import_hash',
  'userId',
  'createdAt',
  'updatedAt',
  'created_at',
  'deletedAt',
  'deleted_at',
] as const;

export async function exportAndRefresh(
  options: ExportAndRefreshOptions = {}
): Promise<{ datasetId: string; exportedCount: number; outputPath: string; refreshStatus: string }> {
  const datasetId =
    options.datasetId || process.env.POWER_BI_REFRESH_DATASET_ID || process.env.POWER_BI_DATASET_ID || '';

  if (!datasetId) {
    throw new Error('POWER_BI_REFRESH_DATASET_ID or POWER_BI_DATASET_ID is required for CSV refresh');
  }

  const api = new PowerBiSyncApi({
    datasetId,
    workspaceId: options.workspaceId || process.env.POWER_BI_WORKSPACE_ID || undefined,
  });
  const outputPath = options.outputPath || DEFAULT_EXPORT_PATH;
  const transactions = loadNonDeletedTransactions();

  writeTransactionsCsv(outputPath, transactions);

  const baselineRefresh = await api.getLatestRefresh();
  await api.triggerRefresh();

  const latestRefresh = await pollRefreshCompletion(api, {
    pollIntervalMs: options.pollIntervalMs,
    timeoutMs: options.timeoutMs,
    sleep: options.sleep,
    baselineRefreshId: baselineRefresh?.id ?? null,
  });

  Logger.info('Completed CSV export and Power BI refresh', {
    datasetId,
    exportedCount: transactions.length,
    outputPath,
    refreshStatus: latestRefresh.status,
  });

  return {
    datasetId,
    exportedCount: transactions.length,
    outputPath,
    refreshStatus: latestRefresh.status,
  };
}

export async function pollRefreshCompletion(
  api: PowerBiSyncApi,
  options: PollRefreshOptions = {}
): Promise<{ id: string; status: string; startTime: string }> {
  const pollIntervalMs = options.pollIntervalMs ?? 30_000;
  const timeoutMs = options.timeoutMs ?? 20 * 60 * 1000;
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const deadline = Date.now() + timeoutMs;
  const baselineRefreshId = options.baselineRefreshId ?? null;

  while (Date.now() <= deadline) {
    const latest = await api.getLatestRefresh();

    if (latest && latest.id !== baselineRefreshId) {
      if (latest.status === 'Completed') {
        return {
          id: latest.id,
          status: latest.status,
          startTime: latest.startTime,
        };
      }

      if (latest.status === 'Failed') {
        throw new Error(`Power BI refresh failed: ${latest.serviceExceptionJson || latest.id}`);
      }

      if (latest.status === 'InProgress' || latest.status === 'Unknown') {
        await sleep(pollIntervalMs);
        continue;
      }

      if (latest.status === 'Disabled') {
        throw new Error('Power BI refresh is disabled for this dataset');
      }
    }

    await sleep(pollIntervalMs);
  }

  throw new Error('Timed out waiting for Power BI dataset refresh');
}

function writeTransactionsCsv(outputPath: string, transactions: SyncTransactionRow[]): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const lines = [CSV_COLUMNS.join(',')];
  for (const transaction of transactions) {
    const values = CSV_COLUMNS.map((column) => escapeCsvValue(transaction[column as keyof SyncTransactionRow]));
    lines.push(values.join(','));
  }

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf-8');
}

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  if (/[,"\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}