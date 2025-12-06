import axios from 'axios';
import { AnalysisResult } from '@shared/schema';

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
    
    console.log('[CHATBOT] Making request to Gemini API...');
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
        },
        timeout: 30000 // 30 second timeout
      }
    );
    console.log('[CHATBOT] API request successful, status:', response.status);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[CHATBOT] API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        code: error.code
      });
      
      if (error.response?.status === 503) {
        // Service temporarily unavailable, retry after a delay (max 2 retries)
        console.log('[CHATBOT] Gemini API is temporarily unavailable, waiting to retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        try {
          console.log('[CHATBOT] Retrying API request...');
          const retryResponse = await axios.post(
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
              },
              timeout: 30000
            }
          );
          console.log('[CHATBOT] Retry successful');
          return retryResponse.data;
        } catch (retryError) {
          console.error('[CHATBOT] Retry failed:', retryError);
          throw new Error('Chatbot model is unavailable. Please try again later.');
        }
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('[CHATBOT] API key authentication error');
        throw new Error('API key error. Gemini API key may be invalid.');
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        console.error('[CHATBOT] Request timeout');
        throw new Error('Request timeout. The AI service may be slow or unavailable.');
      } else if (error.response?.data) {
        console.error('[CHATBOT] API error response:', JSON.stringify(error.response.data).substring(0, 200));
      }
    } else {
      console.error('[CHATBOT] Unknown error:', error);
    }
    throw error;
  }
}

/**
 * Generate a response from the AI debunker chatbot
 * 
 * @param question User's question about the analyzed content
 * @param contentContext The analyzed content for context
 * @param analysisResult The analysis result for reference
 * @returns AI-generated response to the user's question
 */
