import type { AnalysisResult } from "@shared/schema";
import { analyzeText } from "./analyzer";
import Tesseract from "tesseract.js";

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

/**
 * Extracts and analyzes text from images using OCR
 */
export async function analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
  try {
    // Convert image to base64 for Tesseract
    const base64Image = imageBuffer.toString('base64');

    // Configure OCR options for better accuracy
    const ocrOptions = {
      logger: (m: any) => console.log(m),
      workerOptions: {
        langPath: './eng.traineddata', // Path to language data
      },
      // Improve OCR quality with these settings
      engineOptions: {
        tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?;:\'"()-',
      }
    };

    // Perform OCR using Tesseract.js with improved configuration
    const result = await Tesseract.recognize(
      `data:image/jpeg;base64,${base64Image}`,
      'eng',
      ocrOptions
    );

    // Extract text from the OCR result and preprocess it
    let extractedText = result.data.text;
    extractedText = preprocessText(extractedText);

    // Get confidence score from OCR
    const confidence = result.data.confidence / 100; // Convert to 0-1 scale

    // If no text was extracted or confidence is too low, return an error result
    if (!extractedText || extractedText.trim() === '' || confidence < 0.2) {
      return {
        classification: "misleading",
        confidence: 0.5,
        reasoning: ["No text could be extracted from the image"],
        sourceCredibility: {
          name: "Image Source",
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

    // Modify the result to indicate it came from an image
    return {
      ...analysisResult,
      reasoning: ["Text extracted from image: " + extractedText.substring(0, 100) + "...", ...analysisResult.reasoning]
    };
  } catch (error) {
    console.error("Error analyzing image:", error);
    
    // Return a default error result
    return {
      classification: "misleading",
      confidence: 0.5,
      reasoning: ["Error processing image. Could not extract or analyze text."],
      sourceCredibility: {
        name: "Image Source",
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
