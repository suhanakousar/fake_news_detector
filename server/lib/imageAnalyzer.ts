import type { AnalysisResult } from "@shared/schema";
import { analyzeText } from "./analyzer";
import Tesseract from "tesseract.js";

export async function analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
  try {
    // Convert image to base64 for Tesseract
    const base64Image = imageBuffer.toString('base64');

    // Perform OCR using Tesseract.js
    const result = await Tesseract.recognize(
      `data:image/jpeg;base64,${base64Image}`,
      'eng',
      { logger: m => console.log(m) }
    );

    // Extract text from the OCR result
    const extractedText = result.data.text;

    // If no text was extracted, return an error result
    if (!extractedText || extractedText.trim() === '') {
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
