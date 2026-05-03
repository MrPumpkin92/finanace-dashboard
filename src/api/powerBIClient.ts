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

  /**
   * Get all workspaces the service principal has access to
   * @returns {Promise<Workspace[]>} List of workspaces
   * @throws {ApiError} If request fails
   */
  public async getWorkspaces(): Promise<Workspace[]> {
    try {
      const client = await this.initializeClient();
      const response = await client.get<{ value: Workspace[] }>('/groups');
      
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
      const response = await client.get<{ value: Report[] }>(
        `/groups/${workspaceId}/reports`
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
      const response = await client.get<Report>(
        `/groups/${workspaceId}/reports/${reportId}`
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
      await client.post(
        `/groups/${workspaceId}/datasets/${datasetId}/refreshes`,
        {}
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
      const response = await client.get<{ value: RefreshHistory[] }>(
        `/groups/${workspaceId}/datasets/${datasetId}/refreshes`,
        {
          params: {
            $top: 100,
          },
        }
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
   * Generate an embed token for a report
   * @param {string} workspaceId The workspace ID
   * @param {string} reportId The report ID
   * @returns {Promise<EmbedToken>} Embed token and metadata
   * @throws {ApiError} If request fails
   */
  public async getEmbedToken(workspaceId: string, reportId: string): Promise<EmbedToken> {
    try {
      const client = await this.initializeClient();
      const response = await client.post<EmbedToken>(
        `/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
        {
          accessLevel: 'View',
          allowSaveAs: false,
        }
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
