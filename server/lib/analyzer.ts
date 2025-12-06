import type { AnalysisResult } from "@shared/schema";
import { fetchFactChecks, calculateFactCheckScore, filterRelevantFactChecks } from "./factCheck";
import { analyzeWithPerplexity } from "./perplexityAnalyzer";
import { enhanceAnalysisWithAI } from "./aiEnhancer";
import { spawn } from 'child_process';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { FactCheck } from "./factCheck";
import { extractTextFeatures, calculateSensationalismScore } from "./featureExtractor";
import { analyzeSentiment } from "./sentimentAnalyzer";
import { analyzeSource, calculateSourceScore } from "./sourceAnalyzer";
import { 
  detectContentType, 
  shouldBypassFakeNewsDetection, 
  getNonFactualResponse 
} from "./contentTypeDetector";
import { predictFakeNewsWithBytez, bytezPredictionToFakeProbability } from "./bytezModel";

/**
 * Helper function to run Python model predictions
 * Returns [prediction, confidence] where prediction is 0-5 scale
 */
async function getPythonModelPrediction(text: string): Promise<[number, number]> {
  return new Promise((resolve, reject) => {
    // Get current directory for ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    // Try python3 first, then python (for cross-platform compatibility)
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    const pythonProcess = spawn(pythonCmd, [
      path.join(__dirname, 'predict.py'),
      text
    ], {
      env: { ...process.env, PYTHONUNBUFFERED: '1' } // Ensure unbuffered output
    });

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.warn(`Python model prediction failed: ${error}. Using fallback prediction.`);
        // Return a neutral prediction when model is not available
        resolve([3, 0.5]); // 3 is "half-true" with 50% confidence
        return;
      }

      try {
        const [prediction, confidence] = JSON.parse(result);
        resolve([prediction, confidence]);
      } catch (error: unknown) {
        console.warn(`Failed to parse Python output: ${error}. Using fallback prediction.`);
        // Return a neutral prediction on parsing error
        resolve([3, 0.5]);
      }
    });
  });
}

/**
 * Convert Python model prediction (0-5 scale) to fake probability (0-1)
 * 0 = "pants-on-fire" (very fake) -> 1.0 fake probability
 * 5 = "true" (very real) -> 0.0 fake probability
 */
function pythonPredictionToFakeProbability(prediction: number): number {
  // Map 0-5 scale to 0-1 fake probability (inverse)
  // Lower prediction number = higher fake probability
  return 1 - (prediction / 5);
}

/**
 * Check if text is too short for BERT model
 * BERT fake-news models were trained on long articles, not short sentences
 */
function isTooShortForBERT(text: string): boolean {
  const wordCount = text.trim().split(/\s+/).length;
  return wordCount < 8; // Hard rule: less than 8 words = disable BERT
}

/**
 * Get AI model fake probability from multiple sources
 * Combines Bytez BERT model, Python model (fallback), Perplexity analysis, and pattern detection
 * IMPORTANT: BERT is disabled for short claims and context-dependent statements
 */
