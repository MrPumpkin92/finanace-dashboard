# Frontend Deployment Guide

## Overview

The Finance Dashboard frontend is a React TypeScript application built with Vite. It can be deployed to various platforms.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running at specified URL

## Local Development

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Development Server

```bash
npm run dev
```

The app will run at `http://localhost:3000` with:
- Hot module replacement (HMR)
- Proxy to backend API at `http://localhost:5000/api`

### 3. Type Checking

```bash
npm run type-check
```

### 4. Linting

```bash
npm run lint
```

## Building for Production

### Build

```bash
npm run build
```

This creates an optimized build in the `dist/` directory:
- Minified JavaScript
- Tree-shaken dependencies
- Source maps for debugging

### Preview Production Build

```bash
npm run preview
```

## Deployment Platforms

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Configure environment variables:
- `VITE_API_URL`: Backend API URL

### Netlify

1. Build command: `npm run build`
2. Publish directory: `dist`
3. Environment variables:
   - `VITE_API_URL`: Backend API URL

### Docker

```dockerfile
# Build stage
FROM node:18 AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:
```bash
docker build -t finance-dashboard-frontend .
docker run -p 3000:3000 finance-dashboard-frontend
```

### AWS S3 + CloudFront

1. Build the app: `npm run build`
2. Upload `dist/` to S3
3. Create CloudFront distribution
4. Set environment variables for API URL

### Azure App Service

```bash
az webapp up --name finance-dashboard --runtime node:18
```

## Environment Configuration

### Development
```
API_BASE_URL=http://localhost:5000/api
```

### Production
```
API_BASE_URL=https://api.yourdomain.com/api
```

Create `.env.local`:
```bash
VITE_API_URL=https://api.yourdomain.com/api
```

Update `src/utils/api.ts` to use environment variable:
```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

## Performance Optimization

The build includes:
- Code splitting with lazy routes
- Minification and compression
- Tree shaking of unused code
- Asset optimization

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Modern browsers with ES2020 support

## Security Headers

Add to your web server or CDN:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' https://*.powerbi.com
```

## CORS Configuration

Ensure backend is configured for frontend domain:
```
CORS_ORIGIN=https://yourdomain.com
```

## Troubleshooting

### API Calls Fail
- Check backend is running
- Verify API URL in environment variables
- Check browser console for CORS errors

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Type Errors
```bash
npm run type-check
```

## Monitoring

### Error Tracking
Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- New Relic for performance

### Analytics
- Google Analytics
- Mixpanel
- Amplitude

## Continuous Integration/Deployment

### GitHub Actions Example

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: 18
      - run: cd frontend && npm install && npm run build
      - name: Deploy to Vercel
        run: |
          npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## Rollback

### Vercel
```bash
vercel rollback
```

### Manual
Keep previous build artifacts and revert routing.

## Performance Metrics

Target metrics:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Time to Interactive (TTI): < 3.5s

Check with:
- PageSpeed Insights
- WebPageTest
- Lighthouse

## Support

For issues, check:
- Browser console for errors
- Network tab for API calls
- Backend logs for errors
