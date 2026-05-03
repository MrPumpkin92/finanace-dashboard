/**
 * Power BI API client for sync workflows.
 */
import axios, { Method } from 'axios';

import { getAuthClient } from '../auth/authClient.js';
import { RefreshHistory } from '../models/PowerBI.js';
import { Logger } from '../utils/logger.js';

const POWER_BI_API_BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

export interface PowerBiSyncApiConfig {
  datasetId: string;
  workspaceId?: string;
}

export class PowerBiSyncApi {
  private readonly datasetId: string;
  private readonly workspaceId?: string;

  constructor(config: PowerBiSyncApiConfig) {
    this.datasetId = config.datasetId;
    this.workspaceId = config.workspaceId;
  }

  private buildDatasetPath(suffix: string): string {
    const workspacePrefix = this.workspaceId ? `/groups/${this.workspaceId}` : '';
    return `${workspacePrefix}/datasets/${this.datasetId}${suffix}`;
  }

  private async request<T>(method: Method, path: string, data?: unknown): Promise<T> {
    const token = await getAuthClient().acquireToken();

    const response = await axios.request<T>({
      baseURL: POWER_BI_API_BASE_URL,
      method,
      url: path,
      data,
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  public async postRows(tableName: string, rows: Array<Record<string, unknown>>): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await this.request<void>(
      'POST',
      this.buildDatasetPath(`/tables/${encodeURIComponent(tableName)}/rows`),
      { rows }
    );

    Logger.info('Pushed rows to Power BI dataset', {
      datasetId: this.datasetId,
      tableName,
      rowCount: rows.length,
    });
  }

  public async clearRows(tableName: string): Promise<void> {
    await this.request<void>(
      'DELETE',
      this.buildDatasetPath(`/tables/${encodeURIComponent(tableName)}/rows`)
    );

    Logger.info('Cleared Power BI dataset rows', {
      datasetId: this.datasetId,
      tableName,
    });
  }

  public async triggerRefresh(): Promise<void> {
    await this.request<void>('POST', this.buildDatasetPath('/refreshes'), {});

    Logger.info('Triggered Power BI dataset refresh', {
      datasetId: this.datasetId,
    });
  }

  public async getRefreshHistory(): Promise<RefreshHistory[]> {
    const response = await this.request<{ value: RefreshHistory[] }>(
      'GET',
      `${this.buildDatasetPath('/refreshes')}?$top=100`
    );

    return response.value;
  }

  public async getLatestRefresh(): Promise<RefreshHistory | null> {
    const history = await this.getRefreshHistory();
    return history[0] ?? null;
  }
}