/**
 * Sentiment Analysis for Text Content
 * Analyzes emotional tone, language style, and political leaning
 */

import { extractTextFeatures } from './featureExtractor';

// Emotional words categorized
const POSITIVE_EMOTIONAL_WORDS = new Set([
  'amazing', 'wonderful', 'excellent', 'great', 'fantastic', 'brilliant',
  'outstanding', 'remarkable', 'inspiring', 'hopeful', 'optimistic',
  'joyful', 'celebratory', 'triumphant', 'victorious', 'successful'
]);

const NEGATIVE_EMOTIONAL_WORDS = new Set([
  'terrible', 'awful', 'horrible', 'devastating', 'tragic', 'disastrous',
  'frightening', 'terrifying', 'shocking', 'outrageous', 'scandalous',
  'alarming', 'disturbing', 'concerning', 'worrisome', 'dangerous'
]);

const FEAR_WORDS = new Set([
  'fear', 'afraid', 'scared', 'terrified', 'panic', 'anxiety', 'worry',
  'concern', 'threat', 'danger', 'risk', 'crisis', 'emergency'
]);

// Sensationalist language patterns
const SENSATIONALIST_PATTERNS = [
  /shocking/i, /explosive/i, /bombshell/i, /exclusive/i, /breaking/i,
  /you won't believe/i, /mind-blowing/i, /jaw-dropping/i, /unbelievable/i
];

// Political keywords (simplified - would need more comprehensive lists)
const LIBERAL_KEYWORDS = new Set([
  'progressive', 'democratic', 'equality', 'diversity', 'inclusion',
  'climate change', 'renewable energy', 'social justice', 'universal healthcare'
]);

const CONSERVATIVE_KEYWORDS = new Set([
  'conservative', 'republican', 'traditional', 'heritage', 'patriotism',
  'free market', 'limited government', 'constitutional', 'family values'
]);

export interface SentimentAnalysis {
  emotionalTone: string;
  emotionalToneScore: number;
  languageStyle: string;
  languageStyleScore: number;
  politicalLeaning: string;
  politicalLeaningScore: number;
}

/**
 * Analyze sentiment of text content
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  if (!text || text.trim().length === 0) {
    return {
      emotionalTone: 'Neutral',
      emotionalToneScore: 0.5,
      languageStyle: 'Neutral',
      languageStyleScore: 0.5,
      politicalLeaning: 'Neutral',
      politicalLeaningScore: 0.5
    };
  }

  const features = extractTextFeatures(text);
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  // 1. Emotional Tone Analysis
  let positiveCount = 0;
  let negativeCount = 0;
  let fearCount = 0;

  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (POSITIVE_EMOTIONAL_WORDS.has(cleanWord)) positiveCount++;
    if (NEGATIVE_EMOTIONAL_WORDS.has(cleanWord)) negativeCount++;
    if (FEAR_WORDS.has(cleanWord)) fearCount++;
  });

  // Calculate emotional tone
  let emotionalTone: string;
  let emotionalToneScore: number;

  const totalEmotionalWords = positiveCount + negativeCount + fearCount;
  const emotionalRatio = totalEmotionalWords / Math.max(words.length, 1);

  if (fearCount > negativeCount && fearCount > positiveCount && fearCount > 2) {
    emotionalTone = 'Fear-inducing';
    emotionalToneScore = Math.min(0.3 + (fearCount / words.length) * 10, 0.9);
  } else if (negativeCount > positiveCount && negativeCount > 2) {
    emotionalTone = 'Negative';
    emotionalToneScore = Math.min(0.4 + (negativeCount / words.length) * 10, 0.8);
  } else if (positiveCount > negativeCount && positiveCount > 2) {
    emotionalTone = 'Positive';
    emotionalToneScore = Math.min(0.5 + (positiveCount / words.length) * 10, 0.8);
  } else if (emotionalRatio > 0.05) {
    emotionalTone = 'Emotional';
    emotionalToneScore = Math.min(0.5 + emotionalRatio * 5, 0.7);
  } else {
    emotionalTone = 'Neutral';
    emotionalToneScore = 0.5;
  }

  // 2. Language Style Analysis
  let languageStyle: string;
  let languageStyleScore: number;

  // Check for sensationalist patterns
  const sensationalistMatches = SENSATIONALIST_PATTERNS.filter(pattern => pattern.test(text)).length;
  const hasExcessiveCaps = features.uppercaseRatio > 0.15;
  const hasManyExclamations = features.exclamationCount > 3;
  const hasSuspiciousWords = features.suspiciousWordCount > 2;

  if (sensationalistMatches > 2 || (hasExcessiveCaps && hasManyExclamations)) {
    languageStyle = 'Sensationalist';
    languageStyleScore = Math.min(0.7 + (sensationalistMatches * 0.1), 0.95);
  } else if (sensationalistMatches > 0 || hasSuspiciousWords || hasManyExclamations) {
    languageStyle = 'Slightly sensationalist';
    languageStyleScore = Math.min(0.5 + (sensationalistMatches * 0.1), 0.7);
  } else if (features.exclamationCount > 1 || features.emotionalWordCount > 3) {
    languageStyle = 'Emotional';
    languageStyleScore = Math.min(0.4 + (features.emotionalWordCount / 10), 0.6);
  } else if (features.avgSentenceLength > 20 && features.avgWordsPerSentence > 15) {
    languageStyle = 'Formal';
    languageStyleScore = 0.5;
  } else {
    languageStyle = 'Neutral';
    languageStyleScore = 0.5;
  }

  // 3. Political Leaning Analysis
  let politicalLeaning: string;
  let politicalLeaningScore: number;

  let liberalCount = 0;
  let conservativeCount = 0;

  words.forEach(word => {
    const cleanWord = word.replace(/[^\w]/g, '');
    if (LIBERAL_KEYWORDS.has(cleanWord)) liberalCount++;
    if (CONSERVATIVE_KEYWORDS.has(cleanWord)) conservativeCount++;
  });

  // Check for multi-word phrases
  if (lowerText.includes('climate change') || lowerText.includes('renewable energy')) {
    liberalCount += 2;
  }
  if (lowerText.includes('free market') || lowerText.includes('limited government')) {
    conservativeCount += 2;
  }

  const totalPoliticalWords = liberalCount + conservativeCount;
  const politicalRatio = totalPoliticalWords / Math.max(words.length, 1);

  if (liberalCount > conservativeCount && liberalCount > 1) {
    politicalLeaning = 'Liberal-leaning';
    politicalLeaningScore = Math.min(0.5 + (liberalCount / words.length) * 20, 0.8);
  } else if (conservativeCount > liberalCount && conservativeCount > 1) {
    politicalLeaning = 'Conservative-leaning';
    politicalLeaningScore = Math.min(0.5 + (conservativeCount / words.length) * 20, 0.8);
  } else if (politicalRatio > 0.02) {
    politicalLeaning = 'Slightly biased';
    politicalLeaningScore = Math.min(0.5 + politicalRatio * 10, 0.65);
  } else {
    politicalLeaning = 'Neutral';
    politicalLeaningScore = 0.5;
  }

  return {
    emotionalTone,
    emotionalToneScore: Math.max(0.1, Math.min(0.9, emotionalToneScore)),
    languageStyle,
    languageStyleScore: Math.max(0.1, Math.min(0.9, languageStyleScore)),
    politicalLeaning,
    politicalLeaningScore: Math.max(0.1, Math.min(0.9, politicalLeaningScore))
  };
}

