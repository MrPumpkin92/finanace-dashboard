# Quick Start Guide - Finance Dashboard Frontend

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Start Backend (in separate terminal)
```bash
cd ..
npm run dev
# Backend runs on http://localhost:5000
```

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Step 4: Open in Browser
Navigate to **http://localhost:3000**

---

## 📋 Useful Commands

### Development
```bash
npm run dev          # Start dev server with HMR
npm run type-check   # Check TypeScript types
npm run lint         # Run ESLint
```

### Building
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run lint         # Check code quality
npm run type-check   # Check type safety
```

---

## 🎨 Frontend Overview

### Main Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Home page with getting started |
| Transactions | `/transactions` | View/add/filter transactions |
| Report | `/report` | Power BI analytics |
| Settings | `/settings` | App settings (coming soon) |

### Key Features

✅ Add transactions (date, amount, category, notes)
✅ View transactions in table with filtering
✅ Import CSV transactions
✅ Monthly financial summaries
✅ Power BI report embedding
✅ Dark theme UI
✅ Responsive design (mobile/tablet/desktop)
✅ Form validation
✅ Category management

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components (Dashboard, Transactions, Report)
│   ├── hooks/            # Custom React hooks for API/data
│   ├── utils/            # Helper functions (API, formatting, validation)
│   ├── types/            # TypeScript type definitions
│   ├── styles/           # CSS and Tailwind styling
│   ├── App.tsx           # Main app component with routing
│   └── main.tsx          # Entry point
├── vite.config.ts        # Vite build configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Dependencies and scripts
└── index.html            # HTML template
```

---

## 🔧 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Lightning fast build tool
- **Tailwind CSS** - Utility-first CSS
- **React Query** - Server state management
- **React Hook Form + Zod** - Form handling & validation
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Date-fns** - Date utilities
- **PowerBI Client** - Report embedding

---

## 🎯 Common Tasks

### Add a New Transaction
1. Click "➕ Add Transaction" button
2. Select type (Income/Expense)
3. Enter date, amount, category
4. Add description and optional notes
5. Click "Add Transaction"

### Import CSV
1. Click "📁 Import CSV" button
2. Select a CSV file from your computer
3. Wait for import to complete
4. See import results (imported/failed count)

### Filter Transactions
1. Select month using month picker (← →)
2. Filter by type (All/Income/Expense)
3. Filter by category (dropdown)
4. Search by description (search box)

### View Financial Summary
- Monthly income total
- Monthly expense total
- Net savings
- Largest expense category

---

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### API connection errors
- Ensure backend is running on port 5000
- Check `src/utils/api.ts` for correct API URL
- Check browser console for CORS errors

### Tailwind classes not applying
```bash
rm -rf dist
npm run dev
```

### TypeScript errors
```bash
npm run type-check
```

---

## 📚 Documentation

- **README.md** - Full project documentation
- **ARCHITECTURE.md** - Component and data flow architecture
- **DEPLOYMENT.md** - Deployment guide for production
- **DEVELOPMENT_CHECKLIST.md** - Complete development checklist

---

## 🔐 Environment Variables

Create `.env.local` (optional):
```
VITE_API_URL=http://localhost:5000/api
```

Default API URL is already configured in `vite.config.ts`

---

## 💡 Tips & Tricks

### Dark Theme
The app uses a dark theme by default. All colors are optimized for dark mode with:
- Dark navy background (#0f172a)
- Dark surface cards (#1e293b)
- Green for income (#22c55e)
- Red for expenses (#ef4444)

### Responsive Design
- Mobile: Works on phones (< 768px)
- Tablet: Optimized for tablets (768px-1024px)
- Desktop: Full experience on desktop (> 1024px)

### Keyboard Navigation
- `Escape` - Close any open modal
- `Tab` - Navigate form fields
- `Enter` - Submit form

### Form Validation
All forms validate input before submission:
- Date must be valid
- Amount must be > 0
- Category must be selected
- Description required
- Zod schemas validate on client

---

## 📊 Performance

Current performance targets:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s

Check performance:
```bash
npm run build    # Build optimized version
npm run preview  # Preview production build
```

---

## 🚀 Production Build

```bash
# Build optimized bundle
npm run build

# Output is in dist/ directory
# Ready to deploy to any static hosting

# Test production build locally
npm run preview
```

---

## 📞 Support

### Getting Help
1. Check browser console (F12) for errors
2. Check network tab for API calls
3. Review documentation files
4. Check backend logs

### Common Fixes
```bash
npm run type-check    # Find type errors
npm run lint          # Check code quality
npm run dev           # Full restart with HMR
```

---

## ✅ Checklist: First Time Setup

- [ ] Installed Node.js 18+
- [ ] Installed dependencies (`npm install`)
- [ ] Backend running (`npm run dev` in root)
- [ ] Frontend running (`npm run dev` in frontend)
- [ ] Opened http://localhost:3000
- [ ] Can view dashboard
- [ ] Can navigate pages
- [ ] No console errors
- [ ] All features working

---

## 🎓 Learning Resources

### Frontend Concepts
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Router Docs](https://reactrouter.com)
- [React Query Docs](https://tanstack.com/query/latest)

### Tools
- [Vite Docs](https://vitejs.dev)
- [React DevTools Extension](https://chrome.google.com/webstore/detail/react-developer-tools)
- [React Query DevTools](https://tanstack.com/query/latest/docs/devtools)

---

## 🏆 Best Practices

✅ Use React Query for all API calls
✅ Use React Hook Form for all forms
✅ Use Zod for schema validation
✅ Use Tailwind CSS for styling
✅ Keep components small and focused
✅ Use TypeScript strict mode
✅ Handle loading and error states
✅ Add user feedback for actions

❌ Don't use fetch directly (use React Query)
❌ Don't validate forms without Zod
❌ Don't use inline styles (use Tailwind)
❌ Don't ignore TypeScript errors
❌ Don't forget error handling
❌ Don't leave console.log in production code

---

## 📈 What's Next?

After setup, you can:
1. Add more transaction categories
2. Extend the Power BI integration
3. Add budget tracking features
4. Implement transaction search
5. Add data export functionality
6. Create mobile app version
7. Add offline support
8. Implement data sync

---

## 🎉 You're Ready!

Your Finance Dashboard frontend is now set up and ready to use. 

**Start developing:** `npm run dev`

Happy coding! 🚀
