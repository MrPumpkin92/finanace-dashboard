<!-- Integration Guide for Azure AD Authentication -->

# Azure AD Authentication Integration Guide

This guide shows how to integrate the new Azure AD authentication system into your finance dashboard application.

## Overview

The authentication system provides:
- **MSAL-based token acquisition** with ConfidentialClientApplication
- **Automatic token caching** with 60-second pre-expiry refresh
- **401 retry logic** with single automatic retry and token refresh
- **Comprehensive error handling** with typed AuthError
- **Security-focused logging** that never exposes token values

## Files Created

1. **`src/auth/authClient.ts`** - Core authentication client
   - `getAuthClient()` - Singleton instance
   - `initializeAuthClient()` - One-time startup initialization
   - `acquireToken()` - Get a valid bearer token
   - `AuthError` - Typed authentication errors

2. **`src/auth/authMiddleware.ts`** - Express middleware and interceptors
   - `authenticateMiddleware()` - Middleware to attach tokens to requests
   - `authErrorHandler()` - Express error handler for auth errors
   - `createAuthenticatedClient()` - Pre-configured Axios client with 401 retry

3. **`tests/auth.test.ts`** - Comprehensive unit tests
   - Token acquisition tests
   - Caching behavior
   - Auto-refresh on expiry
   - Environment validation
   - Error handling

4. **`src/utils/errors.ts`** - Updated with AuthError class

## Setup Instructions

### 1. Initialize Authentication at Startup

In `src/index.ts` or `src/server/app.ts`:

```typescript
import { initializeAuthClient } from './auth/authClient.js';

// Call this once at application startup, BEFORE creating the Express app
try {
  initializeAuthClient();
  console.log('Azure AD authentication initialized');
} catch (error) {
  console.error('Failed to initialize authentication:', error);
  process.exit(1);
}
```

### 2. Add Required Environment Variables

In your `.env` file:

```bash
# Azure AD Configuration
AZURE_TENANT_ID=your-tenant-id-here
AZURE_CLIENT_ID=your-client-id-here
AZURE_CLIENT_SECRET=your-client-secret-here

# (Other existing vars...)
POWER_BI_WORKSPACE_ID=workspace-id
POWER_BI_REPORT_ID=report-id
```

### 3. Option A: Use Middleware (Recommended)

For most routes, use the authentication middleware:

```typescript
import { authenticateMiddleware, authErrorHandler } from './auth/authMiddleware.js';

app.use(authenticateMiddleware);

// Routes here will have req.authContext.token available
app.get('/api/power-bi/reports', (req, res) => {
  const token = req.authContext?.token;
  // Use token for Power BI API calls
});

// Error handler (should be after all route handlers)
app.use(authErrorHandler);
```

### 3. Option B: Use Pre-configured Axios Client

For server-to-server API calls with automatic 401 retry:

```typescript
import { createAuthenticatedClient } from './auth/authMiddleware.js';

const powerBIClient = createAuthenticatedClient();

// This client automatically:
// - Attaches bearer tokens to requests
// - Retries once on 401
// - Refreshes token and retries
// - Returns 503 on second failure

const response = await powerBIClient.get('/datasets');
```

Example in a route:

```typescript
import { createAuthenticatedClient } from './auth/authMiddleware.js';

const powerBIClient = createAuthenticatedClient();

app.get('/api/datasets', async (req, res, next) => {
  try {
    const response = await powerBIClient.get('/datasets');
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});
```

### 4. Option C: Manual Token Acquisition

For fine-grained control:

```typescript
import { acquireToken, getAuthClient } from './auth/authClient.js';

// Get a fresh token
const token = await acquireToken();

// Or use the client directly
const client = getAuthClient();
const token = await client.acquireToken();

// Explicitly refresh if needed (e.g., after 401)
const freshToken = await client.refreshToken();
```

## Error Handling

All authentication errors throw `AuthError` with helpful messages:

```typescript
import { AuthError } from './utils/errors.js';

try {
  const token = await acquireToken();
} catch (error) {
  if (error instanceof AuthError) {
    console.error(`Auth failed: ${error.message}`);
    console.error(`Status: ${error.statusCode}`); // 401
    console.error(`Code: ${error.code}`); // 'AUTH_ERROR'
    console.error(`Context:`, error.context); // Debugging info
  }
}
```

