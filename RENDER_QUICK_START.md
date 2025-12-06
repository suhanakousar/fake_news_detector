# Render Deployment - Quick Start

## ✅ What Changed

Your app is now configured for **Render Option A** (single service deployment).

### Files Modified:

1. **`package.json`** - Updated build script
2. **`server/index.ts`** - Added static file serving + CORS for Render
3. **`server/vite.ts`** - Fixed static serving to skip API routes
4. **`client/src/lib/queryClient.ts`** - Simplified to use relative URLs
5. **`render.yaml`** - Added Python installation to build command

---

## 🚀 Deploy in 3 Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### 2. Create Render Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. **New +** → **Web Service**
3. Connect GitHub repo
4. Render will auto-detect `render.yaml` ✅

### 3. Set Environment Variables

In Render dashboard → **Environment** tab:

**Required:**
```env
DATABASE_URL=<from PostgreSQL service>
SESSION_SECRET=<random-string>
NODE_ENV=production
```

**Optional:**
```env
GOOGLE_FACT_CHECK_API_KEY=...
GEMINI_API_KEY=...
BYTEZ_API_KEY=349c88bd7835622d5760900f6b0f8a51
```

---

## 📋 Build Commands (Auto-detected from render.yaml)

**Build:**
```bash
pip install -r requirements.txt && npm install && npm run build
```

**Start:**
```bash
npm start
```

---

## 🗄️ Database Setup

1. Create PostgreSQL in Render dashboard
2. Copy `DATABASE_URL` to environment variables
3. After first deploy, run in Render Shell:
   ```bash
   npm run db:push
   ```

---

## ✅ Verify Deployment

1. Visit: `https://your-app.onrender.com`
2. Check health: `https://your-app.onrender.com/api/health`
3. Test analysis feature

---

## 📚 Full Guide

See `RENDER_DEPLOYMENT.md` for detailed instructions and troubleshooting.

---

## 🎯 Key Points

- ✅ Single service handles everything (frontend + backend + Python + DB)
- ✅ React app served from `dist/public/`
- ✅ API routes at `/api/*`
- ✅ Python ML models work via spawn
- ✅ CORS configured for Render domains
- ✅ Relative URLs - no API URL config needed

---

**Ready to deploy!** 🚀