async function getAIModelFakeProbability(
  text: string, 
  language: string,
  isContextDependent: boolean = false
): Promise<{ probability: number; explanation: string }> {
  try {
    const aiSignals: Array<{ prob: number; weight: number; name: string }> = [];
    const explanations: string[] = [];
    
    // CRITICAL: Do not use BERT for short claims or context-dependent statements
    const tooShort = isTooShortForBERT(text);
    const shouldUseBERT = !tooShort && !isContextDependent;
    
    // Step 1: Try Bytez BERT model (primary AI model) - ONLY if appropriate
    if (shouldUseBERT) {
      try {
        const bytezResult = await predictFakeNewsWithBytez(text);
        if (!bytezResult.error) {
          const bytezFakeProb = bytezPredictionToFakeProbability(bytezResult);
          aiSignals.push({
            prob: bytezFakeProb,
            weight: 0.5, // 50% weight for Bytez BERT model
            name: 'Bytez BERT'
          });
          explanations.push(
            `BERT model classified as ${bytezResult.prediction} with ${(bytezResult.confidence * 100).toFixed(0)}% confidence`
          );
        } else {
          console.warn('Bytez model failed, using fallback:', bytezResult.message);
        }
      } catch (error) {
        console.warn('Bytez model error:', error);
      }
    } else {
      if (tooShort) {
        explanations.push('BERT model skipped: claim is too short (BERT trained on long articles, not short sentences)');
      }
      if (isContextDependent) {
        explanations.push('BERT model skipped: claim is context-dependent and requires geographic/time context');
      }
    }
    
    // Step 2: Try Python ML model (fallback if Bytez fails)
    try {
      const [pythonPred, pythonConf] = await getPythonModelPrediction(text);
      const pythonFakeProb = pythonPredictionToFakeProbability(pythonPred);
      
      // Use Python model only if Bytez failed or as secondary signal
      if (aiSignals.length === 0) {
        aiSignals.push({
          prob: pythonFakeProb,
          weight: 0.4,
          name: 'Python ML'
        });
        if (pythonConf > 0.6) {
          explanations.push(
            `Python model predicted ${pythonFakeProb > 0.6 ? 'fake' : 'real'} with ${(pythonConf * 100).toFixed(0)}% confidence`
          );
        }
      } else {
        // Use as secondary signal with lower weight
        aiSignals.push({
          prob: pythonFakeProb,
          weight: 0.2,
          name: 'Python ML'
        });
      }
    } catch (error) {
      console.warn('Python model error:', error);
    }
    
    // Step 3: Get Perplexity analysis
    try {
      const perplexityResults = await analyzeWithPerplexity(text, language);
      const perplexityFakeProb = perplexityResults.confidence;
      aiSignals.push({
        prob: perplexityFakeProb,
        weight: 0.2,
        name: 'Perplexity AI'
      });
      if (perplexityResults.explanation) {
        explanations.push(perplexityResults.explanation);
      }
    } catch (error) {
      console.warn('Perplexity analysis error:', error);
    }
    
    // Step 4: Extract features and calculate pattern-based score
    const features = extractTextFeatures(text);
    const sensationalismScore = calculateSensationalismScore(features);
    aiSignals.push({
      prob: sensationalismScore,
      weight: 0.1,
      name: 'Pattern Detection'
    });
    
    if (features.suspiciousWordCount > 0) {
      explanations.push(
        `Detected ${features.suspiciousWordCount} suspicious keywords: ${features.suspiciousWords.slice(0, 3).join(', ')}`
      );
    }
    
    // Calculate weighted average of all AI signals
    let totalWeight = 0;
    let weightedSum = 0;
    
    aiSignals.forEach(signal => {
      weightedSum += signal.prob * signal.weight;
      totalWeight += signal.weight;
    });
    
    // Normalize by total weight
    const aiFakeProbability = totalWeight > 0 
      ? weightedSum / totalWeight 
      : sensationalismScore; // Fallback to pattern detection
    
    return {
      probability: Math.max(0, Math.min(1, aiFakeProbability)),
      explanation: explanations.join('. ') || 'AI analysis completed using pattern detection'
    };
  } catch (error) {
    console.error('Error in AI model prediction:', error);
    // Fallback to basic pattern detection
    const features = extractTextFeatures(text);
    const sensationalismScore = calculateSensationalismScore(features);
    
    return {
      probability: sensationalismScore,
      explanation: 'Using pattern-based analysis due to AI model unavailability'
    };
  }
}

/**
 * THE 5-STEP PREDICTION PIPELINE FOR FAKE NEWS DETECTION
 * 
 * Step 1: Extract content (already done - text is provided)
 * Step 2: Analyze content using AI models
 * Step 3: Analyze source (if URL provided)
 * Step 4: Get fact-check results
 * Step 5: Combine all signals into final prediction
 * 
 * @param text The text to analyze
 * @param language The language code (e.g., 'en', 'es', 'fr') of the text
 * @param url Optional URL for source analysis
 * @param author Optional author name for source analysis
 */