export async function generateChatbotResponse(
  question: string,
  contentContext: string,
  analysisResult: AnalysisResult,
  language: string = 'en'
): Promise<string> {
  // Extract classification and reasoning from analysisResult
  const analysisClassification = analysisResult.classification;
  // Use explanation instead of reasoning (which doesn't exist in schema)
  const reasoningPoints = analysisResult.explanation 
    ? analysisResult.explanation.split('. ').filter(p => p.trim().length > 0)
    : [];
  
  // Define language-specific error messages
  const errorMessages: Record<string, { notAvailable: string, noResponse: string, error: string }> = {
    en: {
      notAvailable: "Sorry, the AI assistant is currently unavailable. Please try again later.",
      noResponse: "Sorry, I couldn't generate a response. Please try a different question.",
      error: "Sorry, an error occurred while generating a response. Please try again later."
    },
    es: {
      notAvailable: "Lo siento, el asistente de IA no está disponible actualmente. Por favor, inténtalo de nuevo más tarde.",
      noResponse: "Lo siento, no pude generar una respuesta. Por favor, intenta con una pregunta diferente.",
      error: "Lo siento, ocurrió un error al generar una respuesta. Por favor, inténtalo de nuevo más tarde."
    },
    fr: {
      notAvailable: "Désolé, l'assistant IA n'est pas disponible pour le moment. Veuillez réessayer plus tard.",
      noResponse: "Désolé, je n'ai pas pu générer de réponse. Veuillez essayer une question différente.",
      error: "Désolé, une erreur s'est produite lors de la génération d'une réponse. Veuillez réessayer plus tard."
    },
    hi: {
      notAvailable: "क्षमा करें, AI सहायक वर्तमान में उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      noResponse: "क्षमा करें, मैं एक प्रतिक्रिया उत्पन्न नहीं कर सका। कृपया एक अलग प्रश्न का प्रयास करें।",
      error: "क्षमा करें, प्रतिक्रिया उत्पन्न करते समय एक त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।"
    }
    // Add other languages as needed
  };

  // Default to English if language-specific error messages aren't available
  const currentErrorMessages = errorMessages[language] || errorMessages.en;
  
  // Answer the question based on analysis, even without API key
  const shortExplanation = analysisResult.explanation?.substring(0, 300) || 'Analysis completed';
  
  // Get fact checks and sources for better context
  const factChecks = (analysisResult as any).factChecks || [];
  const sources = analysisResult.sources || [];
  
  // Provide intelligent response based on question type
  const questionLower = question.toLowerCase();
  
  if (!GEMINI_API_KEY) {
    console.log('[CHATBOT] No Gemini API key found - using intelligent fallback response');
    
    // Answer "Why is this misleading?" type questions
    if (questionLower.includes('why') && (questionLower.includes('misleading') || questionLower.includes('fake'))) {
      return `This content is classified as ${analysisClassification.toUpperCase()} (${Math.round(analysisResult.confidence * 100)}% confidence) because: ${shortExplanation}. ${factChecks.length > 0 ? `Fact-checkers have found: ${factChecks.slice(0, 2).map((fc: any) => fc.snippet).join('; ')}.` : ''}`;
    }
    
    // Answer "What are reliable sources?" type questions
    if (questionLower.includes('source') || questionLower.includes('reliable') || questionLower.includes('verify')) {
      const sourceList = sources.length > 0 
        ? sources.slice(0, 3).map(s => `${s.title} (${s.url})`).join('\n- ')
        : 'No specific sources found in this analysis. I recommend checking with established fact-checking organizations like Reuters, AP News, or Snopes.';
      return `For reliable sources on this topic:\n- ${sourceList}${factChecks.length > 0 ? `\n\nFact-check sources:\n- ${factChecks.slice(0, 3).map((fc: any) => `${fc.source}: ${fc.url}`).join('\n- ')}` : ''}`;
    }
    
    // Answer "Can you debunk?" type questions
    if (questionLower.includes('debunk') || questionLower.includes('false')) {
      return `Based on the analysis, this content contains false or misleading claims. ${shortExplanation}. ${factChecks.length > 0 ? `Fact-checkers have verified: ${factChecks.map((fc: any) => fc.snippet).join('; ')}.` : 'I recommend verifying this information with reliable sources.'}`;
    }
    
    // Use the helper function for consistency
    return getIntelligentFallbackResponse(question, analysisResult, analysisClassification, factChecks, sources);
  }

  console.log('[CHATBOT] Generating response for question:', question.substring(0, 50));
  console.log('[CHATBOT] Classification:', analysisClassification);
  console.log('[CHATBOT] Confidence:', analysisResult.confidence);

  try {
    // Prepare the prompt with analysis context
    const truncatedContent = contentContext.length > 1000 ? 
      contentContext.substring(0, 1000) + '...' : 
      contentContext;
    
    // Build reasoning text from explanation
    const reasoningText = reasoningPoints.length > 0 
      ? reasoningPoints.slice(0, 5).join("\n- ") // Limit to 5 points
      : analysisResult.explanation || 'No specific reasoning available';
    
    // Get fact checks if available
    const factChecks = (analysisResult as any).factChecks || [];
    const factCheckInfo = factChecks.length > 0
      ? `\n\nFact-check sources found:\n${factChecks.slice(0, 3).map((fc: any) => `- ${fc.source}: ${fc.snippet}`).join('\n')}`
      : '';
    
    const chatPrompt = `You are TruthLens AI Assistant, an expert in fact-checking and misinformation analysis. 
    
You're answering a question about content that has been classified as "${analysisClassification.toUpperCase()}" (${Math.round(analysisResult.confidence * 100)}% confidence) based on the following analysis:

${reasoningText}${factCheckInfo}

Content analyzed: "${truncatedContent}"

User question: ${question}

Provide a helpful, accurate, and concise answer focusing specifically on the question. Base your response only on factual information from the analysis above. If the content is classified as FAKE or MISLEADING, explain why. If it's REAL, confirm the key facts.

IMPORTANT: Your response MUST be in ${language} language. Keep it concise (2-4 sentences).`;

    // Query the model
    console.log('[CHATBOT] Calling Gemini API...');
    const response = await queryGeminiAPI(chatPrompt);

    console.log('[CHATBOT] API Response type:', typeof response);
    if (response && typeof response === 'object') {
      console.log('[CHATBOT] API Response keys:', Object.keys(response));
    }

    // Extract and return the generated text from Gemini response
    let generatedText = '';
    
    if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      generatedText = response.candidates[0].content.parts[0].text.trim();
      console.log('[CHATBOT] Extracted text from Gemini response, length:', generatedText.length);
    } else {
      console.log('[CHATBOT] Unexpected response format:', JSON.stringify(response).substring(0, 200));
    }
    
    // Return the generated text
    if (generatedText && generatedText.length > 0) {
      console.log('[CHATBOT] Successfully generated response, length:', generatedText.length);
      return generatedText;
    } else {
      console.log('[CHATBOT] No generated text found in response');
    }

    // If no valid response from AI, provide a fallback based on the analysis
    console.log('[CHATBOT] Using fallback response based on analysis');
    const shortExplanation = analysisResult.explanation?.substring(0, 200) || 'Analysis completed';
    
    if (analysisClassification === 'fake') {
      return `Based on the analysis, this content has been classified as FAKE (${Math.round(analysisResult.confidence * 100)}% confidence). ${shortExplanation}. I recommend verifying this information with reliable sources.`;
    } else if (analysisClassification === 'misleading') {
      return `This content has been classified as MISLEADING (${Math.round(analysisResult.confidence * 100)}% confidence). ${shortExplanation}. Some claims may require additional verification.`;
    } else {
      return `This content appears to be REAL (${Math.round(analysisResult.confidence * 100)}% confidence). ${shortExplanation}. The analysis suggests this information is credible.`;
    }
  } catch (error) {
    console.error('[CHATBOT] Error generating chatbot response:', error);
    if (error instanceof Error) {
      console.error('[CHATBOT] Error message:', error.message);
      console.error('[CHATBOT] Error stack:', error.stack);
    }
    // Return intelligent fallback even on error
    return getIntelligentFallbackResponse(question, analysisResult, analysisClassification, factChecks, sources);
  }
}

