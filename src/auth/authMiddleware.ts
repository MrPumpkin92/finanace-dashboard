/**
 * Azure AD Authentication Middleware
 * Attaches bearer tokens to Power BI API requests and handles 401 retries
 */

import { Request, Response, NextFunction } from 'express';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Logger } from '../utils/logger.js';
import { AuthError } from '../utils/errors.js';
import { getAuthClient } from './authClient.js';

/**
 * Extended Request with auth context
 */
interface AuthenticatedRequest extends Request {
  authContext?: {
    token?: string;
    retryCount: number;
  };
}

/**
 * Create an authenticated Axios instance with token attachment and retry logic
 * @returns {AxiosInstance} Configured Axios instance for Power BI API calls
 */
export function createAuthenticatedClient(): AxiosInstance {
  const client = axios.create({
    baseURL: 'https://api.powerbi.com/v1.0/myorg',
    timeout: 30000,
  });

  // Request interceptor: Attach bearer token
  client.interceptors.request.use(
    async (config) => {
      try {
        const authClient = getAuthClient();
        const token = await authClient.acquireToken();

        config.headers.Authorization = `Bearer ${token}`;
        Logger.debug('Bearer token attached to Power BI API request', {
          url: config.url,
        });

        return config;
      } catch (error) {
        Logger.error('Failed to attach authentication token', {
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: Handle 401 with single retry
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config;

      // Only retry on 401 and only once
      if (error.response?.status === 401 && config) {
        const retryCount = (config as any).__retryCount || 0;

        if (retryCount < 1) {
          Logger.warn('Received 401 from Power BI API, refreshing token and retrying', {
            url: config.url,
            retryAttempt: retryCount + 1,
          });

          try {
            // Mark this retry attempt
            (config as any).__retryCount = retryCount + 1;

            // Refresh token
            const authClient = getAuthClient();
            const freshToken = await authClient.refreshToken();

            // Update authorization header
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${freshToken}`;

            Logger.info('Token refreshed after 401, retrying request', {
              url: config.url,
            });

            // Retry the request
            return client.request(config);
          } catch (refreshError) {
            Logger.error('Token refresh failed after 401', {
              errorMessage:
                refreshError instanceof Error ? refreshError.message : String(refreshError),
            });

            // Return error response with 503 Service Unavailable
            return Promise.reject(
              new AxiosError(
                'Power BI authentication failed after retry',
                '503',
                config,
                error.request,
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  data: { message: 'Power BI authentication failed' },
                  headers: {},
                  config,
                }
              )
            );
          }
        }

        // Already retried once, fail with 503
        Logger.error('Power BI API returned 401 after retry, aborting request', {
          url: config.url,
        });

        return Promise.reject(
          new AxiosError(
            'Power BI authentication failed',
            '503',
            config,
            error.request,
            {
              status: 503,
              statusText: 'Service Unavailable',
              data: { message: 'Power BI authentication failed' },
              headers: {},
              config,
            }
          )
        );
      }

      // For non-401 errors, reject as-is
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Express middleware for Power BI API authentication
 * Ensures valid bearer token is available for downstream handlers
 *
 * @example
 * ```typescript
 * app.use(authenticateMiddleware);
 * ```
 */
export async function authenticateMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authClient = getAuthClient();
    const token = await authClient.acquireToken();

    // Attach token to request context
    req.authContext = {
      token,
      retryCount: 0,
    };

    Logger.debug('Authentication middleware: token acquired', {
      path: req.path,
    });

    next();
  } catch (error) {
    Logger.error('Authentication middleware: token acquisition failed', {
      path: req.path,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof AuthError) {
      res.status(401).json({
        status: 'error',
        code: 'AUTH_ERROR',
        message: error.message,
      });
      return;
    }

    res.status(503).json({
      status: 'error',
      code: 'SERVICE_UNAVAILABLE',
      message: 'Authentication service unavailable',
    });
  }
}

/**
 * Error handler middleware for authentication errors
 * Should be registered after route handlers
 *
 * @example
 * ```typescript
 * app.use(authErrorHandler);
 * ```
 */
export function authErrorHandler(
  error: Error | AxiosError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AuthError) {
    Logger.error('Authentication error in route', {
      path: req.path,
      message: error.message,
    });

    res.status(401).json({
      status: 'error',
      code: 'AUTH_ERROR',
      message: error.message,
    });
    return;
  }

  if (axios.isAxiosError(error) && error.response?.status === 503) {
    Logger.error('Power BI service unavailable', {
      path: req.path,
      originalStatus: error.response.status,
    });

    res.status(503).json({
      status: 'error',
      code: 'POWERBI_UNAVAILABLE',
      message: 'Power BI authentication failed',
    });
    return;
  }

  // Pass through unhandled errors
  next(error);
}

export default createAuthenticatedClient;
