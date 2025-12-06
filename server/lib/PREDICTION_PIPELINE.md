# Fake News Prediction Pipeline - Implementation Guide

## Overview

This document explains how TruthLens predicts whether news is fake or not using a comprehensive 5-step pipeline.

## The 5-Step Prediction Pipeline

### Step 1: Content Extraction ✅
- **Text Input**: Direct text string
- **URL Input**: Extracts article text, title, meta description, and author
- **Image Input**: OCR text extraction
- **Document Input**: PDF/Word document text extraction

**Output**: Clean article text ready for analysis

---

### Step 2: AI Model Analysis (55% weight)

Combines multiple AI signals:

#### 2a. Bytez BERT Model (50% of AI weight) - PRIMARY
- Uses `dhruvpal/fake-news-bert` via Bytez.js
- Returns `LABEL_0` (REAL) or `LABEL_1` (FAKE) with confidence score
- Handles multiple output formats automatically
- Fast and reliable transformer-based classification

#### 2b. Python ML Model (20-40% of AI weight) - FALLBACK
- Uses `predict.py` to run trained fake news classifier
- Returns prediction on 0-5 scale (0 = fake, 5 = real)
- Converts to fake probability: `1 - (prediction / 5)`
- Used as secondary signal or fallback if Bytez fails

#### 2c. Perplexity Analysis (20% of AI weight)
- Uses Gemini API for deep text analysis
- Returns confidence score (0-1) where higher = more fake

#### 2d. Pattern Detection (10% of AI weight)
- Extracts text features (suspicious words, exclamations, etc.)
- Calculates sensationalism score
- Detects clickbait patterns

**Final AI Score**: Weighted average of all available signals

---

### Step 3: Source Analysis (15% weight)

Analyzes URL/domain reputation:

- **Domain Reputation**: Checks against whitelist/blacklist
- **HTTPS**: Penalizes non-HTTPS sites
- **Domain Age**: New domains (< 30 days) are suspicious
- **Author Analysis**: Checks if author exists and looks professional
- **TLD Analysis**: Common TLDs (.com, .org) get slight bonus

**Source Score**: Converted to fake probability (inverse of reputation)

---

### Step 4: Fact-Check Integration (20% weight)

- Queries Google Fact Check API
- Extracts ratings: "false", "true", "misleading", etc.
- Converts ratings to numeric scores:
  - "false" / "pants-on-fire" → 0.1 (very fake)
  - "misleading" / "half-true" → 0.4 (misleading)
  - "true" / "mostly-true" → 0.9 (likely real)
- Calculates average fact-check score

**Fact-Check Score**: Already in fake probability format

---

### Step 5: Final Ensemble Score

**Formula**:
```
FINAL_FAKE_SCORE = 
  0.55 × AI_MODEL_FAKE_PROB +
  0.20 × FACT_CHECK_SCORE +
  0.15 × SOURCE_REPUTATION_SCORE +
  0.10 × SENSATIONALISM_SCORE
```

**Classification**:
- `FINAL_SCORE >= 0.6` → **FAKE**
- `FINAL_SCORE <= 0.4` → **REAL**
- `0.4 < FINAL_SCORE < 0.6` → **MISLEADING**

---

## Feature Extraction

The system extracts comprehensive features from text:

### Textual Features
- Character/word/sentence counts
- Average word length
- Stopword ratio
- Uppercase ratio (clickbait indicator)
- Exclamation/question counts
- Suspicious keyword detection
- Emotional word counts
- Claim indicators ("studies show", "proven", etc.)
- Lexical diversity

### Pattern Features
- Sensationalism score (0-1)
- Unreliable source phrases
- Suspicious word patterns

---

## File Structure

```
server/lib/
├── analyzer.ts              # Main 5-step pipeline
├── bytezModel.ts            # Bytez.js BERT model wrapper
├── featureExtractor.ts      # Text feature extraction
├── sourceAnalyzer.ts        # URL/domain analysis
├── factCheck.ts             # Fact-check API integration
├── perplexityAnalyzer.ts    # AI analysis via Gemini API
├── predict.py               # Python ML model (fallback)
└── urlAnalyzer.ts           # URL content extraction
```

---

## Usage Example

```typescript
import { analyzeText } from './analyzer';

// Text-only analysis
const result = await analyzeText(
  "Breaking: Scientists discover shocking secret...",
  "en"
);

// With URL and author (enables source analysis)
const result = await analyzeText(
  "Article text here...",
  "en",
  "https://example.com/article",
  "John Doe"
);

// Result structure
{
  classification: "fake" | "real" | "misleading",
  confidence: 0.72,  // 0-1 scale
  explanation: "Detailed explanation...",
  sources: [...],    // Fact-check sources
  patterns: {
    sensationalist: 5,
    unreliableSource: 2,
    unverifiedClaims: 3
  }
}
```

---

## Improving Accuracy

### 1. Train Better ML Models
- Use larger datasets (LIAR, FakeNewsNet)
- Fine-tune BERT/RoBERTa models
- Train on domain-specific data

### 2. Enhance Source Analysis
- Implement actual WHOIS lookups
- Build larger whitelist/blacklist
- Add social media verification

### 3. Improve Fact-Checking
- Integrate multiple fact-check APIs
- Add Snopes, PolitiFact APIs
- Build internal fact-check database

### 4. Feature Engineering
- Add more sophisticated NLP features
- Implement sentence embeddings
- Add topic modeling features

---

## Testing

Test the pipeline with known examples:

```typescript
// Known fake news
const fakeNews = "SHOCKING! Government hiding secret cure!";
const result1 = await analyzeText(fakeNews, "en");
// Expected: classification = "fake", confidence > 0.6

// Known real news
const realNews = "According to Reuters, the economy grew 2% this quarter.";
const result2 = await analyzeText(realNews, "en", "https://reuters.com/article");
// Expected: classification = "real", confidence < 0.4
```

---

## Performance Considerations

- **Caching**: Cache fact-check results and source analysis
- **Async Processing**: Heavy operations (WHOIS, reverse image search) should be async
- **Rate Limiting**: Implement rate limits for external APIs
- **Fallbacks**: Always have fallback mechanisms if APIs fail

---

## Environment Variables

Add to your `.env` file:

```bash
BYTEZ_API_KEY=your_bytez_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_FACT_CHECK_API_KEY=your_google_fact_check_key_here
```

Note: `HUGGINGFACE_API_KEY` is also supported for backward compatibility, but `GEMINI_API_KEY` is preferred.

## Testing Bytez Model Directly

You can test the Bytez model independently:

```bash
POST /api/analyze/bytez
{
  "text": "SHOCKING! Government hiding secret cure!"
}

Response:
{
  "prediction": "FAKE",
  "confidence": 0.87,
  "label": "FAKE",
  "score": 0.87
}
```

## Next Steps

1. ✅ Implemented 5-step pipeline
2. ✅ Feature extraction
3. ✅ Source analysis
4. ✅ Fact-check integration
5. ✅ Bytez BERT model integration
6. ⏳ Train/improve Python ML model
7. ⏳ Add more fact-check sources
8. ⏳ Implement caching layer
9. ⏳ Add monitoring and logging

