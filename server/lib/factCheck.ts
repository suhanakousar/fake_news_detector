import axios from 'axios';

export interface FactCheck {
  source: string;
  title: string;
  snippet: string;
  url: string;
  rating?: string; // e.g., "false", "true", "misleading"
  score?: number; // 0 (false) to 1 (true)
}

// Google Fact Check API configuration
const GOOGLE_FACT_CHECK_API_KEY = process.env.GOOGLE_FACT_CHECK_API_KEY || 'AIzaSyC2Orfz4hzUdFUd3KAD9IHj1wkxRKtMWH4';
const GOOGLE_FACT_CHECK_API_URL = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

// Fallback fact checks in case the API call fails or returns no results
const fallbackFactChecks: FactCheck[] = [
  {
    source: "TruthLens",
    title: "Fact Check Database",
    snippet: "No specific fact checks found for this content. Always verify information from multiple reliable sources.",
    url: "https://www.reuters.com/fact-check"
  }
];

/**
 * Extracts relevant keywords from text for better fact-checking queries
 */
function extractKeywords(text: string): string[] {
  // Remove common stopwords
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'they', 'them', 'their', 'there', 'these', 'those']);
  
  // Extract the most significant words or phrases
  const cleanText = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Extract important phrases first (2-3 word combinations)
  const words = cleanText.split(' ');
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 3 && words[i + 1].length > 3 && 
        !stopwords.has(words[i]) && !stopwords.has(words[i + 1])) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
  }
  
  // Also extract single important words
  const wordFrequency: Record<string, number> = {};
  words.forEach(word => {
    if (word.length > 4 && !stopwords.has(word)) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  // Combine phrases and words, prioritize phrases
  const importantPhrases = phrases.slice(0, 3);
  const importantWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
  
  return [...importantPhrases, ...importantWords].slice(0, 5);
}

/**
 * Convert fact-check rating text to numeric score
 * Returns score from 0 (false/fake) to 1 (true/real)
 */
function ratingToScore(rating: string): number {
  const lowerRating = rating.toLowerCase();
  
  // False ratings
  if (lowerRating.includes('false') || lowerRating.includes('pants-on-fire')) {
    return 0.1; // Very low (likely fake)
  }
  
  // Misleading ratings
  if (lowerRating.includes('misleading') || lowerRating.includes('half-true') || 
      lowerRating.includes('barely-true')) {
    return 0.4; // Low (misleading)
  }
  
  // True ratings
  if (lowerRating.includes('true') || lowerRating.includes('mostly-true') || 
      lowerRating.includes('correct')) {
    return 0.9; // High (likely real)
  }
  
  // Default neutral
  return 0.5;
}

/**
 * Check if a fact check is relevant to the original text
 * Returns true if the fact check appears to be about the same topic/claim
 */
function isFactCheckRelevant(factCheck: FactCheck, originalText: string): boolean {
  const factCheckText = `${factCheck.title} ${factCheck.snippet}`.toLowerCase();
  const originalLower = originalText.toLowerCase();
  
  // Extract key terms from original text (nouns, important words)
  const originalWords = originalLower
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4) // Focus on longer, more meaningful words
    .slice(0, 10); // Take top 10 words
  
  // Check if fact check contains at least 2-3 key terms from original text
  const matchingTerms = originalWords.filter(word => 
    factCheckText.includes(word) && word.length > 4
  );
  
  // If we have at least 2 matching significant terms, consider it relevant
  // But also check that it's not too generic (avoid matching on common words)
  const commonWords = ['said', 'news', 'report', 'article', 'claim', 'statement', 'fact'];
  const significantMatches = matchingTerms.filter(word => !commonWords.includes(word));
  
  return significantMatches.length >= 2;
}

/**
 * Filter fact checks to only include those relevant to the original text
 */
export function filterRelevantFactChecks(factChecks: FactCheck[], originalText: string): FactCheck[] {
  if (factChecks.length === 0) {
    return [];
  }
  
  // If we have very few fact checks, be more lenient
  // If we have many, be more strict
  const relevanceThreshold = factChecks.length > 3 ? 2 : 1;
  
  return factChecks.filter(fc => {
    // Always include fact checks that are clearly relevant
    if (isFactCheckRelevant(fc, originalText)) {
      return true;
    }
    
    // For very few results, include borderline cases
    if (factChecks.length <= 2) {
      const factCheckText = `${fc.title} ${fc.snippet}`.toLowerCase();
      const originalLower = originalText.toLowerCase();
      // Check for at least one significant word match
      const originalWords = originalLower
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 5);
      return originalWords.some(word => factCheckText.includes(word));
    }
    
    return false;
  });
}

