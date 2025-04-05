import axios from 'axios';
import { AnalysisResult } from '@shared/schema';

// Hugging Face API configuration
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Model endpoint for the chatbot
const CHATBOT_MODEL_API = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

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
    const response = await axios.post(CHATBOT_MODEL_API, payload, { headers });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 503) {
      // Model is loading, retry after a delay
      console.log(`Chatbot model is loading, waiting to retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return queryHuggingFaceAPI(payload);
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
  analysisResult: AnalysisResult
): Promise<string> {
  // Extract classification and reasoning from analysisResult
  const analysisClassification = analysisResult.classification;
  const reasoningPoints = analysisResult.reasoning;
  
  if (!HUGGINGFACE_API_KEY) {
    return "Sorry, the AI assistant is currently unavailable. Please try again later.";
  }

  try {
    // Prepare the prompt with analysis context
    const truncatedContent = contentContext.length > 1000 ? 
      contentContext.substring(0, 1000) + '...' : 
      contentContext;
    
    const reasoningText = reasoningPoints.join("\n- ");
    
    const chatPrompt = `<s>[INST] You are TruthLens AI Assistant, an expert in fact-checking and misinformation analysis. 
    
You're answering a question about content that has been classified as "${analysisClassification}" based on the following reasoning:
- ${reasoningText}

Content: "${truncatedContent}"

User question: ${question}

Provide a helpful, accurate, and concise answer focusing specifically on the question. Base your response only on factual information. [/INST]</s>`;

    // Query the model
    const response = await queryHuggingFaceAPI({
      inputs: chatPrompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.2,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false
      }
    });

    // Extract and return the generated text
    if (response && response[0] && response[0].generated_text) {
      return response[0].generated_text.trim();
    }

    return "Sorry, I couldn't generate a response. Please try a different question.";
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    return "Sorry, an error occurred while generating a response. Please try again later.";
  }
}