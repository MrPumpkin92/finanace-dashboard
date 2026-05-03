/**
 * Authentication Module
 * Handles Azure AD / OAuth2 authentication for Power BI and API access
 */
import { PublicClientApplication } from '@azure/msal-node';
import { AccessToken, ClientSecretCredential } from '@azure/identity';

const config = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID || 'common'}`,
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  },
  system: {
    loggerOptions: {
      loggerCallback: (_level: unknown, message: string): void => {
        console.log(`[MSAL] ${message}`);
      },
    },
  },
};

let publicClientApplication: PublicClientApplication | null = null;

/**
 * Initialize the public client application for user authentication
 */
export function initializePublicClient(): PublicClientApplication {
  if (publicClientApplication) {
    return publicClientApplication;
  }

  publicClientApplication = new PublicClientApplication(config);
  return publicClientApplication;
}

/**
 * Get access token for Power BI API
 */
export async function getPowerBIAccessToken(): Promise<string> {
  try {
    const credential = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID || '',
      process.env.AZURE_CLIENT_ID || '',
      process.env.AZURE_CLIENT_SECRET || ''
    );

    const accessToken: AccessToken = await credential.getToken(
      'https://analysis.windows.net/powerbi/api/.default'
    );

    return accessToken.token;
  } catch (error) {
    console.error('Error getting Power BI access token:', error);
    throw new Error('Failed to obtain Power BI access token');
  }
}

/**
 * Validate that required environment variables are set
 */
export function validateAuthConfig(): void {
  const requiredEnvVars = [
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'POWER_BI_WORKSPACE_ID',
    'POWER_BI_REPORT_ID',
  ];

  const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
