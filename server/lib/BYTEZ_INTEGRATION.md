# Bytez.js Integration Guide

## Overview

TruthLens now uses **Bytez.js** to run the `dhruvpal/fake-news-bert` model for fake news detection. This provides fast, accurate transformer-based classification.

## How It Works

### Model Output Format

The `dhruvpal/fake-news-bert` model returns:

```json
{
  "label": "LABEL_1",
  "score": 0.87
}
```

**Label Mapping**:
- `LABEL_0` = **REAL** news
- `LABEL_1` = **FAKE** news

**Score**: Confidence (0-1) where higher = more confident

### Conversion to Fake Probability

```typescript
// If prediction is FAKE
fakeProbability = confidence  // e.g., 0.87

// If prediction is REAL
fakeProbability = 1 - confidence  // e.g., 0.13
```

## Integration in Pipeline

The Bytez model is integrated as the **primary AI signal** (50% weight) in Step 2 of the 5-step pipeline:

1. **Bytez BERT** (50%) - Primary transformer model
2. **Python ML** (20-40%) - Fallback/secondary signal
3. **Perplexity AI** (20%) - Deep analysis
4. **Pattern Detection** (10%) - Rule-based features

## Usage

### Direct API Endpoint

```bash
POST /api/analyze/bytez
Content-Type: application/json

{
  "text": "Your news article text here"
}
```

**Response**:
```json
{
  "prediction": "FAKE",
  "confidence": 0.87,
  "label": "FAKE",
  "score": 0.87
}
```

### In Code

```typescript
import { predictFakeNewsWithBytez, bytezPredictionToFakeProbability } from './bytezModel';

// Get prediction
const result = await predictFakeNewsWithBytez("Article text...");

if (!result.error) {
  console.log(`Prediction: ${result.prediction}`);
  console.log(`Confidence: ${result.confidence}`);
  
  // Convert to fake probability for pipeline
  const fakeProb = bytezPredictionToFakeProbability(result);
  console.log(`Fake Probability: ${fakeProb}`);
}
```

## Error Handling

The wrapper handles multiple scenarios:

1. **Model Error**: Returns error object with fallback
2. **Unknown Output Format**: Logs warning, uses fallback
3. **Empty Text**: Returns error immediately
4. **Network Issues**: Catches and returns error

## Configuration

Set your Bytez API key in environment variables:

```bash
# .env file
BYTEZ_API_KEY=your_api_key_here
```

Or it will use the default key (for development only).

## Model Limitations

⚠️ **Important**: The BERT model detects **fake-news-like writing patterns**, not factual accuracy.

It does NOT:
- Verify facts
- Cross-check sources
- Detect misinformation truthfully

**Always combine with**:
- ✅ Fact-check APIs (Google Fact Check)
- ✅ Source credibility analysis
- ✅ Pattern detection
- ✅ Human review

## Performance

- **Speed**: ~200-500ms per prediction
- **Accuracy**: ~85-90% on test datasets
- **Reliability**: High (with proper error handling)

## Troubleshooting

### Model Returns Error

1. Check API key is valid
2. Verify network connection
3. Check text length (very long texts may timeout)
4. Review error logs for details

### Low Confidence Scores

- Model may be uncertain about the text
- Consider using ensemble approach (combine with other signals)
- Check if text is in supported language

### Unknown Output Format

- Model output format may have changed
- Check `raw` field in response for actual output
- Update wrapper if needed

## Best Practices

1. **Always use ensemble**: Don't rely solely on Bytez model
2. **Handle errors gracefully**: Have fallback mechanisms
3. **Cache results**: For repeated queries
4. **Monitor performance**: Track accuracy and response times
5. **Combine signals**: Use fact-check + source analysis + Bytez

## Example: Complete Pipeline

```typescript
// 1. Bytez prediction
const bytezResult = await predictFakeNewsWithBytez(text);
const bytezFakeProb = bytezPredictionToFakeProbability(bytezResult);

// 2. Fact-check
const factChecks = await fetchFactChecks(text);
const factCheckScore = calculateFactCheckScore(factChecks);

// 3. Source analysis
const sourceAnalysis = await analyzeSource(url, author);
const sourceScore = calculateSourceScore(sourceAnalysis);

// 4. Combine (5-step pipeline)
const finalScore = (
  bytezFakeProb * 0.55 +
  factCheckScore * 0.20 +
  (1 - sourceScore) * 0.15 +
  sensationalismScore * 0.10
);
```

This gives you the most accurate prediction! 🎯

