import { AnalysisResult } from '@shared/schema';
import axios from 'axios';

// Hugging Face API configuration
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Model endpoints
const SUMMARY_MODEL_API = "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";
const FAKE_NEWS_CLASSIFIER_API = "https://api-inference.huggingface.co/models/MoritzLaurer/DeBERTa-v3-large-mnli-fever-anli-ling-wanli";
const TEXT_GENERATION_API = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

// Headers for Hugging Face API requests
const headers = {
  "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
  "Content-Type": "application/json"
};

/**
 * Helper function to query Hugging Face API
 */
async function queryHuggingFaceAPI(apiUrl: string, payload: any) {
  try {
    const response = await axios.post(apiUrl, payload, { headers });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 503) {
      // Model is loading, retry after a delay
      console.log(`Model is loading, waiting to retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return queryHuggingFaceAPI(apiUrl, payload);
    }
    throw error;
  }
}

/**
 * Generates a concise summary of the article content using BART model
 * @param text The article text to summarize
 * @returns A concise summary of the article
 */
export async function generateArticleSummary(text: string): Promise<string | null> {
  if (!HUGGINGFACE_API_KEY) {
    console.log('Hugging Face API key not available, skipping article summarization');
    return null;
  }

  try {
    // Truncate text if it's too long for the model
    const truncatedText = text.length > 3000 ? text.substring(0, 3000) + '...' : text;
    
    const payload = {
      inputs: truncatedText,
      parameters: {
        max_length: 150,
        min_length: 40,
        do_sample: false
      }
    };
    
    const summaryResponse = await queryHuggingFaceAPI(SUMMARY_MODEL_API, payload);
    
    if (Array.isArray(summaryResponse) && summaryResponse.length > 0) {
      // Handle array response format
      return summaryResponse[0].summary_text;
    } else if (summaryResponse.summary_text) {
      // Handle object response format
      return summaryResponse.summary_text;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating article summary:', error);
    return null;
  }
}

/**
 * Generate explainable AI details that highlight why content was detected as fake or real
 * @param result The current analysis result
 * @param text The analyzed text content
 * @returns Enhanced analysis result with XAI details
 */
export async function generateXaiDetails(result: AnalysisResult, text: string): Promise<AnalysisResult> {
  if (!HUGGINGFACE_API_KEY) {
    console.log('Hugging Face API key not available, skipping XAI enhancement');
    return result;
  }

  try {
    // Truncate text if it's too long for the model
    const truncatedText = text.length > 2500 ? text.substring(0, 2500) + '...' : text;
    
    // First, let's use a natural language inference model to classify sentences
    // For entailment/contradiction with statements about fake news
    const statements = [
      "This text contains factual information.",
      "This text contains misinformation.",
      "This text uses sensationalist language.",
      "This text cites credible sources.",
      "This text makes unsupported claims."
    ];
    
    // Create pairs of text with each statement for classification
    const pairs = statements.map(statement => ({
      text: truncatedText.substring(0, 500), // Take first part of text
      hypothesis: statement
    }));
    
    // Get classification results
    const classificationResults = await queryHuggingFaceAPI(FAKE_NEWS_CLASSIFIER_API, {
      inputs: pairs
    });
    
    // Extract key phrases using text generation model
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

    const phrasesResponse = await queryHuggingFaceAPI(TEXT_GENERATION_API, {
      inputs: generationPrompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.3,
        return_full_text: false
      }
    });
    
    let keyPhrases = [];
    if (phrasesResponse && phrasesResponse[0] && phrasesResponse[0].generated_text) {
      // Extract JSON from the generated text
      const jsonMatch = phrasesResponse[0].generated_text.match(/\{[\s\S]*\}/);
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
    
    // Generate alternative sources and detection confidence using the text generation model
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

    const detailsResponse = await queryHuggingFaceAPI(TEXT_GENERATION_API, {
      inputs: detailsPrompt,
      parameters: {
        max_new_tokens: 1000,
        temperature: 0.3,
        return_full_text: false
      }
    });
    
    let detectionConfidence = [];
    let alternativeSources = [];
    
    if (detailsResponse && detailsResponse[0] && detailsResponse[0].generated_text) {
      // Extract JSON from the generated text
      const jsonMatch = detailsResponse[0].generated_text.match(/\{[\s\S]*\}/);
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
    
    // Define type for classification results
    interface ClassificationResult {
      label: string;
      score: number;
    }
    
    interface ClassificationInsight {
      statement: string;
      result: string;
      confidence: number;
    }
    
    // Process classification results to get insights
    const classificationInsights = classificationResults ? 
      classificationResults.map((classResult: ClassificationResult[], index: number) => {
        if (!classResult || !Array.isArray(classResult)) return null;
        
        // Find the highest probability class (entailment, contradiction, neutral)
        const maxProbClass = classResult.reduce(
          (max: ClassificationResult, current: ClassificationResult) => 
            current.score > max.score ? current : max, 
          { label: "", score: 0 }
        );
        
        return {
          statement: statements[index],
          result: maxProbClass.label,
          confidence: maxProbClass.score
        };
      }).filter((insight): insight is ClassificationInsight => Boolean(insight)) : [];
    
    // Use classification insights to create detection confidence if none were generated
    if (detectionConfidence.length === 0 && classificationInsights.length > 0) {
      detectionConfidence = classificationInsights.map((insight: ClassificationInsight) => ({
        algorithm: `NLI Classification: "${insight.statement}"`,
        score: insight.confidence,
        explanation: `Natural Language Inference model determines if the content ${
          insight.result === 'entailment' ? 'supports' : 
          insight.result === 'contradiction' ? 'contradicts' : 
          'is neutral toward'
        } this statement.`
      }));
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
 * @returns Enhanced analysis result with AI features
 */
export async function enhanceAnalysisWithAI(result: AnalysisResult, text: string): Promise<AnalysisResult> {
  try {
    // Run article summary and XAI enhancement in parallel
    const [summary, enhancedResult] = await Promise.all([
      generateArticleSummary(text),
      generateXaiDetails(result, text)
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