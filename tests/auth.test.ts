import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

let getAuthClient: typeof import('../src/auth/authClient.js').getAuthClient;
let initializeAuthClient: typeof import('../src/auth/authClient.js').initializeAuthClient;
let acquireToken: typeof import('../src/auth/authClient.js').acquireToken;
let setAuthClientFactoryForTesting: typeof import('../src/auth/authClient.js').__setAuthClientFactoryForTesting;
let AuthError: typeof import('../src/utils/errors.js').AuthError;

type MockAuthClient = {
  acquireTokenByClientCredential: any;
};

let mockAuthClient: MockAuthClient;

function unsetEnv(name: string): void {
  Reflect.deleteProperty(process.env, name);
}

function setValidAuthEnv(): void {
  process.env.AZURE_TENANT_ID = 'tenant-id';
  process.env.AZURE_CLIENT_ID = 'client-id';
  process.env.AZURE_CLIENT_SECRET = 'client-secret';
}

async function loadAuthModule(): Promise<void> {
  jest.resetModules();
  process.env.LOG_LEVEL = 'silent';

  const authModule = await import('../src/auth/authClient.js');
  const errorsModule = await import('../src/utils/errors.js');

  getAuthClient = authModule.getAuthClient;
  initializeAuthClient = authModule.initializeAuthClient;
  acquireToken = authModule.acquireToken;
  setAuthClientFactoryForTesting = authModule.__setAuthClientFactoryForTesting;
  AuthError = errorsModule.AuthError;
}

beforeEach(async () => {
  unsetEnv('AZURE_TENANT_ID');
  unsetEnv('AZURE_CLIENT_ID');
  unsetEnv('AZURE_CLIENT_SECRET');
  unsetEnv('POWER_BI_WORKSPACE_ID');
  unsetEnv('POWER_BI_REPORT_ID');
  await loadAuthModule();
  mockAuthClient = {
    acquireTokenByClientCredential: jest.fn(),
  };
  setAuthClientFactoryForTesting(() => mockAuthClient as any);
});

afterEach(() => {
  jest.useRealTimers();
  setAuthClientFactoryForTesting(null);
  jest.clearAllMocks();
});

describe('AuthClient', () => {
  it('acquires a token successfully', async () => {
    setValidAuthEnv();
    initializeAuthClient();

    mockAuthClient.acquireTokenByClientCredential.mockResolvedValue({
      accessToken: 'access-token-123',
      expiresOn: new Date(Date.now() + 60 * 60 * 1000),
    });

    await expect(acquireToken()).resolves.toBe('access-token-123');
    expect(mockAuthClient.acquireTokenByClientCredential).toHaveBeenCalledWith({
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    });
  });

  it('caches a token until it is within the refresh buffer', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-02T12:00:00.000Z'));

    setValidAuthEnv();
    initializeAuthClient();

    mockAuthClient.acquireTokenByClientCredential.mockResolvedValue({
      accessToken: 'cached-token',
      expiresOn: new Date('2026-05-02T13:00:00.000Z'),
    });

    await expect(acquireToken()).resolves.toBe('cached-token');
    await expect(acquireToken()).resolves.toBe('cached-token');

    expect(mockAuthClient.acquireTokenByClientCredential).toHaveBeenCalledTimes(1);
    expect(getAuthClient().getCacheState().hasToken).toBe(true);
  });

  it('refreshes a token automatically when it is within 60 seconds of expiry', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-02T12:00:00.000Z'));

    setValidAuthEnv();
    initializeAuthClient();

    mockAuthClient.acquireTokenByClientCredential
      .mockResolvedValueOnce({
        accessToken: 'initial-token',
        expiresOn: new Date('2026-05-02T12:01:01.000Z'),
      })
      .mockResolvedValueOnce({
        accessToken: 'refreshed-token',
        expiresOn: new Date('2026-05-02T13:00:00.000Z'),
      });

    await expect(acquireToken()).resolves.toBe('initial-token');

    jest.advanceTimersByTime(2000);

    await expect(acquireToken()).resolves.toBe('refreshed-token');
    expect(mockAuthClient.acquireTokenByClientCredential).toHaveBeenCalledTimes(2);
  });

  it('throws AuthError with a helpful message when required env variables are missing', () => {
    unsetEnv('AZURE_TENANT_ID');
    unsetEnv('AZURE_CLIENT_ID');
    unsetEnv('AZURE_CLIENT_SECRET');

    expect(() => initializeAuthClient()).toThrow(AuthError);

    try {
      initializeAuthClient();
      throw new Error('Expected initializeAuthClient to throw');
    } catch (error) {
      const authError = error as Error;
      expect(authError.message).toContain('AZURE_TENANT_ID');
      expect(authError.message).toContain('AZURE_CLIENT_ID');
      expect(authError.message).toContain('AZURE_CLIENT_SECRET');
    }
  });

  it('throws AuthError when token acquisition fails', async () => {
    setValidAuthEnv();
    initializeAuthClient();

    mockAuthClient.acquireTokenByClientCredential.mockRejectedValue(new Error('Azure AD unavailable'));

    await expect(acquireToken()).rejects.toMatchObject({
      name: 'AuthError',
      statusCode: 401,
      code: 'AUTH_ERROR',
      message: expect.stringContaining('Failed to acquire access token: Azure AD unavailable'),
    });
  });
});
