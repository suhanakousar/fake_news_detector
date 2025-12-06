#!/usr/bin/env node

/**
 * Setup script to create .env file from template
 * Run with: node setup-env.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envExample = `# Server Configuration
NODE_ENV=production
PORT=5002

# Database (PostgreSQL)
# Format: postgresql://user:password@host:port/database
# Examples:
# - Local: postgresql://postgres:password@localhost:5432/truthlens
# - Neon: postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/truthlens
# - Supabase: postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
DATABASE_URL=postgresql://user:password@localhost:5432/truthlens

# Session Secret (auto-generated below)
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}

# API Keys
# Bytez API - Already configured with default key
BYTEZ_API_KEY=349c88bd7835622d5760900f6b0f8a51

# Google Fact Check API
# Get from: https://developers.google.com/fact-check/tools/api
GOOGLE_FACT_CHECK_API_KEY=your_google_fact_check_api_key_here

# Gemini API (Optional - for AI-enhanced analysis)
# Get from: https://makersuite.google.com/app/apikey
# Note: System works without this, but with limited AI features
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
# Get from: https://console.firebase.google.com/
# Go to Project Settings > General > Your apps
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
`;

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// Create .env.example
if (!fs.existsSync(envExamplePath)) {
  fs.writeFileSync(envExamplePath, envExample);
  console.log('✅ Created .env.example file');
} else {
  console.log('ℹ️  .env.example already exists');
}

// Create .env if it doesn't exist
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample);
  console.log('✅ Created .env file with default values');
  console.log('⚠️  Please update .env with your actual configuration values!');
  console.log('   - Set DATABASE_URL to your PostgreSQL connection string');
  console.log('   - Add your API keys (optional but recommended)');
} else {
  console.log('ℹ️  .env file already exists, skipping creation');
  console.log('   If you want to regenerate, delete .env and run this script again');
}

console.log('\n📝 Next steps:');
console.log('   1. Edit .env file with your configuration');
console.log('   2. Set up PostgreSQL database');
console.log('   3. Run: npm run db:push');
console.log('   4. Run: npm run dev');

