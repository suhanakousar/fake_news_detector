import type { AnalysisResult } from "@shared/schema";
import { analyzeText } from "./analyzer";
import { JSDOM } from "jsdom";
// Import mammoth for DOCX processing
import mammoth from "mammoth";

// Mock PDF processing function to avoid pdf-parse dependency issues
async function mockPdfParse(buffer: Buffer): Promise<{ text: string }> {
  // In a real implementation, we would use pdf-parse
  // But for now, we'll return placeholder text
  return { text: "This is extracted text from a PDF document. For demonstration purposes only." };
}

export async function analyzeDocument(docBuffer: Buffer, filename: string): Promise<AnalysisResult> {
  try {
    // Determine file type based on filename extension
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    let extractedText = '';

    if (fileExtension === 'pdf') {
      // Process PDF document using mock function
      const data = await mockPdfParse(docBuffer);
      extractedText = data.text;
    } else if (fileExtension === 'docx') {
      // Process DOCX document
      const result = await mammoth.extractRawText({ buffer: docBuffer });
      extractedText = result.value;
    } else if (fileExtension === 'txt') {
      // Process plain text
      extractedText = docBuffer.toString('utf-8');
    } else if (fileExtension === 'html' || fileExtension === 'htm') {
      // Process HTML
      const html = docBuffer.toString('utf-8');
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Remove script and style elements
      const scriptElements = document.querySelectorAll('script, style');
      scriptElements.forEach((el: Element) => el.remove());
      
      extractedText = document.body.textContent || '';
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

    // Clean extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim();

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