/**
 * Calculate fact-check score from multiple fact checks
 * Returns average score (0-1) where 0 = fake, 1 = real
 */
export function calculateFactCheckScore(factChecks: FactCheck[]): number {
  if (factChecks.length === 0) {
    return 0.5; // Neutral if no fact checks found
  }
  
  const scores = factChecks
    .map(fc => fc.score ?? ratingToScore(fc.snippet))
    .filter(score => score !== undefined);
  
  if (scores.length === 0) {
    return 0.5;
  }
  
  // Return average score
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Convert to fake probability (inverse: lower fact-check score = higher fake probability)
  return 1 - avgScore; // If fact-check says 0.1 (false), fake probability is 0.9
}

/**
 * Fetch fact checks from Google Fact Check API
 * Falls back to basic mock data if API fails or returns no results
 */
export async function fetchFactChecks(text: string): Promise<FactCheck[]> {
  let allFactChecks: FactCheck[] = [];
  
  try {
    // Strategy 1: Extract key phrases and entities
    const keywords = extractKeywords(text);
    const query = keywords.length > 0 ? keywords.join(' ') : text.split(' ').slice(0, 10).join(' ');
    
    // Make request to Google Fact Check API
    try {
      const response = await axios.get(GOOGLE_FACT_CHECK_API_URL, {
        params: {
          key: GOOGLE_FACT_CHECK_API_KEY,
          query: query,
          languageCode: 'en-US',
          maxAgeDays: 365 // Look for fact checks from the past year
        },
        timeout: 10000 // Increased to 10 seconds
      });
    
      // Process API response
      if (response.data && response.data.claims && response.data.claims.length > 0) {
        // Map API response to our FactCheck interface
        const factChecks = response.data.claims.slice(0, 5).map((claim: any) => {
          const claimReview = claim.claimReview && claim.claimReview[0] ? claim.claimReview[0] : {};
          const rating = claimReview.textualRating || claimReview.rating || 'No rating available';
          
          return {
            source: claimReview.publisher?.name || claimReview.publisher?.site || 'Fact Checker',
            title: claim.text || claim.claimReview?.[0]?.title || 'Claim review',
            snippet: rating,
            url: claimReview.url || claim.url || 'https://www.reuters.com/fact-check',
            rating: rating,
            score: ratingToScore(rating)
          };
        }).filter(fc => fc.title && fc.title !== 'Claim review' && fc.snippet && fc.snippet !== 'No rating available'); // Filter out empty results
        
        if (factChecks.length > 0) {
          allFactChecks.push(...factChecks);
        }
      }
    } catch (error: any) {
      // Log but continue to next strategy
      if (error.response?.status !== 503) {
        console.log('Strategy 1 fact check search failed:', error.message);
      }
    }
    
    // Strategy 2: Try searching with organization names and key terms
    const orgPattern = /(WHO|World Health Organization|NASA|CDC|FDA|UN|United Nations|government|official|Covid|vaccine)/i;
    const orgMatch = text.match(orgPattern);
    
    if (orgMatch && allFactChecks.length === 0) {
      const orgQuery = `${orgMatch[0]} ${keywords.slice(0, 2).join(' ')}`;
      
      try {
        const orgResponse = await axios.get(GOOGLE_FACT_CHECK_API_URL, {
          params: {
            key: GOOGLE_FACT_CHECK_API_KEY,
            query: orgQuery,
            languageCode: 'en-US',
            maxAgeDays: 365
          },
          timeout: 10000
        });
        
        if (orgResponse.data && orgResponse.data.claims && orgResponse.data.claims.length > 0) {
          const factChecks = orgResponse.data.claims.slice(0, 5).map((claim: any) => {
            const claimReview = claim.claimReview && claim.claimReview[0] ? claim.claimReview[0] : {};
            const rating = claimReview.textualRating || claimReview.rating || 'No rating available';
            
            return {
              source: claimReview.publisher?.name || claimReview.publisher?.site || 'Fact Checker',
              title: claim.text || claim.claimReview?.[0]?.title || 'Claim review',
              snippet: rating,
              url: claimReview.url || claim.url || 'https://www.reuters.com/fact-check',
              rating: rating,
              score: ratingToScore(rating)
            };
          }).filter(fc => fc.title && fc.title !== 'Claim review' && fc.snippet && fc.snippet !== 'No rating available');
          
          if (factChecks.length > 0) {
            allFactChecks.push(...factChecks);
          }
        }
      } catch (orgError: any) {
        // Continue to next strategy
        if (orgError.response?.status !== 503) {
          console.log('Organization-based fact check search failed:', orgError.message);
        }
      }
    }
    
    // Strategy 3: Try with first sentence or main claim
    const firstSentence = text.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 20 && firstSentence.length < 200 && allFactChecks.length === 0) {
      try {
        const sentenceResponse = await axios.get(GOOGLE_FACT_CHECK_API_URL, {
          params: {
            key: GOOGLE_FACT_CHECK_API_KEY,
            query: firstSentence,
            languageCode: 'en-US',
            maxAgeDays: 365
          },
          timeout: 10000
        });
        
        if (sentenceResponse.data && sentenceResponse.data.claims && sentenceResponse.data.claims.length > 0) {
          const factChecks = sentenceResponse.data.claims.slice(0, 5).map((claim: any) => {
            const claimReview = claim.claimReview && claim.claimReview[0] ? claim.claimReview[0] : {};
            const rating = claimReview.textualRating || claimReview.rating || 'No rating available';
            
            return {
              source: claimReview.publisher?.name || claimReview.publisher?.site || 'Fact Checker',
              title: claim.text || claim.claimReview?.[0]?.title || 'Claim review',
              snippet: rating,
              url: claimReview.url || claim.url || 'https://www.reuters.com/fact-check',
              rating: rating,
              score: ratingToScore(rating)
            };
          }).filter(fc => fc.title && fc.title !== 'Claim review' && fc.snippet && fc.snippet !== 'No rating available');
          
          if (factChecks.length > 0) {
            allFactChecks.push(...factChecks);
          }
        }
      } catch (sentenceError: any) {
        // Continue - we'll return what we have
        if (sentenceError.response?.status !== 503) {
          console.log('Sentence-based fact check search failed:', sentenceError.message);
        }
      }
    }
    
    // Return all fact checks found (remove duplicates and filter for relevance)
    if (allFactChecks.length > 0) {
      // Remove duplicates based on URL
      const uniqueFactChecks = allFactChecks.filter((fc, index, self) =>
        index === self.findIndex(f => f.url === fc.url)
      );
      
      // Filter for relevance to the original text
      const relevantFactChecks = filterRelevantFactChecks(uniqueFactChecks, text);
      
      console.log(`Found ${uniqueFactChecks.length} fact checks, ${relevantFactChecks.length} relevant`);
      
      // Return relevant fact checks, or if none are relevant and we have few results, return all
      if (relevantFactChecks.length > 0) {
        return relevantFactChecks.slice(0, 5);
      } else if (uniqueFactChecks.length <= 2) {
        // If we have very few results and none are clearly relevant, return them anyway
        // (better than showing nothing, but mark as potentially unrelated)
        return uniqueFactChecks.slice(0, 5);
      } else {
        // If we have many results but none are relevant, return empty (they're likely unrelated)
        console.log('No relevant fact checks found after filtering');
        return [];
      }
    }
    
    // No fact checks found - return empty array so UI can show appropriate message
    console.log('No fact checks found from Google API after multiple search strategies');
    return [];
  } catch (error: any) {
    // Check if it's an API key error
    if (error.response?.status === 403 || error.response?.status === 401) {
      console.error('Google Fact Check API key error. Please check your API key configuration.');
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error('Google Fact Check API timeout. The service may be slow or unavailable.');
    } else {
      console.error('Error fetching fact checks from Google API:', error.message || error);
    }
    // Return what we have so far, or empty array
    return allFactChecks.length > 0 ? allFactChecks.slice(0, 5) : [];
  }
}

