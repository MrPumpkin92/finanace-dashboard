/**
 * Global Type Definitions
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DB_PATH: string;
      AZURE_TENANT_ID: string;
      AZURE_CLIENT_ID: string;
      AZURE_CLIENT_SECRET: string;
      POWER_BI_WORKSPACE_ID: string;
      POWER_BI_REPORT_ID: string;
      CORS_ORIGIN?: string;
      UPLOAD_DIR?: string;
    }
  }
}

export {};
