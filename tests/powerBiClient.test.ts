import axios from 'axios';
import AxiosMockAdapter from 'axios-mock-adapter';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { PowerBIClient } from '../src/api/powerBIClient.js';
import { __setAuthClientFactoryForTesting } from '../src/auth/authClient.js';

let axiosCreateSpy: jest.SpiedFunction<typeof axios.create>;
let mockAdapter: AxiosMockAdapter;
let authClient: {
  acquireToken: jest.Mock;
  refreshToken: jest.Mock;
};

function createClient(): PowerBIClient {
  return new PowerBIClient({
    sleep: jest.fn().mockResolvedValue(undefined),
    baseRetryDelayMs: 100,
    maxRetryAttempts: 3,
  });
}

beforeEach(() => {
  process.env.LOG_LEVEL = 'silent';
  authClient = {
    acquireToken: jest.fn().mockResolvedValue('token-1'),
    refreshToken: jest.fn().mockResolvedValue('token-2'),
  };
  __setAuthClientFactoryForTesting(() => authClient as any);

  const axiosInstance = axios.create();
  mockAdapter = new AxiosMockAdapter(axiosInstance);
  axiosCreateSpy = jest.spyOn(axios, 'create').mockReturnValue(axiosInstance);
});

afterEach(() => {
  mockAdapter.restore();
  axiosCreateSpy.mockRestore();
  __setAuthClientFactoryForTesting(null);
  jest.restoreAllMocks();
});

