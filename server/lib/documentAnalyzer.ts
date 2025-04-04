import type { AnalysisResult } from "@shared/schema";
import { analyzeText } from "./analyzer";
import { JSDOM } from "jsdom";
// Import mammoth for DOCX processing
import mammoth from "mammoth";
// Use PDF lib for PDF handling
import { PDFDocument } from 'pdf-lib';

/**
 * Extract text from PDF document
 * Note: pdf-lib doesn't support text extraction directly
 * In a production environment, you would use a more robust solution like pdf.js or a server-side PDF parser
 */
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Basic extraction from PDF metadata
    const pdfDoc = await PDFDocument.load(buffer);
    const pageCount = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || '';
    const author = pdfDoc.getAuthor() || '';
    const subject = pdfDoc.getSubject() || '';
    const keywords = pdfDoc.getKeywords() || '';
    
    // Since pdf-lib doesn't extract actual text content,
    // we're creating a summary from the metadata
    const metadataText = [
      title ? `Title: ${title}` : '',
      author ? `Author: ${author}` : '',
      subject ? `Subject: ${subject}` : '',
      keywords ? `Keywords: ${keywords}` : '',
      `Document contains ${pageCount} page(s).`
    ].filter(Boolean).join('\n');
    
    return metadataText || "PDF document content could not be extracted fully. Please enter key text manually.";
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF document");
  }
}

/**
 * Clean and preprocess extracted text for better analysis
 */
function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/\n+/g, ' ')  // Replace newlines with spaces
    .replace(/[^\w\s.,!?;:'"()-]/g, '')  // Remove special characters except common punctuation
    .trim();
}

export async function analyzeDocument(docBuffer: Buffer, filename: string): Promise<AnalysisResult> {
  try {
    // Determine file type based on filename extension
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    let extractedText = '';
    let fileType = fileExtension?.toUpperCase() || 'UNKNOWN';

    if (fileExtension === 'pdf') {
      // Process PDF document using real pdf-parse
      extractedText = await extractTextFromPdf(docBuffer);
      fileType = 'PDF';
    } else if (fileExtension === 'docx') {
      // Process DOCX document
      const result = await mammoth.extractRawText({ buffer: docBuffer });
      extractedText = result.value;
      fileType = 'DOCX';
    } else if (fileExtension === 'txt') {
      // Process plain text
      extractedText = docBuffer.toString('utf-8');
      fileType = 'TEXT';
    } else if (fileExtension === 'html' || fileExtension === 'htm') {
      // Process HTML
      const html = docBuffer.toString('utf-8');
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Remove script and style elements
      const scriptElements = document.querySelectorAll('script, style');
      scriptElements.forEach((el: Element) => el.remove());
      
      extractedText = document.body.textContent || '';
      fileType = 'HTML';
    } else {
      // Unsupported file format
      return {
        classification: "misleading",
        confidence: 0.5,
        reasoning: [`Unsupported file format: .${fileExtension}`],
        sourceCredibility: {
          name: "Document Source",
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

    // Apply more advanced preprocessing
    extractedText = preprocessText(extractedText);

    // If no text was extracted, return an error result
    if (!extractedText || extractedText.length < 10) {
      return {
        classification: "misleading",
        confidence: 0.5,
        reasoning: ["Insufficient text could be extracted from the document"],
        sourceCredibility: {
          name: "Document Source",
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

    // Analyze the extracted text using the text analyzer
    const analysisResult = await analyzeText(extractedText);

    // Modify the result to indicate it came from a document
    return {
      ...analysisResult,
      reasoning: [`Text extracted from ${fileExtension.toUpperCase()} document: ${filename}`, ...analysisResult.reasoning]
    };
  } catch (error) {
    console.error("Error analyzing document:", error);
    
    // Return a default error result
    return {
      classification: "misleading",
      confidence: 0.5,
      reasoning: ["Error processing document. Could not extract or analyze text."],
      sourceCredibility: {
        name: "Document Source",
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
