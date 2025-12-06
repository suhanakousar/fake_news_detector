# TruthLens Deployment Guide

This guide covers deploying the TruthLens AI-powered fake news detection application to various platforms.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Overview](#project-overview)
3. [Local Development Setup](#local-development-setup)
4. [Environment Variables](#environment-variables)
5. [Database Setup](#database-setup)
6. [Deployment Options](#deployment-options)
   - [Docker Deployment](#docker-deployment)
   - [Vercel Deployment](#vercel-deployment)
   - [Railway Deployment](#railway-deployment)
   - [Render Deployment](#render-deployment)
   - [AWS/EC2 Deployment](#awsec2-deployment)
   - [Heroku Deployment](#heroku-deployment)
7. [Post-Deployment Checklist](#post-deployment-checklist)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- **Node.js** 20.x or higher
- **Python** 3.9+ (for ML models)
- **PostgreSQL** database (local or cloud)
- **npm** or **yarn** package manager
- **Git** for version control

## Project Overview

TruthLens is a full-stack application with:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **ML Models**: Python-based fake news detection (BERT)
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: Firebase + Passport.js
- **APIs**: Bytez, Google Fact Check, Gemini (optional)

## Local Development Setup

### 1. Clone and Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) section for details.

### 3. Set Up Database

```bash
# Make sure PostgreSQL is running
# Update DATABASE_URL in .env

# Push database schema
npm run db:push
```

### 4. Run Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at `http://localhost:5002`

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=5002

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/truthlens

# Session Secret (generate a random string)
SESSION_SECRET=your-super-secret-session-key-here

# API Keys
BYTEZ_API_KEY=349c88bd7835622d5760900f6b0f8a51
GOOGLE_FACT_CHECK_API_KEY=your_google_fact_check_api_key
GEMINI_API_KEY=your_gemini_api_key_here  # Optional

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Getting API Keys

1. **Bytez API**: Already configured (default key included)
2. **Google Fact Check API**: https://developers.google.com/fact-check/tools/api
3. **Gemini API**: https://makersuite.google.com/app/apikey (optional)
4. **Firebase**: https://console.firebase.google.com/

## Database Setup

### Local PostgreSQL

```bash
# Install PostgreSQL
# Create database
createdb truthlens

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/truthlens

# Push schema
npm run db:push
```

### Cloud PostgreSQL Options

- **Neon**: https://neon.tech (free tier available)
- **Supabase**: https://supabase.com (free tier available)
- **Railway**: https://railway.app
- **Render**: https://render.com

## Deployment Options

### Docker Deployment

#### Using Docker Compose (Recommended for Local)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Using Dockerfile

```bash
# Build image
docker build -t truthlens:latest .

# Run container
docker run -p 5002:5002 --env-file .env truthlens:latest
```

### Vercel Deployment

Vercel is great for frontend, but requires serverless functions for backend.

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configure Environment Variables** in Vercel dashboard

**Note**: You'll need to adapt the Express server to Vercel's serverless functions format.

### Railway Deployment

Railway is excellent for full-stack applications.

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   ```

2. **Login**:
   ```bash
   railway login
   ```

3. **Initialize Project**:
   ```bash
   railway init
   ```

4. **Add PostgreSQL Service**:
   ```bash
   railway add postgresql
   ```

5. **Set Environment Variables**:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
   # ... set other variables
   ```

6. **Deploy**:
   ```bash
   railway up
   ```

### Render Deployment

1. **Create New Web Service** on Render
2. **Connect your Git repository**
3. **Configure**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
4. **Add PostgreSQL Database** service
5. **Set Environment Variables** in dashboard
6. **Deploy**

### AWS/EC2 Deployment

1. **Launch EC2 Instance** (Ubuntu 22.04 recommended)
2. **SSH into instance**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

3. **Install Dependencies**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib

   # Install Python
   sudo apt install -y python3 python3-pip python3-venv

   # Install PM2 for process management
   sudo npm install -g pm2
   ```

4. **Clone and Setup**:
   ```bash
   git clone your-repo-url
   cd AuthenticCreative1
   npm install
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Configure Environment**:
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

6. **Build and Start**:
   ```bash
   npm run build
   pm2 start dist/index.js --name truthlens
   pm2 save
   pm2 startup
   ```

7. **Configure Nginx** (optional):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5002;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Heroku Deployment

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**:
   ```bash
   heroku login
   heroku create truthlens-app
   ```

3. **Add PostgreSQL**:
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SESSION_SECRET=your-secret
   # ... set other variables
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

6. **Run Migrations**:
   ```bash
   heroku run npm run db:push
   ```

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database schema pushed (`npm run db:push`)
- [ ] API keys verified and working
- [ ] CORS configured for your domain
- [ ] SSL certificate installed (HTTPS)
- [ ] Firebase configuration updated with production URLs
- [ ] Error logging/monitoring set up
- [ ] Backup strategy for database
- [ ] Performance monitoring configured
- [ ] Security headers configured

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Problem**: `Error: DATABASE_URL is not set`

**Solution**: 
- Ensure `.env` file exists with `DATABASE_URL`
- Verify database is running and accessible
- Check connection string format: `postgresql://user:password@host:port/database`

#### 2. Build Fails

**Problem**: Build errors during `npm run build`

**Solution**:
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npm run check`
- Ensure all dependencies are installed

#### 3. Port Already in Use

**Problem**: `Error: Port 5002 is already in use`

**Solution**:
- Change `PORT` in `.env` file
- Or kill the process using the port:
  ```bash
  # Linux/Mac
  lsof -ti:5002 | xargs kill
  
  # Windows
  netstat -ano | findstr :5002
  taskkill /PID <PID> /F
  ```

#### 4. Python Dependencies Error

**Problem**: Python packages not found

**Solution**:
- Ensure virtual environment is activated
- Reinstall requirements: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.9+)

#### 5. Static Files Not Serving

**Problem**: Frontend not loading in production

**Solution**:
- Ensure build completed: `npm run build`
- Check `dist/public` directory exists
- Verify `serveStatic` path in `server/vite.ts`

#### 6. CORS Errors

**Problem**: CORS policy blocking requests

**Solution**:
- Update CORS origins in `server/index.ts` with your domain
- Ensure credentials are properly configured

### Getting Help

- Check application logs
- Review error messages in browser console
- Verify all environment variables are set
- Test API endpoints individually
- Check database connectivity

## Production Best Practices

1. **Security**:
   - Use strong `SESSION_SECRET`
   - Enable HTTPS
   - Set secure cookie flags
   - Implement rate limiting
   - Validate all inputs

2. **Performance**:
   - Enable gzip compression
   - Use CDN for static assets
   - Implement caching strategies
   - Optimize database queries
   - Use connection pooling

3. **Monitoring**:
   - Set up error tracking (Sentry, etc.)
   - Monitor application performance
   - Track API usage
   - Set up alerts for critical errors

4. **Backup**:
   - Regular database backups
   - Version control for code
   - Document configuration changes

## Support

For issues or questions:
- Check the documentation in `/server/lib/*.md` files
- Review `API_KEYS_EXPLANATION.md` for API setup
- Check `ENV_SETUP.md` for environment configuration

