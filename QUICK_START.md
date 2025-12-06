# TruthLens Quick Start Guide

Get TruthLens up and running in minutes!

## 🚀 Quick Start (5 minutes)

### Option 1: Docker (Easiest)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd AuthenticCreative1

# 2. Create .env file (copy from .env.example)
# Edit .env with your database and API keys

# 3. Start everything
docker-compose up -d

# 4. Initialize database
docker-compose exec app npm run db:push

# Done! Visit http://localhost:5002
```

### Option 2: Local Development

```bash
# 1. Install Node.js dependencies
npm install

# 2. Set up Python environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
pip install -r requirements.txt

# 3. Set up PostgreSQL database
# Create a database named 'truthlens'
# Update DATABASE_URL in .env file

# 4. Create .env file
# Copy .env.example to .env and fill in values

# 5. Initialize database
npm run db:push

# 6. Start development server
npm run dev

# Done! Visit http://localhost:5002
```

## 📝 Required Environment Variables

Minimum required variables in `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/truthlens
SESSION_SECRET=your-random-secret-here
```

**Optional but recommended:**
- `GOOGLE_FACT_CHECK_API_KEY` - For fact-checking features
- `GEMINI_API_KEY` - For enhanced AI analysis
- Firebase credentials - For authentication

## 🗄️ Database Setup

### Using Docker (Recommended)

```bash
docker-compose up -d postgres
```

### Using Local PostgreSQL

```bash
# Create database
createdb truthlens

# Or using psql
psql -U postgres
CREATE DATABASE truthlens;
```

### Using Cloud Database (Free Options)

1. **Neon** (https://neon.tech)
   - Sign up for free
   - Create a new project
   - Copy the connection string to `DATABASE_URL`

2. **Supabase** (https://supabase.com)
   - Sign up for free
   - Create a new project
   - Go to Settings > Database
   - Copy connection string to `DATABASE_URL`

## ✅ Verify Installation

1. **Check server is running:**
   ```bash
   curl http://localhost:5002/api/health
   ```
   Should return: `{"status":"healthy",...}`

2. **Check frontend:**
   - Open http://localhost:5002 in browser
   - You should see the TruthLens homepage

3. **Test API:**
   ```bash
   curl -X POST http://localhost:5002/api/analyze/text \
     -H "Content-Type: application/json" \
     -d '{"text": "This is a test news article"}'
   ```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file
PORT=3000
```

### Database Connection Error
- Verify PostgreSQL is running
- Check `DATABASE_URL` format: `postgresql://user:pass@host:port/db`
- Ensure database exists

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules dist
npm install
npm run build
```

### Python Errors
```bash
# Reinstall Python dependencies
pip install --upgrade -r requirements.txt
```

## 📚 Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
- Check [ENV_SETUP.md](./ENV_SETUP.md) for API key setup
- Review [API_KEYS_EXPLANATION.md](./API_KEYS_EXPLANATION.md) for API details

## 🆘 Need Help?

1. Check the logs: `docker-compose logs -f` (if using Docker)
2. Review error messages in browser console
3. Verify all environment variables are set
4. Check database connectivity

Happy deploying! 🎉

