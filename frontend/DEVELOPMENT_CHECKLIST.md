# Frontend Development Checklist

## Prerequisites ✓

- [x] Node.js 18+ installed
- [x] npm or yarn available
- [x] Backend API running (port 5000)
- [x] Git available

## Initial Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```
**Expected:** All packages install without errors

### 2. Verify TypeScript
```bash
npm run type-check
```
**Expected:** No type errors

### 3. Check Linting
```bash
npm run lint
```
**Expected:** No linting errors

## Development Workflow

### Start Development Server
```bash
npm run dev
```
**Expected:** 
- App runs on http://localhost:3000
- Auto-refresh on file changes
- No build errors in console

### Test Features
- [ ] Dashboard loads
- [ ] Sidebar navigation works
- [ ] Can navigate to Transactions
- [ ] Can navigate to Report
- [ ] Can navigate to Settings

### Test Transactions Page
- [ ] Transactions table loads
- [ ] Monthly summary displays
- [ ] Month picker works (prev/next)
- [ ] Type filter works (All/Income/Expense)
- [ ] Category filter shows categories
- [ ] Search box appears
- [ ] Add Transaction button opens modal
- [ ] Form validation works
- [ ] Can submit form
- [ ] Import CSV button works

### Test Forms
- [ ] Transaction form validates date
- [ ] Amount validation works (>0)
- [ ] Category required validation
- [ ] Description required validation
- [ ] Type toggle switches
- [ ] Category dropdown shows appropriate options
- [ ] Submit button works
- [ ] Escape key closes modal

### Test Styling
- [ ] Dark theme applied
- [ ] Responsive on mobile (< 768px)
- [ ] Responsive on tablet (768px-1024px)
- [ ] Responsive on desktop (> 1024px)
- [ ] Colors consistent (green income, red expense)
- [ ] Tailwind classes applied correctly

### Test API Integration
- [ ] Transactions load from API
- [ ] Categories load from API
- [ ] Can create transaction (POST)
- [ ] Can delete transaction (DELETE)
- [ ] Can import CSV (POST)
- [ ] Summary calculates correctly
- [ ] Pagination works

## Debugging

### Console Errors
Check browser console (F12) for:
- [ ] No JavaScript errors
- [ ] No CORS errors
- [ ] No TypeScript errors

### Network Tab
Check Network tab for:
- [ ] API requests successful (200)
- [ ] No 404 errors
- [ ] Correct request/response format
- [ ] CORS headers present

### React DevTools
Use React DevTools browser extension to:
- [ ] Inspect component tree
- [ ] Check props/state
- [ ] Profile performance
- [ ] Check hooks state

### React Query DevTools
```bash
npm install @tanstack/react-query-devtools
```

