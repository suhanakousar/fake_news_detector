# Fake News Ensemble Model Integration

## Overview

This document describes the integration of the ensemble ML models from `fakenews-main` into the TruthLens application.

## Architecture

The integration uses a Python script (`predict.py`) that wraps the ensemble models and provides predictions in the format expected by the TypeScript analyzer.

### Models Used

1. **Random Forest** (`rfmodel.pkl`) - 23MB
2. **Bernoulli Naive Bayes** (`modelbnb.pkl`) - 99MB
3. **Decision Tree Classifier** (`modelDTC.pkl`) - 2.1KB
4. **PCA-based Model** (`model2.pkl`) - 40KB
5. **TF-IDF Vectorizer** (`tfidfvect2.pkl`) - 53MB

### Ensemble Strategy

The system uses a **voting ensemble** approach:
- Each model predicts 0 (FAKE) or 1 (REAL)
- Final prediction = average of all 4 model predictions
- If average < 0.5 → FAKE, else → REAL
- Confidence is calculated from probability scores of models that support it

## Integration Points

### 1. Python Script (`server/lib/predict.py`)

The main prediction script that:
- Loads all models on first use (lazy loading)
- Preprocesses text (removes non-alphabetic, lowercase, stopwords, stemming)
- Runs ensemble prediction
- Converts output to LIAR dataset scale (0-5) expected by analyzer

**Input**: Text string via command-line argument
**Output**: JSON array `[prediction, confidence]`
- `prediction`: 0-5 scale (0 = fake, 5 = real)
- `confidence`: 0-1 scale

### 2. TypeScript Integration (`server/lib/analyzer.ts`)

The analyzer calls the Python script via subprocess:
```typescript
const [pythonPred, pythonConf] = await getPythonModelPrediction(text);
const pythonFakeProb = pythonPredictionToFakeProbability(pythonPred);
```

The Python model is used as:
- **Primary signal** (40% weight) if Bytez BERT fails
- **Secondary signal** (20% weight) if Bytez BERT succeeds

### 3. Model Files Location

Models are stored in `server/lib/fakenews-models/`:
- `rfmodel.pkl`
- `modelbnb.pkl`
- `modelDTC.pkl`
- `model2.pkl`
- `tfidfvect2.pkl`

The script also checks these fallback locations:
1. `server/lib/fakenews-models/` (primary)
2. `fakenews-main/` (original location)
3. Current working directory

## Text Preprocessing

The preprocessing pipeline matches the original Flask app:

1. **Remove non-alphabetic characters**: `re.sub('[^a-zA-Z]', ' ', text)`
2. **Lowercase conversion**
3. **Tokenization**: Split into words
4. **Stopword removal**: Remove English stopwords
5. **Stemming**: Apply Porter Stemmer
6. **Rejoin**: Convert back to string
7. **Vectorization**: Apply TF-IDF vectorizer

## Output Format

### LIAR Dataset Scale (0-5)

The prediction is converted to the LIAR dataset scale:
- **0** = pants-on-fire (very fake)
- **1** = false
- **2** = barely-true
- **3** = half-true
- **4** = mostly-true
- **5** = true (very real)

### Conversion to Fake Probability

The analyzer converts the 0-5 scale to 0-1 fake probability:
```typescript
function pythonPredictionToFakeProbability(prediction: number): number {
  return 1 - (prediction / 5);
}
```

## Error Handling

The script includes robust error handling:

1. **Model loading errors**: Falls back to neutral prediction (3, 0.5)
2. **Prediction errors**: Catches exceptions and returns fallback
3. **Missing models**: Provides clear error message
4. **Empty input**: Returns neutral prediction

## Performance Considerations

- **Lazy loading**: Models are loaded only once on first use
- **Model size**: Total ~175MB (models are large but loaded once)
- **Processing time**: ~1-2 seconds per prediction (depends on text length)

## Testing

To test the integration:

```bash
# Test the Python script directly
python server/lib/predict.py "This is a test news article about current events."

# Expected output: [prediction, confidence] as JSON
# Example: [3, 0.75]
```

## Dependencies

Required Python packages (in `requirements.txt`):
- `nltk` - For stopwords and stemming
- `numpy` - For numerical operations
- `scikit-learn` - For ML models
- `pickle` - Built-in for model loading

## Bug Fixes Applied

1. **Fixed `html_scraper.py`**: Changed `dateify[...]` to `dateify(...)` on line 54
2. **Fixed Random Forest probability**: Correctly extracts probability from `predict_proba()` array
3. **Added error handling**: Comprehensive try-catch blocks
4. **Fixed model loading**: Proper path resolution for model files

## Future Improvements

1. **Model caching**: Cache predictions for identical text
2. **Async loading**: Load models in background on server startup
3. **Model versioning**: Support multiple model versions
4. **Performance optimization**: Optimize preprocessing pipeline
5. **Batch predictions**: Support multiple texts at once

