/**
 * Example: Complete Azure AD Authentication Integration
 * This file shows how to integrate the authentication system into your Express app
 *
 * Usage:
 * 1. Review this file for integration patterns
 * 2. Apply these patterns to your src/server/app.ts
 * 3. Update src/index.ts to call initializeAuthClient() at startup
 */

// ============================================================================
// STARTUP INITIALIZATION (in src/index.ts)
// ============================================================================

// Add to the top of your index.ts:
/*
import 'dotenv/config';
import { initializeAuthClient } from './auth/authClient.js';
import { createApp } from './server/app.js';
import { Logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // Initialize authentication BEFORE creating app
    initializeAuthClient();
    Logger.info('Azure AD authentication initialized');

    // Create and start Express app
    const app = createApp();
    const port = process.env.PORT || 3001;

    app.listen(port, () => {
      Logger.info(`Finance dashboard running on port ${port}`);
    });
  } catch (error) {
    Logger.error('Failed to start application', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

bootstrap();
*/

// ============================================================================
// EXPRESS APP SETUP (in src/server/app.ts)
// ============================================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authenticateMiddleware, authErrorHandler } from '../auth/authMiddleware.js';
import { Logger } from '../utils/logger.js';

/**
 * Example: Create Express app with authentication middleware
 */
export function createAppWithAuth(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      Logger.info(`${req.method} ${req.path} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });

  // ✅ AUTHENTICATION MIDDLEWARE - Attach bearer token to all requests
  app.use(authenticateMiddleware);

  // Health check (no auth required)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Protected routes - token available in req.authContext.token
  app.get('/api/power-bi/datasets', async (req, res, next) => {
    try {
      const token = req.authContext?.token;
      if (!token) {
        return res.status(401).json({ message: 'Authentication failed' });
      }

      // Make Power BI API call with token
      Logger.debug('Fetching Power BI datasets', { token_length: token.length });

      // Example: use axios with the token
      // const response = await axios.get('https://api.powerbi.com/v1.0/myorg/datasets', {
      //   headers: { Authorization: `Bearer ${token}` },
      // });
      // res.json(response.data);

      res.json({ message: 'Datasets endpoint (implementation needed)' });
    } catch (error) {
      next(error);
    }
  });

  // ✅ ERROR HANDLER - Should be last middleware
  app.use(authErrorHandler);

  return app;
}

// ============================================================================
// ROUTE HANDLER EXAMPLES
// ============================================================================

/**
 * Example: Using authentication with Axios client (recommended for server-to-server calls)
 */
export async function exampleWithPowerBIClient() {
  const { createAuthenticatedClient } = await import('../auth/authMiddleware.js');

  const powerBIClient = createAuthenticatedClient();

  /**
   * The client automatically:
   * - Attaches bearer token to requests
   * - Retries on 401 with token refresh
   * - Returns 503 on repeated failures
   */

  // Example route
  const exampleRoute = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const datasetsResponse = await powerBIClient.get('/datasets');
      res.json(datasetsResponse.data);
    } catch (error) {
      next(error);
    }
  };

  return exampleRoute;
}

/**
 * Example: Manual token usage
 */
export async function exampleManualToken() {
  const { acquireToken, AuthError } = await import('../auth/authClient.js');

  try {
    // Manually get token
    const token = await acquireToken();

    // Use token with axios or fetch
    const response = await fetch('https://api.powerbi.com/v1.0/myorg/reports', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.json();
  } catch (error) {
    if (error instanceof AuthError) {
      Logger.error('Auth failed', { message: error.message, context: error.context });
    }
    throw error;
  }
}

/**
 * Example: Handling 401 manually in route
 */
export async function exampleManualRetry() {
  const { getAuthClient } = await import('../auth/authClient.js');
  const axios = await import('axios');

  return async (req: Request, res: Response, next: NextFunction) => {
    const client = getAuthClient();
    let token = await client.acquireToken();

    try {
      // First attempt
      const response = await axios.get('https://api.powerbi.com/v1.0/myorg/reports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      res.json(response.data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token might be invalid, refresh and retry
        Logger.warn('Got 401, refreshing token and retrying');
        token = await client.refreshToken();

        try {
          const retryResponse = await axios.get('https://api.powerbi.com/v1.0/myorg/reports', {
            headers: { Authorization: `Bearer ${token}` },
          });
          res.json(retryResponse.data);
        } catch (retryError) {
          // Still failed, return error
          next(retryError);
        }
      } else {
        next(error);
      }
    }
  };
}

// ============================================================================
// ENVIRONMENT VARIABLES (.env)
// ============================================================================

/**
 * Required environment variables in .env:
 *
 * # Azure Active Directory
 * AZURE_TENANT_ID=12345678-1234-5678-1234-567812345678
 * AZURE_CLIENT_ID=87654321-4321-8765-4321-876543218765
 * AZURE_CLIENT_SECRET=your-secret-here
 *
 * # Application
 * NODE_ENV=development
 * PORT=3001
 * CORS_ORIGIN=http://localhost:3000
 *
 * # Power BI (if using embed APIs)
 * POWER_BI_WORKSPACE_ID=workspace-id
 * POWER_BI_REPORT_ID=report-id
 */

// ============================================================================
// TESTING EXAMPLES
// ============================================================================

/**
 * Test with mocked authentication
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Authenticated Routes', () => {
  beforeEach(() => {
    process.env.AZURE_TENANT_ID = 'test-tenant';
    process.env.AZURE_CLIENT_ID = 'test-client';
    process.env.AZURE_CLIENT_SECRET = 'test-secret';

    // Mock @azure/msal-node
    vi.mock('@azure/msal-node', () => ({
      ConfidentialClientApplication: vi.fn(() => ({
        acquireTokenByClientCredential: vi.fn().mockResolvedValue({
          accessToken: 'mock-token',
          expiresOn: new Date(Date.now() + 3600 * 1000),
        }),
      })),
    }));
  });

  it('should attach auth token to requests', async () => {
    // Test implementation
  });

  it('should retry on 401', async () => {
    // Test implementation
  });

  it('should handle auth errors', async () => {
    // Test implementation
  });
});

// ============================================================================
// PRODUCTION DEPLOYMENT CHECKLIST
// ============================================================================

/**
 * Before deploying to production:
 *
 * ✅ Environment variables:
 *    - Use Azure Key Vault for secrets (AZURE_CLIENT_SECRET)
 *    - Never commit .env to git
 *    - Set AZURE_TENANT_ID, AZURE_CLIENT_ID in config
 *
 * ✅ Error handling:
 *    - All routes have try/catch with next(error)
 *    - Error handler middleware configured
 *    - AuthError messages don't expose internal details
 *
 * ✅ Logging:
 *    - Review logs - verify no tokens are logged
 *    - Check logging doesn't expose sensitive data
 *    - Ensure debug logs are disabled in production
 *
 * ✅ Security:
 *    - HTTPS/TLS enabled
 *    - CORS configured for your frontend domain only
 *    - Helmet middleware enabled
 *    - Rate limiting configured (not shown in example)
 *
 * ✅ Monitoring:
 *    - Track auth failures in Application Insights
 *    - Alert on repeated 401/503 errors
 *    - Monitor token refresh patterns
 *
 * ✅ Testing:
 *    - npm test passes
 *    - Coverage includes auth scenarios
 *    - Integration tests for Power BI endpoints
 */

export default createAppWithAuth;
