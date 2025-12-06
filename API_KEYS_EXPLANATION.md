# API Keys Explanation

## Why "API key not available" appears

The message "API key not available. Using basic analysis." comes from the **Gemini API** (used for AI-enhanced analysis, chatbot, and perplexity analysis), NOT from Google Fact Check API.

### Current API Keys Status

✅ **Google Fact Check API**: Configured (`AIzaSyC2Orfz4hzUdFUd3KAD9IHj1wkxRKtMWH4`)
✅ **Bytez API**: Configured (`349c88bd7835622d5760900f6b0f8a51`)
❌ **Gemini API**: Not configured (optional)

### What Each API Does

1. **Google Fact Check API** (`GOOGLE_FACT_CHECK_API_KEY`)
   - Queries fact-checking databases
   - Returns verified fact-check results
   - ✅ **Currently configured**

2. **Bytez API** (`BYTEZ_API_KEY`)
   - Runs BERT model for fake news detection
   - Primary AI model
   - ✅ **Currently configured**

3. **Gemini API** (`GEMINI_API_KEY`)
   - Used for AI-enhanced analysis (perplexity analysis, article summarization, chatbot responses)
   - Provides deep text analysis using Google's Gemini model
   - ⚠️ **Optional** - system works without it
   - Shows "API key not available" if missing (this is normal)

### How to Fix the Message (Optional)

If you want to remove the "API key not available" message, you can:

1. **Get a Gemini API key** (free):
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key
   - Add to `.env` file:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```
   - **Note**: The code also supports `HUGGINGFACE_API_KEY` for backward compatibility, but `GEMINI_API_KEY` is preferred.

2. **OR** - The message is harmless. The system works fine without it, using pattern-based analysis instead.

### Current Behavior

- ✅ Google Fact Check API: Working
- ✅ Bytez BERT Model: Working  
- ⚠️ Gemini API: Not configured (optional, uses fallback)

The system will still:
- Detect fake news using BERT
- Check facts using Google Fact Check
- Analyze patterns and features
- Provide accurate results

The "API key not available" message just means it's using a simpler analysis method instead of the advanced Gemini AI.

