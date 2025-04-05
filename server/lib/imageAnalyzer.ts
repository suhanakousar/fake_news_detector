import { AnalysisResult } from '@shared/schema';
import { createWorker } from 'tesseract.js';
import { analyzeText } from './analyzer';
import { enhanceAnalysisWithAI } from './aiEnhancer';

/**
 * Clean and preprocess extracted text for better analysis
 */
function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespaces with a single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with a single newline
    .trim();
}

/**
 * Extracts and analyzes text from images using OCR
 */
export async function analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
  try {
    console.log('Starting OCR on image...');
    
    // Initialize Tesseract.js worker with English language data
    const worker = await createWorker('eng');
    
    // Perform OCR on the image
    const { data: { text } } = await worker.recognize(imageBuffer);
    
    // Terminate the worker
    await worker.terminate();
    
    console.log('OCR completed. Extracted text length:', text.length);
    
    if (!text || text.trim().length < 10) {
      throw new Error('No readable text detected in the image');
    }
    
    const processedText = preprocessText(text);
    
    // Analyze the extracted text
    const analysisResult = await analyzeText(processedText);
    
    // Enhance with AI features
    const enhancedResult = await enhanceAnalysisWithAI(analysisResult, processedText);
    
    return enhancedResult;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}