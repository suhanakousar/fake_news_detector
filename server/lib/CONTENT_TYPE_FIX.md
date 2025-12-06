# Content Type Detection Fix

## Problem Fixed

The system was treating **all inputs as factual news claims**, including:
- Opinions ("today is good day")
- Questions ("is today good?")
- Emotions ("I feel happy")

This caused incorrect labeling and inappropriate fact-checking.

## Solution

Added **content type detection** as Step 0, before any fake news analysis.

### Content Types

1. **OPINION** - Subjective statements, feelings, personal views
   - Example: "today is good day", "I think this is great"
   - **Action**: Bypass fake news detection, return "Not Applicable"

2. **QUESTION** - Questions that can't be fact-checked
   - Example: "Is today good?", "What happened?"
   - **Action**: Bypass fake news detection, return "Not Applicable"

3. **EMOTION** - Emotional expressions
   - Example: "I feel happy", "This makes me sad"
   - **Action**: Bypass fake news detection, return "Not Applicable"

4. **FACTUAL_CLAIM** - Verifiable factual statements
   - Example: "Earth orbits the Sun", "The population is 8 billion"
   - **Action**: Proceed with full fake news analysis

5. **NEWS_CLAIM** - News-like claims
   - Example: "PM announced new law", "Breaking: Scientists discover..."
   - **Action**: Proceed with full fake news analysis

6. **CONTEXT_REQUIRED** - Needs more information
   - Example: "December is rainy season" (needs location)
   - **Action**: Proceed with caution, mark as "misleading"

7. **UNKNOWN** - Could not determine
   - **Action**: Proceed with caution

## New Behavior

### Before Fix ❌
```
Input: "today is good day"
Output: REAL (25%) - with fact-checks, sources, credibility analysis
```

### After Fix ✅
```
Input: "today is good day"
Output: 
{
  classification: "real" (neutral),
  confidence: 0,
  explanation: "This statement expresses a personal opinion or feeling. 
               It does not make a factual claim that can be verified or debunked. 
               Fake news detection is not applicable to subjective statements."
}
```

## Classification Rules Updated

### "REAL" Classification
- **Before**: Default fallback when no evidence found
- **After**: Only when:
  - Low fake score (≤ 0.3) AND
  - Fact-check evidence exists AND
  - Average fact-check score > 0.7

### "MISLEADING" Classification
- **Before**: Only for uncertain cases
- **After**: Default for:
  - Low fake score but no evidence
  - No fact-checks found
  - Context required cases
  - Unverified content

## Test Cases

The system now correctly handles:

✅ `"today is good day"` → Not Applicable (Opinion)
✅ `"I feel happy"` → Not Applicable (Emotion)
✅ `"Is today good?"` → Not Applicable (Question)
✅ `"Earth is flat"` → False (Factual claim)
✅ `"Earth revolves around sun"` → True (Factual claim with evidence)
✅ `"December is rainy season"` → Context Required

## Implementation

- **File**: `server/lib/contentTypeDetector.ts`
- **Integration**: `server/lib/analyzer.ts` (Step 0)
- **Bypass Logic**: Opinions, questions, emotions skip fake news analysis entirely

## Benefits

1. ✅ No more false labeling of opinions as "REAL"
2. ✅ Appropriate responses for non-factual content
3. ✅ More accurate fact-checking (only on factual claims)
4. ✅ Better user experience (clear explanations)
5. ✅ Prevents misuse of fake news models on inappropriate content

