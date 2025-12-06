/**
 * Comprehensive Feature Extractor for Fake News Detection
 * Extracts textual, semantic, and pattern-based features from content
 */

// Suspicious keywords that indicate fake news
const SUSPICIOUS_WORDS = new Set([
  "shocking", "exposed", "miracle", "you won't believe", "viral", "exclusive",
  "secret", "they don't want you to know", "conspiracy", "cover-up", "scandal",
  "shocking truth", "government hiding", "mind-blowing", "breakthrough",
  "never before seen", "hidden", "secret remedy", "they're hiding", "nasa hiding",
  "instant", "guaranteed", "proven", "revolutionary"
]);

const UNRELIABLE_SOURCE_PATTERNS = [
  "anonymous source", "unnamed expert", "some people say", "many believe",
  "scientists claim", "experts say", "insider reveals", "unnamed official"
];

const EMOTIONAL_WORDS = new Set([
  "amazing", "incredible", "unbelievable", "shocking", "outrageous",
  "terrifying", "devastating", "miraculous", "explosive", "scandalous"
]);

export interface TextFeatures {
  // Basic text features
  charCount: number;
  wordCount: number;
  avgWordLen: number;
  sentenceCount: number;
  paragraphCount: number;
  
  // Pattern features
  stopwordRatio: number;
  uppercaseRatio: number;
  exclamationCount: number;
  questionCount: number;
  allCapsWordCount: number;
  
  // Content features
  suspiciousWordCount: number;
  suspiciousWords: string[];
  unreliableSourcePhrases: number;
  emotionalWordCount: number;
  
  // Readability (simplified Flesch-like score)
  avgSentenceLength: number;
  avgWordsPerSentence: number;
  
  // Named entity counts (simplified)
  numberCount: number;
  urlCount: number;
  emailCount: number;
  
  // Claim-like patterns
  claimIndicators: number; // Sentences with "proven", "studies show", etc.
  
  // Lexical diversity
  uniqueWordRatio: number;
  
  // Sentiment indicators
  positiveWordCount: number;
  negativeWordCount: number;
  neutralWordCount: number;
}

/**
 * Extract comprehensive text features from content
 */
export function extractTextFeatures(text: string): TextFeatures {
  if (!text || text.trim().length === 0) {
    return getEmptyFeatures();
  }

  const cleanText = text.trim();
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  const lowerText = cleanText.toLowerCase();
  const lowerWords = words.map(w => w.toLowerCase().replace(/[^\w]/g, ''));
  
  // Basic counts
  const charCount = cleanText.length;
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const paragraphCount = paragraphs.length || 1;
  
  // Average word length
  const totalCharInWords = words.reduce((sum, w) => sum + w.replace(/[^\w]/g, '').length, 0);
  const avgWordLen = wordCount > 0 ? totalCharInWords / wordCount : 0;
  
  // Stopwords (common English stopwords)
  const commonStopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  const stopwordCount = lowerWords.filter(w => commonStopwords.has(w)).length;
  const stopwordRatio = wordCount > 0 ? stopwordCount / wordCount : 0;
  
  // Uppercase analysis
  const uppercaseWords = words.filter(w => w === w.toUpperCase() && w.length > 1);
  const uppercaseRatio = wordCount > 0 ? uppercaseWords.length / wordCount : 0;
  const allCapsWordCount = uppercaseWords.length;
  
  // Punctuation
  const exclamationCount = (cleanText.match(/!/g) || []).length;
  const questionCount = (cleanText.match(/\?/g) || []).length;
  
  // Suspicious words detection
  const foundSuspiciousWords: string[] = [];
  SUSPICIOUS_WORDS.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) {
      foundSuspiciousWords.push(word);
    }
  });
  const suspiciousWordCount = foundSuspiciousWords.length;
  
  // Unreliable source phrases
  const unreliableSourcePhrases = UNRELIABLE_SOURCE_PATTERNS.filter(
    phrase => lowerText.includes(phrase)
  ).length;
  
  // Emotional words
  const emotionalWordCount = Array.from(EMOTIONAL_WORDS).filter(
    word => lowerText.includes(word)
  ).length;
  
  // Readability metrics
  const avgSentenceLength = sentenceCount > 0 ? charCount / sentenceCount : 0;
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
  
  // Numbers, URLs, emails
  const numberCount = (cleanText.match(/\d+/g) || []).length;
  const urlCount = (cleanText.match(/https?:\/\/[^\s]+/gi) || []).length;
  const emailCount = (cleanText.match(/[\w.-]+@[\w.-]+\.\w+/gi) || []).length;
  
  // Claim indicators (sentences with claim-like patterns)
  const claimPatterns = [
    /studies?\s+show/gi,
    /research\s+proves?/gi,
    /scientists?\s+found/gi,
    /experts?\s+say/gi,
    /proven\s+to/gi,
    /evidence\s+suggests?/gi
  ];
  const claimIndicators = claimPatterns.reduce((count, pattern) => {
    return count + (cleanText.match(pattern) || []).length;
  }, 0);
  
  // Lexical diversity (unique words / total words)
  const uniqueWords = new Set(lowerWords);
  const uniqueWordRatio = wordCount > 0 ? uniqueWords.size / wordCount : 0;
  
  // Simple sentiment indicators (basic positive/negative word lists)
  const positiveWords = ['good', 'great', 'excellent', 'wonderful', 'amazing', 'positive', 'success', 'win', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'fail', 'loss', 'worst', 'problem', 'issue'];
  
  const positiveWordCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeWordCount = negativeWords.filter(w => lowerText.includes(w)).length;
  const neutralWordCount = wordCount - positiveWordCount - negativeWordCount;
  
  return {
    charCount,
    wordCount,
    avgWordLen,
    sentenceCount,
    paragraphCount,
    stopwordRatio,
    uppercaseRatio,
    exclamationCount,
    questionCount,
    allCapsWordCount,
    suspiciousWordCount,
    suspiciousWords: foundSuspiciousWords,
    unreliableSourcePhrases,
    emotionalWordCount,
    avgSentenceLength,
    avgWordsPerSentence,
    numberCount,
    urlCount,
    emailCount,
    claimIndicators,
    uniqueWordRatio,
    positiveWordCount,
    negativeWordCount,
    neutralWordCount
  };
}

