import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { loadEnvironmentConfig } from '../src/config/environment.js';
import { ApiError, AuthError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../src/utils/errors.js';
import { Validators } from '../src/utils/validators.js';

const originalEnv = { ...process.env };

function unsetEnv(name: string): void {
  Reflect.deleteProperty(process.env, name);
}

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.LOG_LEVEL = 'silent';
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('Validators', () => {
  it('validates amounts, dates, transaction types, and sanitizes strings', () => {
    expect(Validators.isValidAmount(12.5)).toBe(true);
    expect(Validators.isValidAmount(0)).toBe(false);
    expect(Validators.isValidISODate('2024-03-01')).toBe(true);
    expect(Validators.isValidISODate('03/01/2024')).toBe(false);
    expect(Validators.isValidTransactionType('income')).toBe(true);
    expect(Validators.isValidTransactionType('transfer')).toBe(false);
    expect(Validators.sanitize('  <script>alert(1)</script>  ')).toBe('scriptalert(1)/script');
  });
});

describe('Environment config', () => {
  it('loads a valid environment config', () => {
    process.env.AZURE_TENANT_ID = 'tenant-id';
    process.env.AZURE_CLIENT_ID = 'client-id';
    process.env.AZURE_CLIENT_SECRET = 'client-secret';
    process.env.POWER_BI_WORKSPACE_ID = 'workspace-id';
    process.env.POWER_BI_REPORT_ID = 'report-id';
    process.env.DB_PATH = ':memory:';
    process.env.PORT = '4000';
    process.env.NODE_ENV = 'test';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
    process.env.REFRESH_CRON = '0 6 * * *';

    expect(loadEnvironmentConfig()).toMatchObject({
      azure: {
        tenantId: 'tenant-id',
        clientId: 'client-id',
        clientSecret: 'client-secret',
      },
      powerBI: {
        workspaceId: 'workspace-id',
        reportId: 'report-id',
      },
      server: {
        port: 4000,
        nodeEnv: 'test',
        corsOrigin: 'http://localhost:3000',
        refreshCron: '0 6 * * *',
      },
      database: {
        path: ':memory:',
      },
    });
  });

  it('throws when required environment values are missing', () => {
    unsetEnv('AZURE_TENANT_ID');
    unsetEnv('AZURE_CLIENT_ID');
    unsetEnv('AZURE_CLIENT_SECRET');
    unsetEnv('POWER_BI_WORKSPACE_ID');
    unsetEnv('POWER_BI_REPORT_ID');

    expect(() => loadEnvironmentConfig()).toThrow('Missing required environment variables');
  });
});

describe('Api errors', () => {
  it('creates the expected error hierarchy and codes', () => {
    const errors = [
      new ApiError('boom', 500, 'INTERNAL_ERROR'),
      new ValidationError('invalid'),
      new NotFoundError('transaction'),
      new UnauthorizedError(),
      new ForbiddenError(),
      new ConflictError('duplicate'),
      new AuthError('auth failed', { reason: 'token' }),
    ];

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'ApiError', statusCode: 500, code: 'INTERNAL_ERROR' }),
        expect.objectContaining({ name: 'ValidationError', statusCode: 400, code: 'VALIDATION_ERROR' }),
        expect.objectContaining({ name: 'NotFoundError', statusCode: 404, code: 'NOT_FOUND' }),
        expect.objectContaining({ name: 'UnauthorizedError', statusCode: 401, code: 'UNAUTHORIZED' }),
        expect.objectContaining({ name: 'ForbiddenError', statusCode: 403, code: 'FORBIDDEN' }),
        expect.objectContaining({ name: 'ConflictError', statusCode: 409, code: 'CONFLICT' }),
        expect.objectContaining({ name: 'AuthError', statusCode: 401, code: 'AUTH_ERROR' }),
      ])
    );
  });
});