export async function analyzeText(
  text: string, 
  language: string = 'en',
  url?: string,
  author?: string
): Promise<AnalysisResult> {
  try {
    // STEP 0: Detect content type FIRST (before any fake news analysis)
    const cleanText = text.trim();
    if (!cleanText || cleanText.length === 0) {
      throw new Error("Text content is required for analysis");
    }

    const contentTypeResult = detectContentType(cleanText);
    
    // If it's an opinion, question, or emotion, return appropriate response
    if (shouldBypassFakeNewsDetection(contentTypeResult.type)) {
      return getNonFactualResponse(contentTypeResult.type, contentTypeResult.explanation);
    }

    // For context-required types, return special response without full fake news analysis
    if (contentTypeResult.type === "CONTEXT_REQUIRED") {
      return getNonFactualResponse(contentTypeResult.type, contentTypeResult.explanation);
    }

    // For factual/news claims, proceed with full analysis
    // Unknown types will also proceed but with caution

    // STEP 2: Analyze CONTENT using AI models
    // Pass context-dependent flag to disable BERT for context-dependent claims
    const isContextDep = contentTypeResult.type === "CONTEXT_REQUIRED";
    const aiAnalysis = await getAIModelFakeProbability(cleanText, language, isContextDep);
    const aiFakeProb = aiAnalysis.probability;

    // STEP 3: Analyze SOURCE (URL/domain reputation)
    let sourceFakeProb = 0.5; // Default neutral
    let sourceExplanation = '';
    let sourceCredibility: { name: string; score: number; level: 'high' | 'medium' | 'low' } | undefined;
    let sourceAnalysis: any = null; // Store for later use in final assessment
    
    if (url) {
      sourceAnalysis = await analyzeSource(url, author);
      const sourceScore = calculateSourceScore(sourceAnalysis);
      // Convert source reputation to fake probability (inverse)
      sourceFakeProb = 1 - sourceScore; // Lower reputation = higher fake probability
      
      // Determine credibility level
      let level: 'high' | 'medium' | 'low';
      if (sourceScore >= 0.7) {
        level = 'high';
      } else if (sourceScore >= 0.4) {
        level = 'medium';
      } else {
        level = 'low';
      }
      
      sourceCredibility = {
        name: sourceAnalysis.domain || 'Unknown source',
        score: sourceScore,
        level: level
      };
      
      if (sourceAnalysis.isKnownUnreliable) {
        sourceExplanation = `Source is from a known unreliable domain (${sourceAnalysis.domain}). `;
      } else if (sourceAnalysis.isKnownReliable) {
        sourceExplanation = `Source is from a reputable news outlet (${sourceAnalysis.domain}). `;
      } else {
        // Only show HTTPS warning for unknown sources, not reliable ones
        if (!sourceAnalysis.isHttps) {
          sourceExplanation = `Source does not use HTTPS encryption. `;
        }
      }
      
      if (sourceAnalysis.domainAgeDays !== null && sourceAnalysis.domainAgeDays < 30) {
        sourceExplanation += `Domain is very new (${sourceAnalysis.domainAgeDays} days old). `;
      }
    } else {
      // No URL provided - set to medium/unknown instead of low
      sourceCredibility = {
        name: 'Unknown source',
        score: 0.5,
        level: 'medium'
      };
    }

    // STEP 4: Get FACT-CHECK results
    let factCheckFakeProb = 0.5; // Default neutral
    let factCheckExplanation = '';
    const factChecks = await fetchFactChecks(cleanText);
    
    // Debug: Log fact checks found
    console.log(`[FACT CHECKS] Retrieved ${factChecks.length} fact checks`);
    if (factChecks.length > 0) {
      console.log(`[FACT CHECKS] Details:`, JSON.stringify(factChecks.map(fc => ({ 
        source: fc.source, 
        title: fc.title?.substring(0, 50), 
        snippet: fc.snippet?.substring(0, 50),
        url: fc.url 
      })), null, 2));
    }
    
    // Filter fact checks for relevance to the actual content
    const relevantFactChecks = factChecks.length > 0 
      ? filterRelevantFactChecks(factChecks, cleanText)
      : [];
    
    if (relevantFactChecks.length > 0) {
      // Calculate fact-check score (0-1, where 0 = false/fake, 1 = true/real)
      const factCheckScore = calculateFactCheckScore(relevantFactChecks);
      factCheckFakeProb = factCheckScore; // Already converted to fake probability
      
      // Build explanation from fact-check results - be more descriptive
      const factCheckSummaries = relevantFactChecks
        .slice(0, 3)
        .map(fc => {
          const rating = fc.rating || fc.snippet || 'No rating';
          const source = fc.source || 'Fact checker';
          // Extract just the rating text, not the full snippet
          const ratingText = rating.toLowerCase().includes('false') ? 'False' :
                            rating.toLowerCase().includes('true') ? 'True' :
                            rating.toLowerCase().includes('misleading') ? 'Misleading' :
                            rating;
          return `${source}: ${ratingText}`;
        });
      
      if (factCheckSummaries.length > 0) {
        factCheckExplanation = `Related fact-checks found: ${factCheckSummaries.join('; ')}. `;
      }
    } else if (factChecks.length > 0) {
      // We found fact checks but they're not relevant to this content
      factCheckExplanation = 'Fact-checks were found but appear unrelated to this specific content. ';
    } else {
      factCheckExplanation = 'No specific fact checks found for this content. Always verify information from multiple reliable sources. ';
    }

    // STEP 5: Combine all signals into FINAL SCORE
    // Formula: FINAL_FAKE_SCORE = 0.55 * AI_MODEL + 0.20 * FACT_CHECK + 0.15 * SOURCE + 0.10 * SENSATIONALISM
    const features = extractTextFeatures(cleanText);
    const sensationalismScore = calculateSensationalismScore(features);
    
    // IMPORTANT: If source is known reliable (like BBC), give it more weight and reduce fake probability
    const isReliableSource = sourceAnalysis?.isKnownReliable || false;
    let adjustedSourceFakeProb = sourceFakeProb;
    
    if (isReliableSource) {
      // For reliable sources, significantly reduce the fake probability contribution
      // A reliable source should not contribute much to fake probability
      adjustedSourceFakeProb = Math.min(sourceFakeProb, 0.2); // Cap at 0.2 for reliable sources
    }
    
    let finalFakeScore = (
      aiFakeProb * 0.55 +              // AI Model: 55% weight
      factCheckFakeProb * 0.20 +        // Fact Check: 20% weight (only if relevant)
      adjustedSourceFakeProb * 0.15 +   // Source Reputation: 15% weight (adjusted for reliable sources)
      sensationalismScore * 0.10        // Sensationalism: 10% weight
    );

    // Determine classification based on final score
    // IMPORTANT: For reliable sources, be more lenient toward "real" classification
    let classification: "real" | "fake" | "misleading";
    
    // FIX: If source is reliable and AI says real, trust it more
    if (isReliableSource && aiFakeProb < 0.3 && finalFakeScore < 0.5) {
      // Reliable source + AI says likely real = classify as real
      classification = "real";
      finalFakeScore = Math.min(finalFakeScore, 0.3); // Cap fake score for reliable sources
    } else if (aiFakeProb < 0.2 && finalFakeScore < 0.4) {
      // Very low fake probability from AI = likely real
      classification = "real";
      // Use AI confidence as the main signal, but cap at reasonable level
      finalFakeScore = Math.max(aiFakeProb, finalFakeScore);
    } else if (aiFakeProb > 0.8 && finalFakeScore > 0.6) {
      // Very high fake probability from AI = likely fake
      classification = "fake";
    } else if (finalFakeScore >= 0.6) {
      classification = "fake";
    } else if (finalFakeScore <= 0.3 && relevantFactChecks.length > 0) {
      // Only classify as "real" if we have relevant fact-check evidence AND low fake score
      const avgFactCheckScore = relevantFactChecks
        .map(fc => fc.score ?? 0.5)
        .reduce((a, b) => a + b, 0) / relevantFactChecks.length;
      
      if (avgFactCheckScore > 0.7) {
        classification = "real";
      } else {
        classification = "misleading";
      }
    } else if (finalFakeScore <= 0.4 && aiFakeProb < 0.3 && isReliableSource) {
      // Reliable source + low fake score + low AI fake prob = likely real
      classification = "real";
      finalFakeScore = Math.min(finalFakeScore, 0.35);
    } else if (finalFakeScore <= 0.4 && aiFakeProb < 0.3) {
      // Low fake score with low AI fake prob = likely real (but unverified)
      classification = "real";
      // Cap confidence since we don't have fact-check evidence
      finalFakeScore = Math.min(finalFakeScore, 0.35);
    } else if (finalFakeScore <= 0.4) {
      // Low fake score but no strong evidence = misleading/unverified
      classification = "misleading";
      finalFakeScore = Math.min(finalFakeScore, 0.4); // Cap confidence for unverified
    } else {
      classification = "misleading";
    }
    
    // FIX: Context-required or unverified claims should have capped confidence
    // But don't cap if we have a reliable source
    if (!isReliableSource && (contentTypeResult.type === "CONTEXT_REQUIRED" || 
        (relevantFactChecks.length === 0 && sourceFakeProb === 0.5))) {
      // Only cap if it's not a high-confidence REAL prediction
      if (classification !== "real" || finalFakeScore > 0.3) {
      finalFakeScore = Math.min(finalFakeScore, 0.4);
      }
    }
    
    // Calculate confidence: For REAL, confidence = 1 - fakeScore; For FAKE, confidence = fakeScore
    // For MISLEADING, use the distance from 0.5 (neutral)
    let confidence: number;
    if (classification === "real") {
      // REAL: confidence is inverse of fake score (higher = more real = higher confidence)
      confidence = Math.max(0.5, 1 - finalFakeScore);
    } else if (classification === "fake") {
      // FAKE: confidence is the fake score directly (higher = more fake = higher confidence)
      confidence = Math.max(0.5, finalFakeScore);
    } else {
      // MISLEADING: confidence is based on distance from neutral (0.5)
      confidence = Math.abs(finalFakeScore - 0.5) * 2; // Convert 0-0.5 range to 0-1
      confidence = Math.max(0.3, Math.min(0.7, confidence)); // Cap between 30-70% for misleading
    }

    // Build comprehensive explanation
    const explanationParts: string[] = [];
    
    // Add content type context (only for debugging, not for context-required which already has explanation)
    if (contentTypeResult.type !== "FACTUAL_CLAIM" && 
        contentTypeResult.type !== "NEWS_CLAIM" && 
        contentTypeResult.type !== "CONTEXT_REQUIRED") {
      explanationParts.push(`Content type: ${contentTypeResult.type}.`);
    }
    
    // Add AI analysis explanation
    if (aiAnalysis.explanation) {
      explanationParts.push(aiAnalysis.explanation);
    }
    
    // Add fact-check explanation
    if (factCheckExplanation) {
      explanationParts.push(factCheckExplanation.trim());
    } else if (factChecks.length === 0) {
      explanationParts.push("No matching fact-checks found in database.");
    }
    
    // Add source explanation
    if (sourceExplanation) {
      explanationParts.push(sourceExplanation.trim());
    }
    
    // Add pattern-based findings
    if (features.suspiciousWordCount > 0) {
      explanationParts.push(
        `Detected ${features.suspiciousWordCount} suspicious language patterns.`
      );
    }
    
    if (features.exclamationCount > 5) {
      explanationParts.push(
        `High use of exclamation marks (${features.exclamationCount}) may indicate sensationalism.`
      );
    }
    
    // Add final reasoning with appropriate messaging
    if (classification === "real" && factChecks.length === 0) {
      explanationParts.push(
        `Assessment: Content appears credible based on AI analysis. Exercise caution and verify from multiple sources when possible.`
      );
    } else if (classification === "misleading" && factChecks.length === 0 && sourceFakeProb === 0.5) {
      explanationParts.push(
        `Assessment: Content could not be verified. Insufficient evidence to determine authenticity. Verify from trusted sources.`
      );
    } else {
      // Use the calculated confidence, not finalFakeScore
      explanationParts.push(
        `Final assessment: ${classification.toUpperCase()} with ${Math.round(confidence * 100)}% confidence.`
      );
    }

    const finalExplanation = explanationParts.join(' ');

    // Get sources from fact-checks and perplexity
    const sources = [
      ...factChecks.slice(0, 3).map(fc => ({
        title: fc.title,
        url: fc.url,
        trustScore: fc.score ? (1 - fc.score) : 0.5 // Convert to trust score
      })),
      ...(await analyzeWithPerplexity(cleanText, language)).sources.slice(0, 2)
    ].slice(0, 5); // Limit to 5 sources

    // Analyze sentiment
    const sentiment = analyzeSentiment(cleanText);

    // Prepare fact checks for frontend - use relevant fact checks only
    const factChecksForUI = relevantFactChecks && relevantFactChecks.length > 0 
      ? relevantFactChecks.slice(0, 5).map(fc => ({
          source: fc.source || 'Fact Checker',
          title: fc.title || 'Fact Check',
          snippet: fc.snippet || fc.rating || 'No rating available',
          url: fc.url || 'https://www.reuters.com/fact-check'
        })) 
      : [];
    
    // Debug logging
    console.log(`[ANALYZER] Returning ${factChecksForUI.length} relevant fact checks to frontend`);
    if (factChecksForUI.length > 0) {
      console.log(`[ANALYZER] Fact check details:`, factChecksForUI.map(fc => `${fc.source}: ${fc.title?.substring(0, 30)}`));
    }

    // Return the comprehensive analysis result
    const result = {
      classification,
      confidence: confidence, // This is now properly calculated based on classification
      explanation: finalExplanation,
      sources: sources,
      patterns: {
        sensationalist: features.suspiciousWordCount,
        unreliableSource: features.unreliableSourcePhrases,
        unverifiedClaims: features.claimIndicators
      },
      // Add sourceCredibility, sentiment, and factChecks for frontend (ExtendedAnalysisResult)
      ...(sourceCredibility && { sourceCredibility }),
      sentiment,
      factChecks: factChecksForUI // Include fact checks for UI display
    } as any; // Type assertion needed since these fields are not in AnalysisResult schema
    
    return result;
  } catch (error) {
    console.error("Error in text analysis:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to analyze text");
  }
}