describe('PowerBIClient', () => {
  it('gets workspaces successfully', async () => {
    mockAdapter.onGet('/groups').reply(200, { value: [{ id: 'workspace-1', name: 'Finance' }] });

    const client = createClient();
    await expect(client.getWorkspaces()).resolves.toEqual([{ id: 'workspace-1', name: 'Finance' }]);
  });

  it('returns an ApiError when getWorkspaces fails', async () => {
    mockAdapter.onGet('/groups').reply(500, { message: 'boom' });

    const client = createClient();
    await expect(client.getWorkspaces()).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 500,
      message: 'Failed to fetch Power BI workspaces',
    });
  });

  it('gets reports successfully', async () => {
    mockAdapter.onGet('/groups/workspace-1/reports').reply(200, {
      value: [{ id: 'report-1', name: 'Monthly dashboard' }],
    });

    const client = createClient();
    await expect(client.getReports('workspace-1')).resolves.toEqual([
      { id: 'report-1', name: 'Monthly dashboard' },
    ]);
  });

  it('returns an ApiError when getReports fails', async () => {
    mockAdapter.onGet('/groups/workspace-1/reports').reply(404, { message: 'not found' });

    const client = createClient();
    await expect(client.getReports('workspace-1')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 500,
      message: 'Failed to fetch Power BI reports',
    });
  });

  it('gets a single report successfully', async () => {
    mockAdapter.onGet('/groups/workspace-1/reports/report-1').reply(200, {
      id: 'report-1',
      name: 'Monthly dashboard',
    });

    const client = createClient();
    await expect(client.getReport('workspace-1', 'report-1')).resolves.toEqual({
      id: 'report-1',
      name: 'Monthly dashboard',
    });
  });

  it('returns an ApiError when getReport fails', async () => {
    mockAdapter.onGet('/groups/workspace-1/reports/report-1').reply(500, { message: 'boom' });

    const client = createClient();
    await expect(client.getReport('workspace-1', 'report-1')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 500,
      message: 'Failed to fetch Power BI report',
    });
  });

  it('refreshes a dataset successfully', async () => {
    mockAdapter.onPost('/groups/workspace-1/datasets/dataset-1/refreshes').reply(202);

    const client = createClient();
    await expect(client.refreshDataset('workspace-1', 'dataset-1')).resolves.toBeUndefined();
  });

  it('returns an ApiError when refreshDataset fails', async () => {
    mockAdapter.onPost('/groups/workspace-1/datasets/dataset-1/refreshes').reply(500, { message: 'boom' });

    const client = createClient();
    await expect(client.refreshDataset('workspace-1', 'dataset-1')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 500,
      message: 'Failed to trigger dataset refresh',
    });
  });

  it('gets refresh history successfully', async () => {
    mockAdapter.onGet('/groups/workspace-1/datasets/dataset-1/refreshes').reply(200, {
      value: [{ id: 'refresh-1', status: 'Completed' }],
    });

    const client = createClient();
    await expect(client.getRefreshHistory('workspace-1', 'dataset-1')).resolves.toEqual([
      { id: 'refresh-1', status: 'Completed' },
    ]);
  });

  it('returns an ApiError when getRefreshHistory fails', async () => {
    mockAdapter.onGet('/groups/workspace-1/datasets/dataset-1/refreshes').reply(500, { message: 'boom' });

    const client = createClient();
    await expect(client.getRefreshHistory('workspace-1', 'dataset-1')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 500,
      message: 'Failed to fetch refresh history',
    });
  });

  it('gets report pages successfully', async () => {
    mockAdapter.onGet('/groups/workspace-1/reports/report-1/pages').reply(200, {
      value: [{ name: 'Page 1' }],
    });

    const client = createClient();
    await expect(client.getReportPages('workspace-1', 'report-1')).resolves.toEqual([{ name: 'Page 1' }]);
  });

  it('returns an ApiError when getReportPages fails', async () => {
    mockAdapter.onGet('/groups/workspace-1/reports/report-1/pages').reply(500, { message: 'boom' });

    const client = createClient();
    await expect(client.getReportPages('workspace-1', 'report-1')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 500,
      message: 'Failed to fetch report pages',
    });
  });

  it('generates an embed token successfully', async () => {
    mockAdapter.onPost('/groups/workspace-1/reports/report-1/GenerateToken').reply(200, {
      token: 'embed-token',
      expiration: '2026-05-02T13:00:00Z',
    });

    const client = createClient();
    await expect(client.getEmbedToken('workspace-1', 'report-1')).resolves.toEqual({
      token: 'embed-token',
      expiration: '2026-05-02T13:00:00Z',
    });
  });

  it('returns an ApiError when getEmbedToken fails', async () => {
    mockAdapter.onPost('/groups/workspace-1/reports/report-1/GenerateToken').reply(500, { message: 'boom' });

    const client = createClient();
    await expect(client.getEmbedToken('workspace-1', 'report-1')).rejects.toMatchObject({
      name: 'ApiError',
      statusCode: 500,
      message: 'Failed to generate embed token',
    });
  });

  it('refreshes the auth token on 401 and retries the request', async () => {
    mockAdapter.onGet('/groups').replyOnce(401).onGet('/groups').reply(200, { value: [{ id: 'workspace-1' }] });

    const client = createClient();
    await expect(client.getWorkspaces()).resolves.toEqual([{ id: 'workspace-1' }]);
    expect(authClient.refreshToken).toHaveBeenCalledTimes(1);
    expect(authClient.acquireToken).toHaveBeenCalledTimes(1);
  });

  it('retries 429 responses with exponential backoff', async () => {
    const sleep = jest.fn().mockResolvedValue(undefined);
    mockAdapter.onGet('/groups').replyOnce(429).onGet('/groups').replyOnce(429).onGet('/groups').reply(200, {
      value: [{ id: 'workspace-1' }],
    });

    const client = new PowerBIClient({
      sleep,
      baseRetryDelayMs: 100,
      maxRetryAttempts: 3,
    });

    await expect(client.getWorkspaces()).resolves.toEqual([{ id: 'workspace-1' }]);
    expect(sleep).toHaveBeenNthCalledWith(1, 100);
    expect(sleep).toHaveBeenNthCalledWith(2, 200);
  });
});