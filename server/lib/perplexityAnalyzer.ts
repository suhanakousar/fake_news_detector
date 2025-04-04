import axios from 'axios';
import { FactCheck } from './factCheck';

interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Enhanced text analysis using Perplexity AI API
 * @param text Text to analyze
 * @returns Enhanced analysis results or null if API key is missing or request fails
 */
export async function analyzeWithPerplexity(text: string): Promise<{ 
  enhancedReasoning: string[] | null,
  enhancedFactChecks: FactCheck[] | null
}> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  // If no API key is provided, return null
  if (!apiKey) {
    console.warn('Perplexity API key is missing. Skipping enhanced analysis.');
    return { enhancedReasoning: null, enhancedFactChecks: null };
  }
  
  try {
    const prompt = `
    Analyze the following text for potential misinformation, fake news, or misleading content:
    
    ${text.substring(0, 4000)} ${text.length > 4000 ? '...(truncated)' : ''}
    
    Please provide:
    1. A detailed fact-check with clear reasoning (numbered points)
    2. At least three reliable sources that either support or refute claims in the text
    3. What linguistic patterns in the text could indicate misinformation
    
    Be objective, thorough, and focus only on facts.
    `;
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert fact-checker and misinformation analyst. Analyze text objectively and thoroughly, providing clear evidence and reasoning.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = response.data as PerplexityResponse;
    const analysisContent = data.choices[0]?.message.content || '';
    
    // Extract reasoning and fact check information from the response
    const reasoningLines = analysisContent
      .split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, 5); // Take up to 5 key points
    
    // Extract sources/citations (simple implementation)
    const sources = data.citations || [];
    const enhancedFactChecks = sources.map((url, index) => ({
      source: url.includes('://') ? new URL(url).hostname.replace('www.', '') : 'Referenced Source',
      title: `Source ${index + 1}`,
      snippet: 'External reference from Perplexity AI analysis',
      url: url
    }));
    
    return {
      enhancedReasoning: reasoningLines,
      enhancedFactChecks: enhancedFactChecks.slice(0, 3) // Take up to 3 sources
    };
  } catch (error) {
    console.error('Error with Perplexity AI analysis:', error);
    return { enhancedReasoning: null, enhancedFactChecks: null };
  }
}