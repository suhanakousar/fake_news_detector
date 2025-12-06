import axios from 'axios';
import { FactCheck } from './factCheck';

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.HUGGINGFACE_API_KEY; // Support both for backward compatibility
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

/**
 * Helper function to query Gemini API
 */
async function queryGeminiAPI(prompt: string) {
  try {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Using fallback analysis.');
      return {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                enhancedReasoning: "API key not available. Using basic analysis.",
                enhancedFactChecks: []
              })
            }]
          }
        }]
      };
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
    console.error('Error querying Gemini API:', error);
    return {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              enhancedReasoning: "Error accessing AI service. Using basic analysis.",
              enhancedFactChecks: []
            })
          }]
        }
      }]
    };
  }
}

/**
 * Enhanced text analysis using Gemini API
 * @param text Text to analyze
 * @param language The language code (e.g., 'en', 'es', 'fr') of the text
 * @returns Enhanced analysis results
 */
export async function analyzeWithPerplexity(text: string, language: string = 'en'): Promise<{
  confidence: number;
  explanation: string;
  sources: {
    title: string;
    url: string;
    trustScore: number;
  }[];
}> {
  try {
    if (!GEMINI_API_KEY) {
      console.warn('Gemini API key not found. Using fallback analysis.');
      return {
        confidence: 0.5,
        explanation: "Perplexity AI analysis unavailable (Gemini API key not configured). Using pattern-based analysis only.",
        sources: []
      };
    }

    const prompt = `Analyze the following text for potential misinformation. Provide a JSON response with:
1. A confidence score between 0 and 1
2. A detailed explanation of your analysis
3. A list of relevant sources with titles, URLs, and trust scores

Text to analyze: ${text}

Response format:
{
  "confidence": number,
  "explanation": string,
  "sources": [
    {
      "title": string,
      "url": string,
      "trustScore": number
    }
  ]
}`;

    const response = await queryGeminiAPI(prompt);
    
    try {
      // Extract text from Gemini response
      const generatedText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!generatedText) {
        throw new Error('No text found in Gemini response');
      }
      
      // Extract JSON from the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      return {
        confidence: typeof result.confidence === 'number' ? Math.max(0, Math.min(1, result.confidence)) : 0.5,
        explanation: typeof result.explanation === 'string' ? result.explanation : "No detailed explanation available.",
        sources: Array.isArray(result.sources) ? result.sources.map((source: any) => ({
          title: typeof source.title === 'string' ? source.title : 'Unknown Source',
          url: typeof source.url === 'string' ? source.url : '',
          trustScore: typeof source.trustScore === 'number' ? Math.max(0, Math.min(1, source.trustScore)) : 0.5
        })) : []
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      return {
        confidence: 0.5,
        explanation: "Error parsing AI response. Using basic analysis.",
        sources: []
      };
    }
  } catch (error) {
    console.error('Error in Perplexity analysis:', error);
    return {
      confidence: 0.5,
      explanation: "Error in AI analysis. Using basic analysis.",
      sources: []
    };
  }
}