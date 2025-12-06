# Database Setup Guide

## ✅ Current Status

**The application now uses a REAL database!**

I've updated the storage implementation to use PostgreSQL via Drizzle ORM. The application will:

- ✅ **Use PostgreSQL** when `DATABASE_URL` is set
- ✅ **Fall back to in-memory storage** if `DATABASE_URL` is not set (for development/testing)

## 📊 Database Schema

The application uses **3 main tables**:

### 1. `users` Table
- Stores user accounts (username, email, password, role)
- Supports authentication and authorization
- Fields: `id`, `username`, `email`, `password`, `role`, `isActive`, `createdAt`

### 2. `analysis` Table
- Stores all fake news analysis results
- Links to users via `userId`
- Stores analysis results as JSON
- Fields: `id`, `userId`, `content`, `contentType`, `result`, `isFlagged`, `createdAt`

### 3. `feedback` Table
- Stores user feedback on analyses
- Links to users and analyses
- Fields: `id`, `userId`, `analysisId`, `content`, `createdAt`

## 🚀 Setup Instructions

### Step 1: Set Up PostgreSQL Database

**Option A: Local PostgreSQL**
```bash
# Install PostgreSQL (if not installed)
# Create database
createdb truthlens
```

**Option B: Cloud Database (Recommended)**
- **Neon** (https://neon.tech) - Free tier available
- **Supabase** (https://supabase.com) - Free tier available
- **Railway** (https://railway.app) - Free tier available

### Step 2: Configure Environment Variable

Add to your `.env` file:
```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**Examples:**
- Local: `postgresql://postgres:password@localhost:5432/truthlens`
- Neon: `postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/truthlens`
- Supabase: `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres`

### Step 3: Initialize Database Schema

```bash
# Push schema to database (creates tables)
npm run db:push
```

This will create all necessary tables in your database.

### Step 4: Verify Database Connection

```bash
# Start the application
npm run dev

# Check health endpoint
curl http://localhost:5002/api/health
```

## 🔄 Migration from In-Memory to Database

If you were using the app before (with in-memory storage):

1. **All existing data will be lost** - this is expected
2. **Users need to register again**
3. **Analysis history will be empty** - new analyses will be saved

## 🛠️ How It Works

The storage system automatically detects if `DATABASE_URL` is set:

```typescript
// Automatically uses database if DATABASE_URL is set
export const storage: IStorage = process.env.DATABASE_URL 
  ? new DatabaseStorage()  // Uses PostgreSQL
  : new MemStorage();     // Uses in-memory (fallback)
```

## 📝 Database Operations

All database operations are handled through the `storage` object:

- **Users**: `storage.getUser()`, `storage.createUser()`, etc.
- **Analyses**: `storage.saveAnalysis()`, `storage.getUserAnalyses()`, etc.
- **Feedback**: `storage.saveFeedback()`, `storage.getAnalysisFeedback()`, etc.

## ⚠️ Important Notes

1. **DATABASE_URL is required** for production deployment
2. **Always run `npm run db:push`** after setting up a new database
3. **Backup your database** regularly in production
4. **Never commit `.env` file** with real credentials

## 🐛 Troubleshooting

### Database Connection Error
```
Error: DATABASE_URL environment variable is not set
```
**Solution**: Add `DATABASE_URL` to your `.env` file

### Schema Not Found
```
Error: relation "users" does not exist
```
**Solution**: Run `npm run db:push` to create tables

### Connection Refused
```
Error: connect ECONNREFUSED
```
**Solution**: 
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Verify database exists
- Check firewall/network settings

## 📚 Additional Commands

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema (quick sync, no migration files)
npm run db:push
```

## ✅ Verification Checklist

- [ ] PostgreSQL database created
- [ ] `DATABASE_URL` set in `.env`
- [ ] Schema pushed (`npm run db:push`)
- [ ] Application starts without errors
- [ ] Health check returns 200
- [ ] Can register a new user
- [ ] Analysis results are saved

Your application is now using a real database! 🎉

