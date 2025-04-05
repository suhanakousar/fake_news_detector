import { AnalysisResult } from '@shared/schema';
import { JSDOM } from 'jsdom';
import { PDFDocument } from 'pdf-lib';
import { analyzeText } from './analyzer';
import mammoth from 'mammoth';
import { enhanceAnalysisWithAI } from './aiEnhancer';

/**
 * Extract text from PDF document
 * Note: pdf-lib doesn't support text extraction directly
 * In a production environment, you would use a more robust solution like pdf.js or a server-side PDF parser
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    
    // Since pdf-lib doesn't do text extraction, we're returning a basic message
    // In a real application, use a proper PDF text extraction library
    return `This document contains ${pageCount} pages. [PDF content extraction limited in this version]`;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Extract text from DOCX document using mammoth
 */
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
}

/**
 * Extract text from HTML document
 */
function extractTextFromHtml(buffer: Buffer): string {
  try {
    const html = buffer.toString('utf-8');
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove script elements to prevent any potential code execution
    const scriptElements = document.querySelectorAll('script');
    scriptElements.forEach((el: Element) => el.remove());
    
    // Get text content
    return document.body.textContent || '';
  } catch (error) {
    console.error('Error extracting text from HTML:', error);
    throw new Error('Failed to extract text from HTML');
  }
}

/**
 * Clean and preprocess extracted text for better analysis
 */
function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple whitespaces with a single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with a single newline
    .trim();
}

export async function analyzeDocument(docBuffer: Buffer, filename: string, language: string = 'en'): Promise<AnalysisResult> {
  try {
    // Determine document type based on file extension
    const fileExt = filename.split('.').pop()?.toLowerCase();
    
    let extractedText = '';
    
    // Extract text based on document type
    switch (fileExt) {
      case 'pdf':
        extractedText = await extractTextFromPdf(docBuffer);
        break;
      case 'docx':
      case 'doc':
        extractedText = await extractTextFromDocx(docBuffer);
        break;
      case 'html':
      case 'htm':
        extractedText = extractTextFromHtml(docBuffer);
        break;
      case 'txt':
        extractedText = docBuffer.toString('utf-8');
        break;
      default:
        throw new Error('Unsupported document format');
    }
    
    // Preprocess the extracted text
    const processedText = preprocessText(extractedText);
    
    if (!processedText || processedText.length < 10) {
      throw new Error('Document contains insufficient text content for analysis');
    }
    
    // Analyze the text content
    const analysisResult = await analyzeText(processedText, language);
    
    // Enhance analysis with AI features
    const enhancedResult = await enhanceAnalysisWithAI(analysisResult, processedText, language);
    
    return enhancedResult;
  } catch (error) {
    console.error('Error analyzing document:', error);
    throw error;
  }
}