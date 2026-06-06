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

const POWER_BI_ENV_VARS = [
  'AZURE_TENANT_ID',
  'AZURE_CLIENT_ID',
  'AZURE_CLIENT_SECRET',
  'POWER_BI_WORKSPACE_ID',
  'POWER_BI_REPORT_ID',
];

/**
 * Returns the list of Power BI / Azure environment variables that are not set.
 */
export function getMissingPowerBIConfig(): string[] {
  return POWER_BI_ENV_VARS.filter((envVar) => !process.env[envVar]);
}

/**
 * Whether the optional Power BI integration is fully configured.
 *
 * The core dashboard (transactions, categories, native charts) works without
 * this. Power BI embedding and dataset sync are only enabled when every Azure
 * credential is present.
 */
export function isPowerBIConfigured(): boolean {
  return getMissingPowerBIConfig().length === 0;
}

/**
 * Validate that required environment variables are set.
 * Throws when Power BI is not configured — use only where Power BI is required.
 */
export function validateAuthConfig(): void {
  const missingVars = getMissingPowerBIConfig();

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
