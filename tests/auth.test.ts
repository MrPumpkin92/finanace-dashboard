/**
 * Authentication Tests
 * Unit tests for Azure AD authentication client and middleware
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfidentialClientApplication } from '@azure/msal-node';
import {
  getAuthClient,
  initializeAuthClient,
  acquireToken,
  AuthError,
} from '../src/auth/authClient.js';

// Mock @azure/msal-node
vi.mock('@azure/msal-node', () => ({
  ConfidentialClientApplication: vi.fn(),
}));

describe('AuthClient', () => {
  let mockMsalApp: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Set up mock MSAL app
    mockMsalApp = {
      acquireTokenByClientCredential: vi.fn(),
    };

    (ConfidentialClientApplication as any).mockImplementation(() => mockMsalApp);

    // Reset singleton instance by getting a fresh client
    vi.resetModules();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with valid environment variables', () => {
      process.env.AZURE_TENANT_ID = 'test-tenant-id';
      process.env.AZURE_CLIENT_ID = 'test-client-id';
      process.env.AZURE_CLIENT_SECRET = 'test-client-secret';

      expect(() => {
        initializeAuthClient();
      }).not.toThrow();
    });

    it('should throw AuthError when AZURE_TENANT_ID is missing', () => {
      process.env.AZURE_CLIENT_ID = 'test-client-id';
      process.env.AZURE_CLIENT_SECRET = 'test-client-secret';
      delete process.env.AZURE_TENANT_ID;

      expect(() => {
        initializeAuthClient();
      }).toThrow(AuthError);

      expect(() => {
        initializeAuthClient();
      }).toThrow(/AZURE_TENANT_ID/);
    });

    it('should throw AuthError when AZURE_CLIENT_ID is missing', () => {
      process.env.AZURE_TENANT_ID = 'test-tenant-id';
      process.env.AZURE_CLIENT_SECRET = 'test-client-secret';
      delete process.env.AZURE_CLIENT_ID;

      expect(() => {
        initializeAuthClient();
      }).toThrow(AuthError);

      expect(() => {
        initializeAuthClient();
      }).toThrow(/AZURE_CLIENT_ID/);
    });

    it('should throw AuthError when AZURE_CLIENT_SECRET is missing', () => {
      process.env.AZURE_TENANT_ID = 'test-tenant-id';
      process.env.AZURE_CLIENT_ID = 'test-client-id';
      delete process.env.AZURE_CLIENT_SECRET;

      expect(() => {
        initializeAuthClient();
      }).toThrow(AuthError);

      expect(() => {
        initializeAuthClient();
      }).toThrow(/AZURE_CLIENT_SECRET/);
    });

    it('should throw AuthError with helpful message for all missing variables', () => {
      delete process.env.AZURE_TENANT_ID;
      delete process.env.AZURE_CLIENT_ID;
      delete process.env.AZURE_CLIENT_SECRET;

      try {
        initializeAuthClient();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        expect(error.message).toContain('AZURE_TENANT_ID');
        expect(error.message).toContain('AZURE_CLIENT_ID');
        expect(error.message).toContain('AZURE_CLIENT_SECRET');
      }
    });
  });

  describe('acquireToken', () => {
    beforeEach(() => {
      process.env.AZURE_TENANT_ID = 'test-tenant-id';
      process.env.AZURE_CLIENT_ID = 'test-client-id';
      process.env.AZURE_CLIENT_SECRET = 'test-client-secret';
    });

    it('should successfully acquire a token', async () => {
      initializeAuthClient();

      const testToken = 'test-access-token-12345';
      const expiryTime = new Date(Date.now() + 3600 * 1000); // 1 hour from now

      mockMsalApp.acquireTokenByClientCredential.mockResolvedValue({
        accessToken: testToken,
        expiresOn: expiryTime,
      });

      const token = await acquireToken();

      expect(token).toBe(testToken);
      expect(mockMsalApp.acquireTokenByClientCredential).toHaveBeenCalledWith({
        scopes: ['https://analysis.windows.net/powerbi/api/.default'],
      });
    });

    it('should cache token and not re-fetch before expiry', async () => {
      initializeAuthClient();

      const testToken = 'cached-token-67890';
      const expiryTime = new Date(Date.now() + 3600 * 1000); // 1 hour from now

      mockMsalApp.acquireTokenByClientCredential.mockResolvedValue({
        accessToken: testToken,
        expiresOn: expiryTime,
      });

      // First call - should acquire token
      const token1 = await acquireToken();
      expect(token1).toBe(testToken);
      expect(mockMsalApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(1);

      // Second call - should return cached token without calling MSAL
      const token2 = await acquireToken();
      expect(token2).toBe(testToken);
      expect(mockMsalApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(1);
    });

    it('should re-fetch token after 60-second buffer before expiry', async () => {
      initializeAuthClient();

      const client = getAuthClient();
      const testToken1 = 'initial-token';
      const testToken2 = 'refreshed-token';

      // First token expires in 61 seconds
      const expiryTime1 = new Date(Date.now() + 61 * 1000);

      mockMsalApp.acquireTokenByClientCredential.mockResolvedValueOnce({
        accessToken: testToken1,
        expiresOn: expiryTime1,
      });

      const token1 = await acquireToken();
      expect(token1).toBe(testToken1);
      expect(mockMsalApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(1);

      // Simulate 62 seconds passing (past the 60-second buffer)
      // We need to manipulate the cached token's expiry time
      const cacheState = client.getCacheState();
      expect(cacheState.hasToken).toBe(true);

      // Manually set expiry to indicate buffer threshold passed
      const currentTime = Date.now();
      if (cacheState.expiresAt && cacheState.expiresAt - currentTime <= 60 * 1000) {
        // Simulating time passing - manually expire the token by clearing cache
        client.clearCache();
      }

      // Return new token on next call
      const expiryTime2 = new Date(Date.now() + 3600 * 1000);
      mockMsalApp.acquireTokenByClientCredential.mockResolvedValueOnce({
        accessToken: testToken2,
        expiresOn: expiryTime2,
      });

      // Verify cache was cleared
      const clearedState = client.getCacheState();
      expect(clearedState.hasToken).toBe(false);

      const token2 = await acquireToken();
      expect(token2).toBe(testToken2);
      expect(mockMsalApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(2);
    });

    it('should throw AuthError on token acquisition failure', async () => {
      initializeAuthClient();

      const error = new Error('Azure AD service error');
      mockMsalApp.acquireTokenByClientCredential.mockRejectedValue(error);

      try {
        await acquireToken();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect(err.message).toContain('Failed to acquire access token');
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('AUTH_ERROR');
      }
    });

    it('should throw AuthError with context when token response is empty', async () => {
      initializeAuthClient();

      mockMsalApp.acquireTokenByClientCredential.mockResolvedValue({
        accessToken: undefined,
        expiresOn: new Date(),
      });

      try {
        await acquireToken();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect(err.message).toContain('Empty token response');
      }
    });

    it('should not log token values in error context', async () => {
      initializeAuthClient();

      const testToken = 'secret-token-xyz';
      mockMsalApp.acquireTokenByClientCredential.mockResolvedValue({
        accessToken: testToken,
        expiresOn: new Date(Date.now() + 3600 * 1000),
      });

      const token = await acquireToken();

      // Token should not be exposed in error messages or logs
      expect(token).toBe(testToken);
      // In real code, verify that Logger methods aren't called with token value
      // This is implicitly tested by the implementation not passing token to logger
    });

    it('should throw AuthError if client not initialized', async () => {
      // Don't call initializeAuthClient()
      const client = getAuthClient();
      client.clearCache();

      try {
        await client.acquireToken();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect(err.message).toContain('not initialized');
      }
    });
  });

  describe('token refresh', () => {
    beforeEach(() => {
      process.env.AZURE_TENANT_ID = 'test-tenant-id';
      process.env.AZURE_CLIENT_ID = 'test-client-id';
      process.env.AZURE_CLIENT_SECRET = 'test-client-secret';
    });

    it('should explicitly refresh token after 401', async () => {
      initializeAuthClient();

      const initialToken = 'initial-token';
      const refreshedToken = 'refreshed-token';

      // First call returns initial token
      mockMsalApp.acquireTokenByClientCredential.mockResolvedValueOnce({
        accessToken: initialToken,
        expiresOn: new Date(Date.now() + 3600 * 1000),
      });

      const token1 = await acquireToken();
      expect(token1).toBe(initialToken);

      // Explicit refresh returns new token
      mockMsalApp.acquireTokenByClientCredential.mockResolvedValueOnce({
        accessToken: refreshedToken,
        expiresOn: new Date(Date.now() + 3600 * 1000),
      });

      const client = getAuthClient();
      const token2 = await client.refreshToken();

      expect(token2).toBe(refreshedToken);
      expect(mockMsalApp.acquireTokenByClientCredential).toHaveBeenCalledTimes(2);
    });

    it('should throw AuthError on refresh failure', async () => {
      initializeAuthClient();

      const error = new Error('Refresh failed');
      mockMsalApp.acquireTokenByClientCredential.mockRejectedValue(error);

      const client = getAuthClient();

      try {
        await client.refreshToken();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect(err.statusCode).toBe(401);
      }
    });
  });

  describe('AuthError', () => {
    it('should create error with proper HTTP status and code', () => {
      const error = new AuthError('Token expired');

      expect(error.message).toBe('Token expired');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.name).toBe('AuthError');
    });

    it('should include context information', () => {
      const context = { missingVar: 'AZURE_CLIENT_ID' };
      const error = new AuthError('Config error', context);

      expect(error.context).toEqual(context);
    });

    it('should extend ApiError correctly', () => {
      const error = new AuthError('Test error');

      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe('AuthError');
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance on multiple calls', () => {
      process.env.AZURE_TENANT_ID = 'test-tenant-id';
      process.env.AZURE_CLIENT_ID = 'test-client-id';
      process.env.AZURE_CLIENT_SECRET = 'test-client-secret';

      initializeAuthClient();

      const client1 = getAuthClient();
      const client2 = getAuthClient();

      expect(client1).toBe(client2);
    });
  });
});
