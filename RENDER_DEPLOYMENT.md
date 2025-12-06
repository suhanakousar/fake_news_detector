# Render Deployment Guide - Option A (Single Service)

This guide covers deploying TruthLens to Render as a **single web service** that handles frontend, backend, Python ML models, and database.

---

## ✅ What's Been Configured

### 1. **Root `package.json`**
- ✅ Updated build script to install dependencies and build both client and server
- ✅ Start script points to compiled server: `node dist/index.js`

### 2. **Server Configuration (`server/index.ts`)**
- ✅ Updated to serve React build in production
- ✅ CORS configured for Render domains
- ✅ Static file serving from `dist/public`

### 3. **Client API Configuration**
- ✅ Uses relative URLs (`/api/...`) - works automatically on same origin
- ✅ No need for separate API URL configuration

### 4. **Render Configuration (`render.yaml`)**
- ✅ Build command includes Python dependencies: `pip install -r requirements.txt && npm install && npm run build`
- ✅ Start command: `npm start`
- ✅ Environment variables configured
- ✅ PostgreSQL database configured

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `AuthenticCreative1` (or your repo name)

### Step 3: Configure Service

**Service Settings:**

- **Name**: `truthlens` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (uses repo root)

**Build & Start Commands:**

Render will automatically use `render.yaml` if present, or you can set manually:

- **Build Command**: 
  ```bash
  pip install -r requirements.txt && npm install && npm run build
  ```

- **Start Command**:
  ```bash
  npm start
  ```

### Step 4: Add PostgreSQL Database

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Name: `truthlens-db`
3. Plan: `Free` (or choose paid plan)
4. Click **"Create Database"**
5. Copy the **Internal Database URL** (you'll need this)

### Step 5: Set Environment Variables

In your Web Service settings → **Environment** tab, add:

**Required:**
```env
DATABASE_URL=<from PostgreSQL service>
SESSION_SECRET=<generate-random-string>
NODE_ENV=production
PORT=10000
```

**Optional (but recommended):**
```env
GOOGLE_FACT_CHECK_API_KEY=your-key-here
GEMINI_API_KEY=your-key-here
BYTEZ_API_KEY=349c88bd7835622d5760900f6b0f8a51
```

**Firebase (if using):**
```env
FIREBASE_API_KEY=your-key
FIREBASE_AUTH_DOMAIN=your-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-bucket
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

**Note**: Render automatically sets `PORT` to `10000` for web services. Your code already uses `process.env.PORT || 5002`, so it will work.

### Step 6: Initialize Database

After first deployment, you need to initialize the database schema:

1. Go to your Web Service → **Shell** tab
2. Run:
   ```bash
   npm run db:push
   ```

Or connect via `psql` and run migrations manually.

### Step 7: Health Check

Set **Health Check Path** in service settings:
- Path: `/api/health`

This tells Render your service is healthy when the backend responds.

---

## 📋 Build Process

When Render builds your app, it will:

1. **Install Python dependencies**: `pip install -r requirements.txt`
   - Installs: torch, transformers, pandas, numpy, scikit-learn, etc.

2. **Install Node dependencies**: `npm install`
   - Installs all npm packages

3. **Build client**: `vite build`
   - Outputs to: `dist/public/`

4. **Build server**: `esbuild server/index.ts`
   - Outputs to: `dist/index.js`

5. **Start server**: `npm start`
   - Runs: `node dist/index.js`
   - Serves React app from `dist/public/`
   - Handles API routes at `/api/*`

---

## 🔍 Troubleshooting

### Build Fails: "Python not found"

**Solution**: Render's default environment includes Python 3. If it doesn't work:
- Check Render logs for Python version
- You may need to specify Python version in build command:
  ```bash
  python3 -m pip install -r requirements.txt && npm install && npm run build
  ```

### Build Fails: "Cannot find module"

**Solution**: 
- Make sure all dependencies are in `package.json`
- Check that `node_modules` is not in `.gitignore` (it shouldn't be - Render installs it)

### Build Fails: "dist/public not found"

**Solution**: 
- Check that `vite build` completed successfully
- Verify `vite.config.ts` outputs to `dist/public`
- Check build logs for Vite errors

### Server Starts but Shows 404

**Solution**:
- Verify `dist/public/index.html` exists
- Check that static file serving is working
- Verify API routes are registered before static middleware

### Database Connection Error

**Solution**:
- Verify `DATABASE_URL` is set correctly
- Check that PostgreSQL service is running
- Ensure database URL format: `postgresql://user:pass@host:port/dbname`
- Run `npm run db:push` to create tables

### Python Scripts Not Working

**Solution**:
- Verify Python dependencies installed: `pip list` in Render shell
- Check that Python scripts are in correct location
- Verify file paths in `server/lib/analyzer.ts` match deployed structure
- Check Python version: `python --version` or `python3 --version`

### CORS Errors

**Solution**:
- Check that CORS is configured for your Render domain
- Verify `RENDER_EXTERNAL_URL` is set (Render sets this automatically)
- Check browser console for specific CORS error

---

## 🧪 Testing Locally Before Deploy

Test the production build locally:

```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Build
npm run build

# Start
npm start
```

Then visit `http://localhost:5002` and verify:
- ✅ React app loads
- ✅ API endpoints work (`/api/health`)
- ✅ Can analyze content
- ✅ Database operations work

---

## 📊 Monitoring

### View Logs

1. Go to your Web Service in Render Dashboard
2. Click **"Logs"** tab
3. View real-time logs

### Check Health

- Health check endpoint: `https://your-app.onrender.com/api/health`
- Should return: `{"status":"healthy",...}`

### Database Management

- Use Render's PostgreSQL dashboard
- Or connect via `psql` from Render shell
- Or use a database GUI tool with connection string

---

## 🔄 Updating Deployment

After making changes:

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. Render will automatically:
   - Detect the push
   - Start a new build
   - Deploy when build succeeds

3. Monitor the deployment in Render dashboard

---

## 💡 Tips

1. **Free Tier Limits**: 
   - Services spin down after 15 minutes of inactivity
   - First request after spin-down takes ~30 seconds
   - Consider upgrading to paid plan for always-on service

2. **Environment Variables**:
   - Never commit `.env` file
   - Set all secrets in Render dashboard
   - Use `render.yaml` for non-sensitive defaults

3. **Database Backups**:
   - Free tier: Manual backups only
   - Paid tier: Automatic daily backups
   - Export data regularly: `pg_dump $DATABASE_URL > backup.sql`

4. **Performance**:
   - Enable caching where possible
   - Optimize images and assets
   - Consider CDN for static assets (Render provides this)

5. **Scaling**:
   - Free tier: Single instance
   - Paid tier: Can scale horizontally
   - Monitor resource usage in dashboard

---

## ✅ Deployment Checklist

Before deploying, verify:

- [ ] Code pushed to GitHub
- [ ] `render.yaml` is in repo root
- [ ] `package.json` has correct build/start scripts
- [ ] `server/index.ts` serves static files in production
- [ ] CORS configured for Render domains
- [ ] Environment variables documented
- [ ] Database schema ready (`npm run db:push`)
- [ ] Python dependencies in `requirements.txt`
- [ ] Health check endpoint works (`/api/health`)
- [ ] Tested locally with `npm run build && npm start`

---

## 🎉 Success!

Once deployed, your app will be available at:
- `https://your-app-name.onrender.com`

The single service handles:
- ✅ Frontend (React app)
- ✅ Backend (Express API)
- ✅ Python ML models
- ✅ Database (PostgreSQL)

All in one place! 🚀

