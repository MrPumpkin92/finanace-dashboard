/**
 * Power BI Models
 * Interfaces for Power BI API integration
 */

export interface Workspace {
  id: string;
  name: string;
  type: 'Workspace' | 'PersonalGroupWorkspace' | 'Group';
  state: 'Active' | 'Deleted' | 'Archived';
  isReadOnly: boolean;
  isOnDedicatedCapacity: boolean;
  capacityId?: string;
  description?: string;
  logoUrl?: string;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  webUrl: string;
  embedUrl: string;
  datasetId: string;
  createdDateTime?: string;
  modifiedDateTime?: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  configuredBy?: string;
  isRefreshable: boolean;
  isEffectiveIdentityRequired: boolean;
  isEffectiveIdentityRolesRequired: boolean;
  tables?: DatasetTable[];
  createdDate?: string;
  contentProviderType?: string;
  qnaSettings?: {
    isQnaEnabled: boolean;
  };
}

export interface DatasetTable {
  name: string;
  columns: DatasetColumn[];
}

export interface DatasetColumn {
  name: string;
  dataType: string;
}

export interface RefreshHistory {
  id: string;
  refreshType: 'OnDemand' | 'Scheduled' | 'Manual';
  startTime: string;
  endTime: string;
  status: 'Unknown' | 'InProgress' | 'Completed' | 'Failed' | 'Disabled';
  requestId?: string;
  serviceExceptionJson?: string;
}

export interface EmbedToken {
  token: string;
  tokenId: string;
  expiration: string;
}

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
