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
export async function analyzeImage(imageBuffer: Buffer, language: string = 'en'): Promise<AnalysisResult> {
  try {
    console.log('Starting OCR on image...');
    
    // Map language codes to Tesseract language codes
    const tesseractLanguageMap: Record<string, string> = {
      en: 'eng',
      es: 'spa',
      fr: 'fra',
      de: 'deu',
      it: 'ita',
      pt: 'por',
      ru: 'rus',
      zh: 'chi_sim',
      ja: 'jpn',
      ko: 'kor',
      ar: 'ara',
      hi: 'hin',
      bn: 'ben',
      ta: 'tam',
      te: 'tel',
      mr: 'mar',
      gu: 'guj',
      kn: 'kan',
      ml: 'mal',
      pa: 'pan',
      ur: 'urd'
    };
    
    // Initialize Tesseract.js worker with appropriate language data
    const tesseractLang = tesseractLanguageMap[language] || 'eng';
    console.log(`Using OCR language: ${tesseractLang} for language code: ${language}`);
    const worker = await createWorker(tesseractLang);
    
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
    const analysisResult = await analyzeText(processedText, language);
    
    // Enhance with AI features
    const enhancedResult = await enhanceAnalysisWithAI(analysisResult, processedText, language);
    
    return enhancedResult;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}