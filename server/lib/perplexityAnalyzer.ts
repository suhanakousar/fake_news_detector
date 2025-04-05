import axios from 'axios';
import { FactCheck } from './factCheck';

// Hugging Face API configuration
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const TEXT_GENERATION_API = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

// Headers for Hugging Face API requests
const headers = {
  "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
  "Content-Type": "application/json"
};

/**
 * Helper function to query Hugging Face API
 */
async function queryHuggingFaceAPI(payload: any) {
  try {
    const response = await axios.post(TEXT_GENERATION_API, payload, { headers });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 503) {
      // Model is loading, retry after a delay
      console.log(`Analysis model is loading, waiting to retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return queryHuggingFaceAPI(payload);
    }
    throw error;
  }
}

/**
 * Enhanced text analysis using Hugging Face Inference API
 * @param text Text to analyze
 * @returns Enhanced analysis results or null if API key is missing or request fails
 */
export async function analyzeWithPerplexity(text: string): Promise<{ 
  enhancedReasoning: string[] | null,
  enhancedFactChecks: FactCheck[] | null
}> {
  // If no API key is provided, return null
  if (!HUGGINGFACE_API_KEY) {
    console.warn('Hugging Face API key is missing. Skipping enhanced analysis.');
    return { enhancedReasoning: null, enhancedFactChecks: null };
  }
  
  try {
    // Truncate text to a reasonable length
    const truncatedText = text.length > 4000 ? text.substring(0, 4000) + '...(truncated)' : text;
    
    const prompt = `<s>[INST] You are an expert fact-checker and misinformation analyst. 
    
Analyze the following text for potential misinformation, fake news, or misleading content:

"""
${truncatedText}
"""

Please provide:
1. A detailed fact-check with clear reasoning (numbered points)
2. At least three reliable sources that either support or refute claims in the text (with URLs)
3. What linguistic patterns in the text could indicate misinformation

Be objective, thorough, and focus only on facts. [/INST]</s>`;

    const response = await queryHuggingFaceAPI({
      inputs: prompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.2,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false
      }
    });
    
    let analysisContent = '';
    if (response && response[0] && response[0].generated_text) {
      analysisContent = response[0].generated_text;
    } else {
      return { enhancedReasoning: null, enhancedFactChecks: null };
    }
    
    // Extract reasoning points from the response (lines that start with a number or bullet)
    const reasoningLines = analysisContent
      .split('\n')
      .filter(line => {
        const trimmedLine = line.trim();
        // Match lines that start with a number, bullet point, or asterisk
        return /^(\d+[\.\):]|\*|\-)\s+.+/.test(trimmedLine) && 
               trimmedLine.length > 10; // Ensure it's not just a number or bullet
      })
      .map(line => line.trim())
      .slice(0, 5); // Take up to 5 key points
    
    // Extract source URLs using regex
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const extractedUrls = analysisContent.match(urlRegex) || [];
    
    // For each URL, try to extract a title from the surrounding text
    const enhancedFactChecks: FactCheck[] = [];
    
    for (let i = 0; i < Math.min(extractedUrls.length, 3); i++) {
      const url = extractedUrls[i];
      
      // Find a title by looking for text around the URL
      const urlIndex = analysisContent.indexOf(url);
      const beforeUrl = analysisContent.substring(Math.max(0, urlIndex - 100), urlIndex).trim();
      const afterUrl = analysisContent.substring(urlIndex + url.length, Math.min(analysisContent.length, urlIndex + url.length + 100)).trim();
      
      // Try to extract a title from text around the URL
      let title = 'Referenced Source';
      
      // Check if there's a line with a title-like format before the URL
      const beforeLines = beforeUrl.split('\n').reverse();
      for (const line of beforeLines) {
        if (line.length > 10 && line.length < 100 && !line.includes('http')) {
          title = line.trim().replace(/^[\d\.\-\*)\s]+/, ''); // Remove any bullets or numbers
          break;
        }
      }
      
      // If no title found, try the first line after the URL
      if (title === 'Referenced Source') {
        const afterLines = afterUrl.split('\n');
        for (const line of afterLines) {
          if (line.length > 10 && line.length < 100 && !line.includes('http')) {
            title = line.trim().replace(/^[\d\.\-\*)\s]+/, '');
            break;
          }
        }
      }
      
      // Extract the hostname as the source
      let source = 'Referenced Source';
      try {
        source = new URL(url).hostname.replace('www.', '');
      } catch (e) {
        // If URL parsing fails, use default
      }
      
      enhancedFactChecks.push({
        source,
        title,
        snippet: 'External reference from analysis',
        url
      });
    }
    
    // If we couldn't extract real URLs, create dummy fact checks from the content
    if (enhancedFactChecks.length === 0) {
      // Split content into "source-like" sections
      const sections = analysisContent.split(/Source \d+:|Reference \d+:|Reliable Source \d+:/).filter(s => s.trim().length > 20);
      
      for (let i = 0; i < Math.min(sections.length, 3); i++) {
        const section = sections[i].trim();
        const firstLine = section.split('\n')[0].trim();
        
        enhancedFactChecks.push({
          source: `Analysis Source ${i + 1}`,
          title: firstLine.length > 10 ? firstLine : `Analysis Point ${i + 1}`,
          snippet: section.substring(0, 150) + '...',
          url: 'https://huggingface.co/models' // Use HF models page as fallback
        });
      }
    }
    
    return {
      enhancedReasoning: reasoningLines.length > 0 ? reasoningLines : null,
      enhancedFactChecks: enhancedFactChecks.length > 0 ? enhancedFactChecks : null
    };
  } catch (error) {
    console.error('Error with Hugging Face analysis:', error);
    return { enhancedReasoning: null, enhancedFactChecks: null };
  }
}