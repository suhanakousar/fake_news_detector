# Test News Examples for Fake News Detection

## ✅ Legitimate News Articles

### Example 1: Space Station (Current Test Case)
```
The International Space Station successfully completed its 25th year in orbit today. NASA officials announced that the station has hosted over 3,000 research experiments and has been continuously occupied by astronauts since 2000. The station serves as a microgravity laboratory where scientists conduct experiments in biology, physics, astronomy, and other fields.
```

### Example 2: Technology News
```
Apple Inc. announced today that it will release its latest iPhone model next month. The company stated that the new device features improved battery life and enhanced camera capabilities. Pre-orders will begin next week through the company's official website and authorized retailers.
```

### Example 3: Health News
```
The World Health Organization released new guidelines today recommending at least 150 minutes of moderate physical activity per week for adults. The guidelines are based on extensive research from multiple studies involving over 100,000 participants worldwide.
```

### Example 4: Economic News
```
The Federal Reserve announced today that it will maintain current interest rates following its monthly policy meeting. Economists had predicted this decision based on recent inflation data showing a gradual decrease in consumer prices.
```

### Example 5: Science News
```
Researchers at MIT published a study in Nature journal showing promising results for a new cancer treatment. The study involved 200 patients over two years and showed a 40% improvement in survival rates compared to standard treatments.
```

---

## ❌ Fake/Misleading News Articles

### Example 6: Sensationalist Fake News
```
SHOCKING! Scientists discover SECRET that will BLOW YOUR MIND! They don't want you to know this revolutionary discovery that will change everything! Click now to learn the truth they're hiding from you!
```

### Example 7: Conspiracy Theory
```
BREAKING: Anonymous insider reveals that the government has been hiding the truth about alien contact for decades. Multiple sources confirm that NASA has been covering up evidence of extraterrestrial life. This explosive revelation will change everything you thought you knew.
```

### Example 8: Medical Misinformation
```
Doctors are FURIOUS! This one simple trick cures all diseases instantly! Big Pharma doesn't want you to know about this miracle remedy that costs only $5. Thousands of people have already been cured - see their testimonials now!
```

### Example 9: Political Misinformation
```
EXCLUSIVE: Leaked documents reveal that top politicians are involved in a massive cover-up. Anonymous sources say this will be the biggest scandal in history. Share this before they delete it!
```

### Example 10: Financial Scam
```
GUARANTEED! Make $10,000 in 24 hours with this proven method! No investment required! Thousands of people are already making money. This secret method is so effective that banks don't want you to know about it!
```

---

## ⚠️ Borderline/Context-Dependent Examples

### Example 11: Opinion Piece
```
In my opinion, the current economic policies are not working as effectively as they could. While some experts disagree, I believe we need to reconsider our approach to fiscal management.
```

### Example 12: Satire (Should be identified as non-factual)
```
Breaking: Local man discovers that his pet goldfish is actually a secret agent working for an underwater government. The fish has been gathering intelligence for months, according to sources close to the aquarium.
```

### Example 13: Question/Inquiry
```
Is it true that the new policy will affect everyone? I've heard conflicting information and want to verify the facts before making any decisions.
```

---

## 📊 Expected Results

### Legitimate News (Examples 1-5)
- **Expected**: REAL or MOSTLY-TRUE
- **Confidence**: Should be moderate to high
- **Fake Probability**: Low (0-40%)

### Fake News (Examples 6-10)
- **Expected**: FAKE or FALSE
- **Confidence**: Should be moderate to high
- **Fake Probability**: High (60-100%)

### Borderline (Examples 11-13)
- **Expected**: May be flagged as opinion/question/satire
- **System should**: Recognize these as non-factual content types

---

## 🧪 Testing Instructions

### Test Individual Examples

```bash
# Test legitimate news
python server/lib/predict.py "Your example text here"

# Test via API (when server is running)
curl -X POST http://localhost:5002/api/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "Your example text here", "language": "en"}'
```

### Test Multiple Examples

You can use the test script:
```bash
python server/lib/test_predict.py
```

---

## 📝 Notes

1. **Short Text**: Very short articles (< 50 words) may be harder to classify accurately
2. **Context**: Some legitimate news may be misclassified if it lacks context
3. **Sensationalism**: Articles with excessive capitalization and exclamation marks are often fake
4. **Sources**: Always verify claims with multiple reliable sources
5. **Model Limitations**: The models are trained on specific datasets and may not catch all types of misinformation

---

## 🔍 Current Issue: ISS Article False Positive

The ISS article (Example 1) is being incorrectly classified as FAKE by the BERT model. This is a known issue with:
- Short, factual articles
- Technical/scientific content
- Content without sensationalist language

**Solution**: The Python ensemble models should help correct this. If they don't, consider:
1. Using longer text with more context
2. Adding source information
3. Combining with fact-checking APIs
4. Manual review for borderline cases

