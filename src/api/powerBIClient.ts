/**
 * Power BI API Client
 * Handles communication with Power BI REST API
 */
import axios, { AxiosInstance } from 'axios';
import { getPowerBIAccessToken } from '../auth/auth.js';
import {
  PowerBIAccessToken,
  PowerBIEmbedToken,
  PowerBIEmbedConfig,
} from '../models/PowerBI.js';

const POWER_BI_API_BASE_URL = 'https://api.powerbi.com/v1.0/myorg';

export class PowerBIClient {
  private apiClient: AxiosInstance | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  /**
   * Initialize API client with authentication
   */
  private async ensureAuthenticated(): Promise<void> {
    const now = new Date();

    // Check if token is still valid (with 5 minute buffer)
    if (
      this.accessToken &&
      this.tokenExpiry &&
      this.tokenExpiry.getTime() - now.getTime() > 5 * 60 * 1000
    ) {
      return;
    }

    // Get new token
    this.accessToken = await getPowerBIAccessToken();
    this.tokenExpiry = new Date(now.getTime() + 60 * 60 * 1000); // Token valid for 1 hour

    // Create or update axios instance with new token
    this.apiClient = axios.create({
      baseURL: POWER_BI_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get embed token for Power BI report
   */
  public async getEmbedToken(reportId: string): Promise<PowerBIEmbedConfig> {
    try {
      await this.ensureAuthenticated();

      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const workspaceId = process.env.POWER_BI_WORKSPACE_ID;
      if (!workspaceId) {
        throw new Error('POWER_BI_WORKSPACE_ID not configured');
      }

      // Request embed token
      const response = await this.apiClient.post(
        `/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
        {
          accessLevel: 'View',
          lifetimeInMinutes: 60,
        }
      );

      const tokenData = response.data as PowerBIEmbedToken;

      // Get embed URL
      const reportResponse = await this.apiClient.get(
        `/groups/${workspaceId}/reports/${reportId}`
      );
      const embedUrl = reportResponse.data.embedUrl as string;

      return {
        reportId,
        embedUrl,
        accessToken: tokenData.token,
        tokenExpiry: new Date(tokenData.expiration),
      };
    } catch (error) {
      console.error('Error getting embed token:', error);
      throw new Error('Failed to generate Power BI embed token');
    }
  }

  /**
   * Refresh Power BI dataset
   */
  public async refreshDataset(datasetId: string): Promise<string> {
    try {
      await this.ensureAuthenticated();

      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = await this.apiClient.post(
        `/datasets/${datasetId}/refreshes`,
        {}
      );

      const requestId = response.data.value as string;
      return requestId;
    } catch (error) {
      console.error('Error refreshing dataset:', error);
      throw new Error('Failed to refresh Power BI dataset');
    }
  }

  /**
   * Get dataset refresh history
   */
  public async getRefreshHistory(
    datasetId: string,
    top: number = 10
  ): Promise<Array<{ id: string; status: string; startTime?: string; endTime?: string }>> {
    try {
      await this.ensureAuthenticated();

      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const response = await this.apiClient.get(
        `/datasets/${datasetId}/refreshes?$top=${top}`
      );

      const refreshes = response.data.value as Array<{
        id: string;
        status: string;
        startTime?: string;
        endTime?: string;
      }>;
      return refreshes;
    } catch (error) {
      console.error('Error getting refresh history:', error);
      throw new Error('Failed to retrieve Power BI refresh history');
    }
  }

  /**
   * Get report pages
   */
  public async getReportPages(reportId: string): Promise<Array<{ name: string; displayName: string }>> {
    try {
      await this.ensureAuthenticated();

      if (!this.apiClient) {
        throw new Error('API client not initialized');
      }

      const workspaceId = process.env.POWER_BI_WORKSPACE_ID;
      if (!workspaceId) {
        throw new Error('POWER_BI_WORKSPACE_ID not configured');
      }

      const response = await this.apiClient.get(
        `/groups/${workspaceId}/reports/${reportId}/pages`
      );

      const pages = response.data.value as Array<{ name: string; displayName: string }>;
      return pages;
    } catch (error) {
      console.error('Error getting report pages:', error);
      throw new Error('Failed to retrieve Power BI report pages');
    }
  }
}

export const powerBIClient = new PowerBIClient();
