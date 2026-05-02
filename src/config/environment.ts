/**
 * Types for environment variables
 */
export interface EnvironmentConfig {
  azure: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
  };
  powerBI: {
    workspaceId: string;
    reportId: string;
  };
  server: {
    port: number;
    nodeEnv: 'development' | 'production' | 'test';
    corsOrigin: string;
  };
  database: {
    path: string;
  };
}

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const missingVars: string[] = [];

  const required = {
    'AZURE_TENANT_ID': 'azure.tenantId',
    'AZURE_CLIENT_ID': 'azure.clientId',
    'AZURE_CLIENT_SECRET': 'azure.clientSecret',
    'POWER_BI_WORKSPACE_ID': 'powerBI.workspaceId',
    'POWER_BI_REPORT_ID': 'powerBI.reportId',
  };

  Object.keys(required).forEach((envVar) => {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  });

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    azure: {
      tenantId: process.env.AZURE_TENANT_ID || '',
      clientId: process.env.AZURE_CLIENT_ID || '',
      clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    },
    powerBI: {
      workspaceId: process.env.POWER_BI_WORKSPACE_ID || '',
      reportId: process.env.POWER_BI_REPORT_ID || '',
    },
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    },
    database: {
      path: process.env.DB_PATH || './data/finance.db',
    },
  };
}