Then add to App.tsx:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Inside QueryClientProvider:
<ReactQueryDevtools initialIsOpen={false} />
```

## Common Issues & Solutions

### Issue: "Cannot find module 'react-router-dom'"
**Solution:** 
```bash
npm install react-router-dom
```

### Issue: API returns 404
**Solution:** 
- Ensure backend is running on port 5000
- Check API endpoint URLs in `src/utils/api.ts`
- Verify CORS configuration on backend

### Issue: Tailwind classes not applying
**Solution:**
- Clear build cache: `rm -rf dist`
- Rebuild: `npm run dev`
- Check `tailwind.config.js` content paths

### Issue: TypeScript errors
**Solution:**
- Run: `npm run type-check`
- Install missing type packages
- Check `tsconfig.json` settings

### Issue: Form submission fails
**Solution:**
- Check React Hook Form setup
- Verify Zod schema validation
- Check API error responses
- Look at network tab for errors

## Production Build

### Build for Production
```bash
npm run build
```
**Expected:**
- Builds successfully with no errors
- `dist/` folder created
- Source maps generated

### Preview Production Build
```bash
npm run preview
```
**Expected:**
- App runs identically to dev version
- All features work
- Styling correct

### Build Size Check
After build, check:
- [ ] Main JS < 500KB gzipped
- [ ] Total assets < 1MB
- [ ] No unused dependencies
- [ ] Tree shaking working

## Testing Before Deployment

### Manual Testing Checklist
- [ ] Can add transaction with all field types
- [ ] Can edit transaction (if implemented)
- [ ] Can delete transaction
- [ ] Can import CSV file
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] Summary calculations correct
- [ ] Month navigation works
- [ ] Categories display with colors
- [ ] Responsive design works
- [ ] Dark theme displays correctly
- [ ] Error messages appear
- [ ] Loading states visible

### Cross-browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

### Performance Testing
```bash
npm run build
npx lighthouse http://localhost:5000
```

Target scores:
- [ ] Performance: > 90
- [ ] Accessibility: > 90
- [ ] Best Practices: > 90
- [ ] SEO: > 90

## Code Quality

### Run Linter
```bash
npm run lint
```
**Expected:** No errors or warnings

### Type Check
```bash
npm run type-check
```
**Expected:** All types valid

### Format Code (if prettier added)
```bash
npx prettier --write "src/**/*.tsx"
```

## Documentation

- [ ] README.md reviewed
- [ ] Component docs up to date
- [ ] API documentation complete
- [ ] Deployment guide accurate
- [ ] Architecture guide helpful

## Version Control

### Before Committing
- [ ] No console.log statements
- [ ] No debug code
- [ ] All tests passing
- [ ] No uncommitted changes in dependencies
- [ ] .gitignore includes node_modules

### Commit Message Format
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

## Environment Configuration

### Development (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

### Production (before deploy)
```
VITE_API_URL=https://api.yourdomain.com/api
```

## Deployment Checklist

Before deploying to production:
- [ ] All tests passing
- [ ] No console errors
- [ ] Build successful
- [ ] Environment variables set
- [ ] Backend API accessible
- [ ] CORS configured
- [ ] Security headers set
- [ ] Performance metrics good
- [ ] Error logging configured
- [ ] Analytics integrated

### Vercel Deployment
```bash
npm install -g vercel
vercel
```

### Docker Build
```bash
docker build -t finance-dashboard-frontend -f Dockerfile.frontend .
docker run -p 3000:3000 finance-dashboard-frontend
```

## Monitoring

### After Deployment
- [ ] App loads
- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Error tracking working
- [ ] Analytics tracking

### Regular Checks
- [ ] Monitor error logs daily
- [ ] Check performance metrics weekly
- [ ] Review user analytics
- [ ] Update dependencies monthly

## Support & Troubleshooting

### Getting Help
1. Check console for errors
2. Review network tab
3. Check backend logs
4. Review documentation
5. Search GitHub issues

### Common Fixes
```bash
# Clear cache and reinstall
rm -rf node_modules dist package-lock.json
npm install

# Rebuild
npm run build

# Type check
npm run type-check

# Full restart
npm run dev
```

## Performance Optimization

- [ ] Implement code splitting for routes
- [ ] Add lazy loading for components
- [ ] Optimize images (if any)
- [ ] Minimize bundle size
- [ ] Configure caching headers
- [ ] Enable gzip compression

## Security Checklist

- [ ] No credentials in code
- [ ] No secrets in .env file
- [ ] HTTPS only in production
- [ ] CSP headers configured
- [ ] XSS protection enabled
- [ ] CORS properly configured
- [ ] Dependencies up to date
- [ ] No known vulnerabilities

```bash
npm audit
npm audit fix
```

## Final Verification

Run this before considering frontend complete:

```bash
npm run lint          # ✓ No lint errors
npm run type-check    # ✓ No type errors
npm run build         # ✓ Build succeeds
npm run preview       # ✓ Preview runs
npm run dev           # ✓ Dev server works
```

---

**Status: Ready for Development** ✅

All setup tasks are in place. Frontend is ready for:
- Development work
- Testing
- Deployment
- Production use