/**
 * Calculate sensationalism score based on features
 * Returns a score from 0 (not sensational) to 1 (highly sensational)
 */
export function calculateSensationalismScore(features: TextFeatures): number {
  let score = 0;
  let factors = 0;
  
  // Suspicious words (weight: 0.3)
  if (features.suspiciousWordCount > 0) {
    score += Math.min(features.suspiciousWordCount / 5, 1) * 0.3;
    factors++;
  }
  
  // Uppercase ratio (weight: 0.2)
  if (features.uppercaseRatio > 0.1) {
    score += Math.min(features.uppercaseRatio * 2, 1) * 0.2;
    factors++;
  }
  
  // Exclamation marks (weight: 0.2)
  if (features.exclamationCount > 0) {
    score += Math.min(features.exclamationCount / 10, 1) * 0.2;
    factors++;
  }
  
  // Emotional words (weight: 0.15)
  if (features.emotionalWordCount > 0) {
    score += Math.min(features.emotionalWordCount / 5, 1) * 0.15;
    factors++;
  }
  
  // Unreliable source phrases (weight: 0.15)
  if (features.unreliableSourcePhrases > 0) {
    score += Math.min(features.unreliableSourcePhrases / 3, 1) * 0.15;
    factors++;
  }
  
  // Normalize by number of factors present
  return factors > 0 ? Math.min(score, 1) : 0;
}

/**
 * Get empty feature object for edge cases
 */
function getEmptyFeatures(): TextFeatures {
  return {
    charCount: 0,
    wordCount: 0,
    avgWordLen: 0,
    sentenceCount: 0,
    paragraphCount: 0,
    stopwordRatio: 0,
    uppercaseRatio: 0,
    exclamationCount: 0,
    questionCount: 0,
    allCapsWordCount: 0,
    suspiciousWordCount: 0,
    suspiciousWords: [],
    unreliableSourcePhrases: 0,
    emotionalWordCount: 0,
    avgSentenceLength: 0,
    avgWordsPerSentence: 0,
    numberCount: 0,
    urlCount: 0,
    emailCount: 0,
    claimIndicators: 0,
    uniqueWordRatio: 0,
    positiveWordCount: 0,
    negativeWordCount: 0,
    neutralWordCount: 0
  };
}

