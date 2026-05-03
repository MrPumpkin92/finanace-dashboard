/**
 * Azure AD Authentication Client
 * Handles token acquisition, caching, and auto-refresh for Power BI API access
 */

import { ConfidentialClientApplication } from '@azure/msal-node';
import { Logger } from '../utils/logger.js';
import { AuthError } from '../utils/errors.js';

/**
 * Cached token metadata
 */
interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

type ConfidentialClientLike = Pick<
  ConfidentialClientApplication,
  'acquireTokenByClientCredential'
>;

/**
 * Token acquisition response from MSAL
 */
/**
 * Azure AD Authentication Client
 * Manages token acquisition and caching with automatic refresh
 */
class AuthClient {
  private confidentialClient: ConfidentialClientLike | null = null;
  private cachedToken: CachedToken | null = null;
  private readonly tokenRefreshBufferMs = 60 * 1000; // 60 seconds before expiry
  private readonly powerBIScope = 'https://analysis.windows.net/powerbi/api/.default';

  /**
   * Initialize the authentication client with MSAL configuration
   * @throws {AuthError} If required environment variables are missing
   */
  public initialize(): void {
    this.validateEnvironmentVariables();

    const tenantId = process.env.AZURE_TENANT_ID!;
    const clientId = process.env.AZURE_CLIENT_ID!;
    const clientSecret = process.env.AZURE_CLIENT_SECRET!;

    const config = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
      system: {
        loggerOptions: {
          loggerCallback: (level: number, message: string, containsPii: boolean): void => {
            if (!containsPii) {
              Logger.debug(`[MSAL:${level}] ${message}`);
            }
          },
        },
      },
    };

    this.confidentialClient = authClientFactory
      ? authClientFactory()
      : new ConfidentialClientApplication(config);
    Logger.info('Azure AD authentication client initialized');
  }

  /**
   * Acquire a valid bearer token for Power BI API
   * Caches tokens and auto-refreshes 60 seconds before expiry
   * @returns {Promise<string>} Valid bearer token
   * @throws {AuthError} If token acquisition fails
   */
  public async acquireToken(): Promise<string> {
    if (!this.confidentialClient) {
      throw new AuthError('Authentication client not initialized. Call initialize() first.');
    }

    // Return cached token if still valid (with 60-second buffer)
    if (this.isCachedTokenValid()) {
      Logger.debug('Returning cached Power BI token');
      return this.cachedToken!.accessToken;
    }

    return this.refreshToken();
  }

  /**
   * Explicitly refresh the token (used after 401 responses)
   * @returns {Promise<string>} Fresh bearer token
   * @throws {AuthError} If token refresh fails
   * @internal
   */
  public async refreshToken(): Promise<string> {
    if (!this.confidentialClient) {
      throw new AuthError('Authentication client not initialized.');
    }

    try {
      Logger.info('Refreshing Power BI access token');

      const response = await this.confidentialClient.acquireTokenByClientCredential({
        scopes: [this.powerBIScope],
      });

      if (!response?.accessToken) {
        throw new AuthError('Empty token response from Azure AD', {
          hasResponse: !!response,
        });
      }

      // Cache the token
      const expiresAtMs = response.expiresOn
        ? new Date(response.expiresOn).getTime()
        : Date.now() + 3600 * 1000; // Default 1 hour

      this.cachedToken = {
        accessToken: response.accessToken,
        expiresAt: expiresAtMs,
      };

      // Do NOT log the token value itself
      Logger.info('Power BI access token acquired successfully', {
        expiresAt: new Date(expiresAtMs).toISOString(),
      });

      return response.accessToken;
    } catch (error) {
      Logger.error('Failed to acquire Power BI access token', {
        errorType: error instanceof Error ? error.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof AuthError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new AuthError(`Failed to acquire access token: ${error.message}`, {
          originalError: error.name,
        });
      }

      throw new AuthError('Failed to acquire access token: Unknown error');
    }
  }

  /**
   * Check if cached token is still valid (with 60-second buffer)
   * @returns {boolean} True if cached token is valid
   * @private
   */
  private isCachedTokenValid(): boolean {
    if (!this.cachedToken) {
      return false;
    }

    const now = Date.now();
    const bufferExpiryTime = this.cachedToken.expiresAt - this.tokenRefreshBufferMs;

    return now < bufferExpiryTime;
  }

  /**
   * Validate that required environment variables are set
   * @throws {AuthError} If any required variables are missing
   * @private
   */
  private validateEnvironmentVariables(): void {
    const required = {
      AZURE_TENANT_ID: 'Tenant ID for Azure AD',
      AZURE_CLIENT_ID: 'Client ID for Azure AD application',
      AZURE_CLIENT_SECRET: 'Client secret for Azure AD application',
    };

    const missing: string[] = [];

    Object.entries(required).forEach(([envVar, description]) => {
      if (!process.env[envVar]) {
        missing.push(`${envVar} (${description})`);
      }
    });

    if (missing.length > 0) {
      const message = `Missing required environment variables: ${missing.join(', ')}`;
      throw new AuthError(message, { missingVariables: missing });
    }
  }

  /**
   * Clear cached token (for testing or explicit reset)
   * @internal
   */
  public clearCache(): void {
    this.cachedToken = null;
  }

  /**
   * Get cache state (for testing)
   * @internal
   */
  public getCacheState(): { hasToken: boolean; expiresAt?: number } {
    return {
      hasToken: !!this.cachedToken,
      expiresAt: this.cachedToken?.expiresAt,
    };
  }
}

// Singleton instance
let instance: AuthClient | null = null;
let authClientFactory: (() => ConfidentialClientLike) | null = null;

/**
 * Get or create the singleton AuthClient instance
 * @returns {AuthClient} Authentication client instance
 */
export function getAuthClient(): AuthClient {
  if (!instance) {
    instance = new AuthClient();
  }
  return instance;
}

/**
 * Test-only hook to inject a fake MSAL client.
 * @internal
 */
export function __setAuthClientFactoryForTesting(
  factory: (() => ConfidentialClientLike) | null
): void {
  authClientFactory = factory;
  instance = null;
}

/**
 * Initialize the authentication client
 * Should be called once at application startup
 * @throws {AuthError} If required environment variables are missing
 */
export function initializeAuthClient(): void {
  const client = getAuthClient();
  client.initialize();
}

/**
 * Acquire a bearer token for Power BI API
 * @returns {Promise<string>} Valid access token
 * @throws {AuthError} If token acquisition fails
 */
export async function acquireToken(): Promise<string> {
  const client = getAuthClient();
  return client.acquireToken();
}

export default getAuthClient;
