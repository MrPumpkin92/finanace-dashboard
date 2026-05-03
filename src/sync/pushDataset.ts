/**
 * Strategy A: Power BI push dataset sync.
 */
import { getDatabase } from '../data/db.js';
import { Logger } from '../utils/logger.js';
import { PowerBiSyncApi } from './powerBiSyncApi.js';

export interface PushDatasetSyncOptions {
  datasetId?: string;
  workspaceId?: string;
  tableName?: string;
  batchSize?: number;
}

export interface SyncTransactionRow {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  categoryId: string;
  category_id: string;
  categoryName?: string | null;
  notes?: string | null;
  source?: string | null;
  import_hash?: string | null;
  userId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  deletedAt?: string | null;
  deleted_at?: string | null;
}

const DEFAULT_TABLE_NAME = 'Transactions';

export function loadNonDeletedTransactions(): SyncTransactionRow[] {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
        SELECT
          t.*,
          c.name AS categoryName
        FROM transactions t
        LEFT JOIN categories c ON c.id = COALESCE(t.categoryId, t.category_id)
        WHERE COALESCE(t.deletedAt, t.deleted_at) IS NULL
        ORDER BY t.date ASC, COALESCE(t.createdAt, t.created_at) ASC, t.id ASC
      `
    )
    .all() as Array<Record<string, unknown>>;

  return rows.map((row) => normalizeTransactionRow(row));
}

export async function syncPushDataset(
  options: PushDatasetSyncOptions = {}
): Promise<{ datasetId: string; rowCount: number; tableName: string }> {
  const datasetId =
    options.datasetId || process.env.POWER_BI_PUSH_DATASET_ID || process.env.POWER_BI_DATASET_ID || '';

  if (!datasetId) {
    throw new Error('POWER_BI_PUSH_DATASET_ID or POWER_BI_DATASET_ID is required for push sync');
  }

  const tableName = options.tableName || DEFAULT_TABLE_NAME;
  const batchSize = options.batchSize || 1000;
  const api = new PowerBiSyncApi({
    datasetId,
    workspaceId: options.workspaceId || process.env.POWER_BI_WORKSPACE_ID || undefined,
  });

  const transactions = loadNonDeletedTransactions();
  await api.clearRows(tableName);

  for (let index = 0; index < transactions.length; index += batchSize) {
    const batch = transactions.slice(index, index + batchSize).map((row) => toDatasetRow(row));
    await api.postRows(tableName, batch);
  }

  Logger.info('Completed Power BI push dataset sync', {
    datasetId,
    tableName,
    rowCount: transactions.length,
  });

  return {
    datasetId,
    rowCount: transactions.length,
    tableName,
  };
}

export function toDatasetRow(row: SyncTransactionRow): Record<string, unknown> {
  return {
    id: row.id,
    date: row.date,
    amount: row.amount,
    type: row.type,
    description: row.description,
    categoryId: row.categoryId,
    category_id: row.category_id,
    categoryName: row.categoryName ?? null,
    notes: row.notes ?? null,
    source: row.source ?? null,
    import_hash: row.import_hash ?? null,
    userId: row.userId ?? null,
    createdAt: row.createdAt ?? row.created_at ?? null,
    updatedAt: row.updatedAt ?? null,
    created_at: row.created_at ?? null,
    deletedAt: row.deletedAt ?? null,
    deleted_at: row.deleted_at ?? null,
  };
}

function normalizeTransactionRow(row: Record<string, unknown>): SyncTransactionRow {
  return {
    id: String(row.id || ''),
    date: String(row.date || ''),
    amount: Number(row.amount || 0),
    type: row.type === 'income' ? 'income' : 'expense',
    description: String(row.description || ''),
    categoryId: String(row.categoryId || row.category_id || ''),
    category_id: String(row.category_id || row.categoryId || ''),
    categoryName: row.categoryName ? String(row.categoryName) : null,
    notes: row.notes != null ? String(row.notes) : null,
    source: row.source != null ? String(row.source) : null,
    import_hash: row.import_hash != null ? String(row.import_hash) : null,
    userId: row.userId != null ? String(row.userId) : null,
    createdAt: row.createdAt != null ? String(row.createdAt) : null,
    updatedAt: row.updatedAt != null ? String(row.updatedAt) : null,
    created_at: row.created_at != null ? String(row.created_at) : null,
    deletedAt: row.deletedAt != null ? String(row.deletedAt) : null,
    deleted_at: row.deleted_at != null ? String(row.deleted_at) : null,
  } satisfies SyncTransactionRow;
}