// Helper function to generate intelligent fallback responses
function getIntelligentFallbackResponse(
  question: string,
  analysisResult: AnalysisResult,
  analysisClassification: string,
  factChecks: any[],
  sources: any[]
): string {
  const shortExplanation = analysisResult.explanation?.substring(0, 300) || 'Analysis completed';
  const questionLower = question.toLowerCase();
  
  // Answer "Why is this misleading?" type questions
  if (questionLower.includes('why') && (questionLower.includes('misleading') || questionLower.includes('fake'))) {
    return `This content is classified as ${analysisClassification.toUpperCase()} (${Math.round(analysisResult.confidence * 100)}% confidence) because: ${shortExplanation}. ${factChecks.length > 0 ? `Fact-checkers have found: ${factChecks.slice(0, 2).map((fc: any) => fc.snippet).join('; ')}.` : ''}`;
  }
  
  // Answer "What are reliable sources?" type questions
  if (questionLower.includes('source') || questionLower.includes('reliable') || questionLower.includes('verify')) {
    const sourceList = sources.length > 0 
      ? sources.slice(0, 3).map(s => `${s.title} (${s.url})`).join('\n- ')
      : 'No specific sources found in this analysis. I recommend checking with established fact-checking organizations like Reuters, AP News, or Snopes.';
    return `For reliable sources on this topic:\n- ${sourceList}${factChecks.length > 0 ? `\n\nFact-check sources:\n- ${factChecks.slice(0, 3).map((fc: any) => `${fc.source}: ${fc.url}`).join('\n- ')}` : ''}`;
  }
  
  // Answer "Can you debunk?" type questions
  if (questionLower.includes('debunk') || questionLower.includes('false')) {
    return `Based on the analysis, this content contains false or misleading claims. ${shortExplanation}. ${factChecks.length > 0 ? `Fact-checkers have verified: ${factChecks.map((fc: any) => fc.snippet).join('; ')}.` : 'I recommend verifying this information with reliable sources.'}`;
  }
  
  // Generic response based on classification
  if (analysisClassification === 'fake') {
    return `Based on the analysis, this content has been classified as FAKE (${Math.round(analysisResult.confidence * 100)}% confidence). ${shortExplanation}. I recommend verifying this information with reliable sources.`;
  } else if (analysisClassification === 'misleading') {
    return `This content has been classified as MISLEADING (${Math.round(analysisResult.confidence * 100)}% confidence). ${shortExplanation}. Some claims may require additional verification.`;
  } else {
    return `This content appears to be REAL (${Math.round(analysisResult.confidence * 100)}% confidence). ${shortExplanation}. The analysis suggests this information is credible.`;
  }
}