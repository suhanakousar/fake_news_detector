import type { AnalysisResult } from "@shared/schema";
import { analyzeText } from "./analyzer";
import { enhanceAnalysisWithAI } from "./aiEnhancer";
import axios from "axios";
import { JSDOM } from "jsdom";

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  try {
    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return {
        classification: "misleading",
        confidence: 0.7,
        reasoning: ["Invalid URL format"],
        sourceCredibility: {
          name: "Invalid URL",
          score: 0.1,
          level: "low"
        },
        factChecks: [],
        sentiment: {
          emotionalTone: "Neutral",
          emotionalToneScore: 0.5,
          languageStyle: "Unknown",
          languageStyleScore: 0.5,
          politicalLeaning: "Neutral",
          politicalLeaningScore: 0.5
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

    // Analyze the extracted text
    const analysisResult = await analyzeText(textToAnalyze);

    // Extract domain for source credibility
    const domain = new URL(url).hostname;

    // Check domain reputation (simplified)
    const knownFakeNewsDomains = [
      'fakesite.com',
      'newsisfake.org',
      'conspiracyjournal.net'
    ];

    const isKnownFakeNewsSite = knownFakeNewsDomains.some(d => domain.includes(d));

    // Override source credibility based on domain reputation
    let domainSourceCredibility = {
      name: domain,
      score: isKnownFakeNewsSite ? 0.1 : analysisResult.sourceCredibility.score,
      level: isKnownFakeNewsSite ? "low" as const : analysisResult.sourceCredibility.level
    };

    // Return combined analysis
    return {
      ...analysisResult,
      sourceCredibility: domainSourceCredibility,
      reasoning: [`Analyzed content from URL: ${url}`, ...analysisResult.reasoning]
    };
  } catch (error) {
    console.error("Error analyzing URL:", error);
    
    // Return a default error result
    return {
      classification: "misleading",
      confidence: 0.5,
      reasoning: ["Error fetching or processing URL content"],
      sourceCredibility: {
        name: "URL Source",
        score: 0.5,
        level: "medium"
      },
      factChecks: [],
      sentiment: {
        emotionalTone: "Neutral",
        emotionalToneScore: 0.5,
        languageStyle: "Unknown",
        languageStyleScore: 0.5,
        politicalLeaning: "Neutral",
        politicalLeaningScore: 0.5
      }
    };
  }
}
