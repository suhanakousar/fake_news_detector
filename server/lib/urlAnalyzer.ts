import type { AnalysisResult } from "@shared/schema";
import { analyzeText } from "./analyzer";
import axios from "axios";
import { JSDOM } from "jsdom";

/**
 * Extract author information from HTML meta tags
 */
function extractAuthor(document: Document): string | undefined {
  // Try various meta tags for author
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '[rel="author"]',
    '.author',
    '.byline',
    '[itemprop="author"]'
  ];

  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || 
                     element.getAttribute('href') || 
                     element.textContent;
      if (content && content.trim().length > 0) {
        return content.trim();
      }
    }
  }

  return undefined;
}

export async function analyzeUrl(url: string, language: string = 'en'): Promise<AnalysisResult> {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      // Return error result using the new schema
      return {
        classification: "misleading",
        confidence: 0.7,
        explanation: "Invalid URL format provided",
        sources: [],
        patterns: {
          sensationalist: 0,
          unreliableSource: 0,
          unverifiedClaims: 0
        }
      };
    }

    // Fetch website content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 seconds timeout
    });

    // Parse HTML
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    // Extract webpage title
    const title = document.querySelector('title')?.textContent || 'No title';

    // Get meta description
    const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    // Extract author information
    const author = extractAuthor(document);

    // Extract article content
    let content = '';

    // Try to find main article content using common selectors
    const possibleContentSelectors = [
      'article',
      '.article',
      '.post',
      '.content',
      'main',
      '#main',
      '.main',
      '.story'
    ];

    for (const selector of possibleContentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.textContent || '';
        break;
      }
    }

    // If no specific content container found, use body text
    if (!content) {
      // Remove script and style elements
      const scriptElements = document.querySelectorAll('script, style');
      scriptElements.forEach((el: Element) => el.remove());
      
      // Get body text
      content = document.body.textContent || '';
    }

    // Clean and normalize text
    content = content
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim();

    // Combine title, description, and content
    const textToAnalyze = `${title} ${metaDescription} ${content}`;

    // Use the 5-step pipeline with URL and author information
    // This will automatically analyze the source in Step 3
    const analysisResult = await analyzeText(textToAnalyze, language, url, author);

    // Enhance explanation to mention URL analysis
    const enhancedExplanation = `Analyzed content from URL: ${url}. ${analysisResult.explanation}`;

    return {
      ...analysisResult,
      explanation: enhancedExplanation
    };
  } catch (error) {
    console.error("Error analyzing URL:", error);
    
    // Return a default error result
    return {
      classification: "misleading",
      confidence: 0.5,
      explanation: "Error fetching or processing URL content. Please check if the URL is accessible.",
      sources: [],
      patterns: {
        sensationalist: 0,
        unreliableSource: 0,
        unverifiedClaims: 0
      }
    };
  }
}
