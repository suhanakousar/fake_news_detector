# API URL Fix - localhost:3000 Issue

## 🐛 Problem

The app is trying to connect to `http://localhost:3000/api/...` instead of using relative URLs, causing connection errors on Render.

## ✅ Fix Applied

Updated `client/src/lib/queryClient.ts` to:
1. **Ignore `VITE_API_URL` if it points to `localhost:3000`** (wrong port)
2. **Force relative URLs in production** (same origin)
3. **Only use `VITE_API_URL` in development** (and only if not pointing to wrong port)

## 🔧 What Changed

```typescript
// Before: Used VITE_API_URL if set
const BASE_URL = envApiUrl || '';

// After: Smart detection
const isProduction = import.meta.env.PROD || window.location.hostname !== 'localhost';
const isWrongPort = envApiUrl?.includes('localhost:3000');
const BASE_URL = (!isProduction && !isWrongPort && envApiUrl) ? envApiUrl : '';
```

## 🚀 Next Steps

### 1. Check Render Environment Variables

In Render dashboard → Your Service → Environment tab, check if `VITE_API_URL` is set:

- ❌ **Remove it** if it's set to `http://localhost:3000`
- ✅ **Or leave it empty** (relative URLs will be used)

### 2. Rebuild and Deploy

The fix is in the code, but you need to:
1. Commit and push the changes
2. Render will rebuild
3. The new build will use relative URLs

### 3. Verify After Deployment

After redeploy, check browser console:
- ✅ Should see: `baseUrl: '(relative)'` in API requests
- ❌ Should NOT see: `baseUrl: 'http://localhost:3000'`

## 📝 Environment Variables

**In Render, you should NOT have:**
```env
VITE_API_URL=http://localhost:3000  # ❌ Remove this
```

**Or set it to empty/remove it:**
```env
# VITE_API_URL=  # ✅ Commented out or removed
```

**For production, relative URLs work automatically:**
- `/api/auth/me` → Uses same origin (your Render domain)
- No configuration needed!

---

**After pushing the fix and redeploying, API calls will work correctly!** 🚀