Common AuthError messages:
- `"Missing required environment variables: AZURE_TENANT_ID, ..."`
- `"Failed to acquire access token: [reason]"`
- `"Empty token response from Azure AD"`
- `"Authentication client not initialized. Call initialize() first."`

## Running Tests

```bash
# Run all tests
npm test

# Run only auth tests
npm test -- auth.test.ts

# Run with coverage
npm test -- --coverage
```

## Caching Behavior

Tokens are automatically cached in memory with these rules:

- **Cache hit**: Token is valid and expires more than 60 seconds from now
- **Auto-refresh**: Token expires within 60 seconds (refreshed transparently)
- **Manual refresh**: Available via `getAuthClient().refreshToken()`

Example timeline:
```
00:00 - Token acquired, expires at 01:00
00:00 - Cached and returned immediately
00:30 - Still cached (expires > 60 seconds from now)
00:31 - Still cached (expires > 60 seconds)
00:59 - Auto-refresh triggered (expires < 60 seconds)
       New token acquired
```

## 401 Retry Logic

The Axios interceptor handles 401 responses automatically:

1. **First 401**: Calls `refreshToken()` and retries the request with new token
2. **Second 401**: Returns `AxiosError` with status 503 "Service Unavailable"
3. **Non-401 errors**: Passed through unchanged

```typescript
try {
  const response = await powerBIClient.get('/datasets');
  res.json(response.data);
} catch (error) {
  if (error.response?.status === 503) {
    // Authentication failed even after retry
    res.status(503).json({ message: 'Power BI authentication failed' });
  }
}
```

## Security Considerations

✅ **Token values are NEVER logged** - Logger receives only metadata
✅ **Tokens cached in memory** - Not in logs, files, or localStorage  
✅ **Auto-refresh 60 seconds before expiry** - Reduces invalid token errors
✅ **Explicit retry limit** - Only one automatic retry to prevent token storms
✅ **TypeScript types** - Full type safety for auth operations

## Type Definitions

```typescript
// AuthError context type
interface AuthError {
  message: string;
  statusCode: 401;
  code: 'AUTH_ERROR';
  context?: Record<string, unknown>;
}

// AuthenticatedRequest adds auth context
interface AuthenticatedRequest extends Request {
  authContext?: {
    token?: string;
    retryCount: number;
  };
}
```

## Troubleshooting

### Error: "Missing required environment variables: AZURE_TENANT_ID"

**Solution**: Check your `.env` file has all required variables:
```bash
AZURE_TENANT_ID=<your tenant ID>
AZURE_CLIENT_ID=<your app registration ID>
AZURE_CLIENT_SECRET=<your app registration secret>
```

### Error: "Empty token response from Azure AD"

**Solution**: Verify credentials are correct and the service principal has access to Power BI API:
- Tenant ID format: UUID (e.g., `12345678-1234-5678-1234-567812345678`)
- Client ID format: UUID (from App Registration)
- Client Secret: Must be from "Certificates & secrets"

### 503 Power BI authentication failed

**Solution**: The token refresh failed after a 401. This usually means:
- Azure AD service is down
- Credentials are invalid or expired
- Network connectivity issue

Check logs for detailed Azure AD error messages.

### Token refreshes too frequently

**Solution**: Check if your token expiry is very short (less than 2 minutes). Azure AD defaults to 1 hour expiry, which should not refresh frequently.

## Integration Checklist

- [ ] Environment variables configured in `.env`
- [ ] `initializeAuthClient()` called at app startup
- [ ] Middleware added to Express app: `app.use(authenticateMiddleware)`
- [ ] Error handler added: `app.use(authErrorHandler)`
- [ ] Tests pass: `npm test`
- [ ] Authentication errors handled in route handlers
- [ ] Logging reviewed - no tokens in logs
- [ ] Type definitions imported for `AuthError`, `AuthenticatedRequest`

## Next Steps

1. Review `src/auth/authClient.ts` for token caching implementation
2. Review `src/auth/authMiddleware.ts` for 401 retry logic
3. Update routes to use the new authentication
4. Run tests: `npm test`
5. Deploy with proper Azure Key Vault for secrets management
