import axios from 'axios';

export interface FactCheck {
  source: string;
  title: string;
  snippet: string;
  url: string;
}

// Google Fact Check API configuration
const GOOGLE_FACT_CHECK_API_KEY = 'AIzaSyD4YUTtLdt_09Iqf2522dMHze0XVr45Uuk';
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
  // Extract the most significant words or phrases
  const cleanText = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
  
  // Simple keyword extraction based on word frequency
  const words = cleanText.split(' ');
  const wordFrequency: Record<string, number> = {};
  
  // Count word frequency
  words.forEach(word => {
    if (word.length > 3) { // Skip short words
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  // Get top keywords
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .slice(0, 5) // Take top 5 keywords
    .map(entry => entry[0]);
}

/**
 * Fetch fact checks from Google Fact Check API
 * Falls back to basic mock data if API fails or returns no results
 */
export async function fetchFactChecks(text: string): Promise<FactCheck[]> {
  try {
    // Extract keywords from the text for better search results
    const keywords = extractKeywords(text);
    const query = keywords.join(' ');
    
    // Make request to Google Fact Check API
    const response = await axios.get(GOOGLE_FACT_CHECK_API_URL, {
      params: {
        key: GOOGLE_FACT_CHECK_API_KEY,
        query: query,
        languageCode: 'en-US'
      }
    });
    
    // Process API response
    if (response.data && response.data.claims && response.data.claims.length > 0) {
      // Map API response to our FactCheck interface
      return response.data.claims.slice(0, 5).map((claim: any) => {
        const claimReview = claim.claimReview && claim.claimReview[0] ? claim.claimReview[0] : {};
        
        return {
          source: claimReview.publisher?.name || 'Fact Checker',
          title: claim.text || 'Claim review',
          snippet: claimReview.textualRating || 'No rating available',
          url: claimReview.url || 'https://www.reuters.com/fact-check'
        };
      });
    }
    
    // If no results from API, try a direct search with main text topic
    // Extract a short summary (first few words) for a more focused search
    const textSummary = text.split(' ').slice(0, 10).join(' ');
    
    const fallbackResponse = await axios.get(GOOGLE_FACT_CHECK_API_URL, {
      params: {
        key: GOOGLE_FACT_CHECK_API_KEY,
        query: textSummary,
        languageCode: 'en-US'
      }
    });
    
    if (fallbackResponse.data && fallbackResponse.data.claims && fallbackResponse.data.claims.length > 0) {
      return fallbackResponse.data.claims.slice(0, 5).map((claim: any) => {
        const claimReview = claim.claimReview && claim.claimReview[0] ? claim.claimReview[0] : {};
        
        return {
          source: claimReview.publisher?.name || 'Fact Checker',
          title: claim.text || 'Claim review',
          snippet: claimReview.textualRating || 'No rating available',
          url: claimReview.url || 'https://www.reuters.com/fact-check'
        };
      });
    }
    
    console.log('No fact checks found from Google API, using fallback data');
    return fallbackFactChecks;
  } catch (error) {
    console.error('Error fetching fact checks from Google API:', error);
    return fallbackFactChecks;
  }
}
