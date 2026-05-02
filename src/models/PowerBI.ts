/**
 * Power BI Models
 * Interfaces for Power BI API integration
 */
export interface PowerBIReportConfig {
  workspaceId: string;
  reportId: string;
  datasetId: string;
}

export interface PowerBIEmbedToken {
  token: string;
  expiration: string;
  embedUrl: string;
}

export interface PowerBIDatasetRefreshRequest {
  notifyOption?: 'MailOnCompletion' | 'MailOnFailure' | 'NoNotification';
}

export interface PowerBIDatasetRefreshResponse {
  requestId: string;
  value: string;
}

export interface PowerBIAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PowerBIEmbedConfig {
  reportId: string;
  embedUrl: string;
  accessToken: string;
  tokenExpiry: Date;
}
