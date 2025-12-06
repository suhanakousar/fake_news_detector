import { AnalysisResult } from '@shared/schema';
import axios from 'axios';

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.HUGGINGFACE_API_KEY; // Support both for backward compatibility
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * Helper function to query Gemini API
 */
async function queryGeminiAPI(prompt: string) {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not found');
    }
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 503) {
      // Service temporarily unavailable, retry after a delay
      console.log(`Gemini API is temporarily unavailable, waiting to retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return queryGeminiAPI(prompt);
    }
    throw error;
  }
}

/**
 * Generates a concise summary of the article content using BART model
 * @param text The article text to summarize
 * @param language The language code (e.g., 'en', 'es', 'fr') of the text
 * @returns A concise summary of the article
 */
export async function generateArticleSummary(text: string, language: string = 'en'): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.log('Gemini API key not available, skipping article summarization');
    return null;
  }

  try {
    // Truncate text if it's too long for the model
    const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text;
    
    const prompt = `Summarize the following article in 2-3 sentences (40-150 words). Focus on the main points:

${truncatedText}

Summary:`;
    
    const summaryResponse = await queryGeminiAPI(prompt);
    
    const summaryText = summaryResponse.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return summaryText || null;
  } catch (error) {
    console.error('Error generating article summary:', error);
    return null;
  }
}

/**
 * Generate explainable AI details that highlight why content was detected as fake or real
 * @param result The current analysis result
 * @param text The analyzed text content
 * @param language The language code (e.g., 'en', 'es', 'fr') of the text
 * @returns Enhanced analysis result with XAI details
 */
export async function generateXaiDetails(result: AnalysisResult, text: string, language: string = 'en'): Promise<AnalysisResult> {
  if (!GEMINI_API_KEY) {
    console.log('Gemini API key not available, skipping XAI enhancement');
    return result;
  }

  try {
    // Truncate text if it's too long for the model
    const truncatedText = text.length > 2500 ? text.substring(0, 2500) + '...' : text;
    
    // Extract key phrases using Gemini
    const generationPrompt = `
You're analyzing ${result.classification} news content. Extract 3-5 key phrases that show why this is ${result.classification}, with impact scores (-1 to 1) and brief explanations.

Content to analyze:
${truncatedText.substring(0, 1000)}

Respond in valid JSON format only:
{
  "keyPhrases": [
    {"text": "phrase text", "impact": -0.8, "explanation": "brief explanation"},
    ...
  ]
}`;

    const phrasesResponse = await queryGeminiAPI(generationPrompt);
    
    let keyPhrases = [];
    const phrasesText = phrasesResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (phrasesText) {
      // Extract JSON from the generated text
      const jsonMatch = phrasesText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const phrasesData = JSON.parse(jsonMatch[0]);
          if (phrasesData.keyPhrases) {
            keyPhrases = phrasesData.keyPhrases;
          }
        } catch (error) {
          console.error('Error parsing key phrases JSON:', error);
        }
      }
    }
    
    // Generate alternative sources and detection confidence using Gemini
    const detailsPrompt = `
Based on this ${result.classification} news content, provide:
1. Detection methods (2-3) with confidence scores (0-1) and one explanation
2. Alternative credible sources (2-3) with titles, URLs, and trust scores (0-1)

Content to analyze:
${truncatedText.substring(0, 500)}

Respond in valid JSON format only:
{
  "detectionConfidence": [
    {"algorithm": "algorithm name", "score": 0.9, "explanation": "brief explanation"},
    ...
  ],
  "alternativeSources": [
    {"title": "source title", "url": "https://source.url", "trustScore": 0.9},
    ...
  ]
}`;

    const detailsResponse = await queryGeminiAPI(detailsPrompt);
    
    let detectionConfidence = [];
    let alternativeSources = [];
    
    const detailsText = detailsResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (detailsText) {
      // Extract JSON from the generated text
      const jsonMatch = detailsText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const detailsData = JSON.parse(jsonMatch[0]);
          if (detailsData.detectionConfidence) {
            detectionConfidence = detailsData.detectionConfidence;
          }
          if (detailsData.alternativeSources) {
            alternativeSources = detailsData.alternativeSources;
          }
        } catch (error) {
          console.error('Error parsing details JSON:', error);
        }
      }
    }
    
    // Construct XAI data
    const xaiData = {
      keyPhrases,
      detectionConfidence,
      alternativeSources
    };
    
    // Return enhanced result
    return {
      ...result,
      xai: xaiData
    };
  } catch (error) {
    console.error('Error generating XAI details:', error);
    return result;
  }
}

/**
 * Enhances analysis results with AI-powered features:
 * - Article summarization
 * - Explainable AI details for detection reasoning
 * 
 * @param result The original analysis result
 * @param text The analyzed text content
 * @param language The language code (e.g., 'en', 'es', 'fr') of the text
 * @returns Enhanced analysis result with AI features
 */
export async function enhanceAnalysisWithAI(result: AnalysisResult, text: string, language: string = 'en'): Promise<AnalysisResult> {
  try {
    // Run article summary and XAI enhancement in parallel
    const [summary, enhancedResult] = await Promise.all([
      generateArticleSummary(text, language),
      generateXaiDetails(result, text, language)
    ]);
    
    // Add the summary to the result if available
    if (summary) {
      return {
        ...enhancedResult,
        summary
      };
    }
    
    return enhancedResult;
  } catch (error) {
    console.error('Error enhancing analysis with AI:', error);
    return result;
  }
}