# Environment Variables Setup

## Bytez API Key

The Bytez API key is already configured in the code with the default value:
```
349c88bd7835622d5760900f6b0f8a51
```

## Optional: Use Environment Variable

For better security, you can create a `.env` file in the root directory:

```bash
# .env file
BYTEZ_API_KEY=349c88bd7835622d5760900f6b0f8a51
```

The code will automatically use the environment variable if it exists, otherwise it will use the default key.

## Other Environment Variables

You can also set these optional variables:

```bash
# Gemini API Key (for AI-enhanced analysis, chatbot, and perplexity analysis)
# Get your key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_key_here

# Note: HUGGINGFACE_API_KEY is also supported for backward compatibility
# but GEMINI_API_KEY is preferred

# Google Fact Check API Key
GOOGLE_FACT_CHECK_API_KEY=your_key_here

# Database URL (PostgreSQL)
DATABASE_URL=your_database_url_here

# Session Secret (for authentication)
SESSION_SECRET=your_secret_here

# Server Port (optional, defaults to 5002)
PORT=5002

# Node Environment
NODE_ENV=development
```

## Current Configuration

✅ **Bytez API Key**: Already set in code (no .env file needed)
✅ **Model**: `dhruvpal/fake-news-bert`
✅ **Ready to use**: The system will work immediately with the default key

## Testing

You can test the Bytez integration immediately:

```bash
# Start the server
npm run dev

# Test the Bytez endpoint
curl -X POST http://localhost:5002/api/analyze/bytez \
  -H "Content-Type: application/json" \
  -d '{"text": "SHOCKING! Government hiding secret cure!"}'
```

The system is ready to use! 🚀

