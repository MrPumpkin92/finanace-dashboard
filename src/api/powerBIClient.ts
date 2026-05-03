/**
 * Power BI API Client
 * Handles communication with Power BI REST API
 */
import axios, { AxiosInstance } from 'axios';
import { getAuthClient } from '../auth/authClient.js';
import { Logger } from '../utils/logger.js';
import { ApiError } from '../utils/errors.js';
import {
  Workspace,
  Report,
  RefreshHistory,
  EmbedToken,
} from '../models/PowerBI.js';

const POWER_BI_API_BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

/**
 * Power BI REST API Client
 * Manages authenticated requests to Power BI service
 */
export class PowerBIClient {
  private apiClient: AxiosInstance | null = null;
  private readonly maxRetryAttempts: number;
  private readonly baseRetryDelayMs: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(options: { maxRetryAttempts?: number; baseRetryDelayMs?: number; sleep?: (ms: number) => Promise<void> } = {}) {
    this.maxRetryAttempts = options.maxRetryAttempts ?? 3;
    this.baseRetryDelayMs = options.baseRetryDelayMs ?? 500;
    this.sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  }

  /**
   * Initialize the API client with authenticated axios instance
   */
  private async initializeClient(): Promise<AxiosInstance> {
    if (this.apiClient) {
      return this.apiClient;
    }

    const authClient = getAuthClient();
    const token = await authClient.acquireToken();

    this.apiClient = axios.create({
      baseURL: POWER_BI_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Add response interceptor to handle token refresh on 401
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          Logger.warn('Received 401 from Power BI API, refreshing token');
          const authClient = getAuthClient();
          const newToken = await authClient.refreshToken();
          if (this.apiClient) {
            this.apiClient.defaults.headers.Authorization = `Bearer ${newToken}`;
          }
          return this.apiClient!.request(error.config);
        }
        return Promise.reject(error);
      }
    );

    return this.apiClient;
  }

  private async requestWith429Retry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxRetryAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;

        if (status !== 429 || attempt === this.maxRetryAttempts) {
          throw error;
        }

        const backoffMs = this.baseRetryDelayMs * 2 ** (attempt - 1);
        Logger.warn('Power BI API rate limited; retrying request', {
          attempt,
          backoffMs,
        });
        await this.sleep(backoffMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Power BI request failed');
  }

  /**
   * Get all workspaces the service principal has access to
   * @returns {Promise<Workspace[]>} List of workspaces
   * @throws {ApiError} If request fails
   */
  public async getWorkspaces(): Promise<Workspace[]> {
    try {
      const client = await this.initializeClient();
      const response = await this.requestWith429Retry(() => client.get<{ value: Workspace[] }>('/groups'));
      
      Logger.info('Retrieved Power BI workspaces', {
        count: response.data.value.length,
      });

      return response.data.value;
    } catch (error) {
      Logger.error('Failed to fetch Power BI workspaces', {
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Failed to fetch Power BI workspaces', 500);
    }
  }

  /**
   * Get all reports in a workspace
   * @param {string} workspaceId The workspace ID
   * @returns {Promise<Report[]>} List of reports in the workspace
   * @throws {ApiError} If request fails
   */
  public async getReports(workspaceId: string): Promise<Report[]> {
    try {
      const client = await this.initializeClient();
      const response = await this.requestWith429Retry(() =>
        client.get<{ value: Report[] }>(`/groups/${workspaceId}/reports`)
      );

      Logger.info('Retrieved Power BI reports', {
        workspaceId,
        count: response.data.value.length,
      });

      return response.data.value;
    } catch (error) {
      Logger.error('Failed to fetch Power BI reports', {
        workspaceId,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Failed to fetch Power BI reports', 500);
    }
  }

  /**
   * Get a specific report by ID
   * @param {string} workspaceId The workspace ID
   * @param {string} reportId The report ID
   * @returns {Promise<Report>} Report details
   * @throws {ApiError} If request fails or report not found
   */
  public async getReport(workspaceId: string, reportId: string): Promise<Report> {
    try {
      const client = await this.initializeClient();
      const response = await this.requestWith429Retry(() =>
        client.get<Report>(`/groups/${workspaceId}/reports/${reportId}`)
      );

      Logger.info('Retrieved Power BI report', {
        workspaceId,
        reportId,
      });

      return response.data;
    } catch (error) {
      Logger.error('Failed to fetch Power BI report', {
        workspaceId,
        reportId,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Failed to fetch Power BI report', 500);
    }
  }

  /**
   * Trigger a refresh of a Power BI dataset
   * @param {string} workspaceId The workspace ID
   * @param {string} datasetId The dataset ID
   * @returns {Promise<void>}
   * @throws {ApiError} If request fails
   */
  public async refreshDataset(workspaceId: string, datasetId: string): Promise<void> {
    try {
      const client = await this.initializeClient();
      await this.requestWith429Retry(() =>
        client.post(`/groups/${workspaceId}/datasets/${datasetId}/refreshes`, {})
      );

      Logger.info('Triggered Power BI dataset refresh', {
        workspaceId,
        datasetId,
      });
    } catch (error) {
      Logger.error('Failed to trigger dataset refresh', {
        workspaceId,
        datasetId,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Failed to trigger dataset refresh', 500);
    }
  }

  /**
   * Get refresh history for a dataset
   * @param {string} workspaceId The workspace ID
   * @param {string} datasetId The dataset ID
   * @returns {Promise<RefreshHistory[]>} List of refresh history entries
   * @throws {ApiError} If request fails
   */
  public async getRefreshHistory(
    workspaceId: string,
    datasetId: string
  ): Promise<RefreshHistory[]> {
    try {
      const client = await this.initializeClient();
      const response = await this.requestWith429Retry(() =>
        client.get<{ value: RefreshHistory[] }>(`/groups/${workspaceId}/datasets/${datasetId}/refreshes`, {
          params: {
            $top: 100,
          },
        })
      );

      Logger.info('Retrieved Power BI refresh history', {
        workspaceId,
        datasetId,
        count: response.data.value.length,
      });

      return response.data.value;
    } catch (error) {
      Logger.error('Failed to fetch refresh history', {
        workspaceId,
        datasetId,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Failed to fetch refresh history', 500);
    }
  }

  /**
   * Get report pages for a report.
   * @param {string} workspaceId The workspace ID
   * @param {string} reportId The report ID
   * @returns {Promise<Array<Record<string, unknown>>>} List of report pages
   */
  public async getReportPages(
    workspaceId: string,
    reportId: string
  ): Promise<Array<Record<string, unknown>>> {
    try {
      const client = await this.initializeClient();
      const response = await this.requestWith429Retry(() =>
        client.get<{ value: Array<Record<string, unknown>> }>(`/groups/${workspaceId}/reports/${reportId}/pages`)
      );

      Logger.info('Retrieved Power BI report pages', {
        workspaceId,
        reportId,
        count: response.data.value.length,
      });

      return response.data.value;
    } catch (error) {
      Logger.error('Failed to fetch report pages', {
        workspaceId,
        reportId,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Failed to fetch report pages', 500);
    }
  }

  /**
   * Generate an embed token for a report
   * @param {string} workspaceId The workspace ID
   * @param {string} reportId The report ID
   * @returns {Promise<EmbedToken>} Embed token and metadata
   * @throws {ApiError} If request fails
   */
  public async getEmbedToken(workspaceId: string, reportId: string): Promise<EmbedToken> {
    try {
      const client = await this.initializeClient();
      const response = await this.requestWith429Retry(() =>
        client.post<EmbedToken>(`/groups/${workspaceId}/reports/${reportId}/GenerateToken`, {
          accessLevel: 'View',
          allowSaveAs: false,
        })
      );

      Logger.info('Generated Power BI embed token', {
        workspaceId,
        reportId,
        expirationTime: response.data.expiration,
      });

      return response.data;
    } catch (error) {
      Logger.error('Failed to generate embed token', {
        workspaceId,
        reportId,
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError('Failed to generate embed token', 500);
    }
  }
}

// Export singleton instance
export const powerBIClient = new PowerBIClient();
