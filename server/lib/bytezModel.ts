/**
 * Bytez.js Model Wrapper for Fake News Detection
 * Uses dhruvpal/fake-news-bert model via Bytez.js
 */

import Bytez from "bytez.js";

// Bytez API key - should be in environment variables for production
// Default key for development (replace with your own in production)
const BYTEZ_API_KEY = process.env.BYTEZ_API_KEY || "349c88bd7835622d5760900f6b0f8a51";
const MODEL_NAME = "dhruvpal/fake-news-bert";

let sdk: Bytez | null = null;

/**
 * Initialize Bytez SDK (lazy initialization)
 */
function getBytezSDK(): Bytez {
  if (!sdk) {
    sdk = new Bytez(BYTEZ_API_KEY);
  }
  return sdk;
}

export interface BytezPrediction {
  error: boolean;
  prediction: "FAKE" | "REAL";
  confidence: number;
  raw?: any;
  message?: string;
}

/**
 * Predict fake news using Bytez.js BERT model
 * @param text Text to analyze
 * @returns Prediction result with label and confidence
 */
export async function predictFakeNewsWithBytez(text: string): Promise<BytezPrediction> {
  try {
    if (!text || text.trim().length === 0) {
      return {
        error: true,
        prediction: "REAL",
        confidence: 0,
        message: "Empty text provided"
      };
    }

    const bytez = getBytezSDK();
    const model = bytez.model(MODEL_NAME);

    // Run the model
    const { error, output } = await model.run(text);

    if (error) {
      console.error("Bytez model error:", error);
      return {
        error: true,
        prediction: "REAL",
        confidence: 0,
        message: "Model failed",
        raw: error
      };
    }

    // Handle different output formats
    let label: "FAKE" | "REAL";
    let confidence: number;

    if (output.label) {
      // Format: { label: "LABEL_1", score: 0.83 }
      // LABEL_0 = REAL, LABEL_1 = FAKE
      label = output.label === "LABEL_1" ? "FAKE" : "REAL";
      confidence = output.score || 0.5;
    } else if (output.fake !== undefined) {
      // Format: { fake: 0.74, real: 0.26 }
      label = output.fake > output.real ? "FAKE" : "REAL";
      confidence = Math.max(output.fake, output.real);
    } else if (Array.isArray(output) && output.length > 0) {
      // Format: [{ label: "LABEL_1", score: 0.83 }]
      const firstResult = output[0];
      label = firstResult.label === "LABEL_1" ? "FAKE" : "REAL";
      confidence = firstResult.score || 0.5;
    } else {
      console.warn("Unknown Bytez model output format:", output);
      return {
        error: true,
        prediction: "REAL",
        confidence: 0,
        message: "Unknown model output format",
        raw: output
      };
    }

    return {
      error: false,
      prediction: label,
      confidence: Math.max(0, Math.min(1, confidence)), // Clamp to 0-1
      raw: output
    };
  } catch (err) {
    console.error("Bytez runtime error:", err);
    return {
      error: true,
      prediction: "REAL",
      confidence: 0,
      message: "Runtime failure",
      raw: err
    };
  }
}

/**
 * Convert Bytez prediction to fake probability (0-1)
 * FAKE = high probability (close to 1)
 * REAL = low probability (close to 0)
 */
export function bytezPredictionToFakeProbability(prediction: BytezPrediction): number {
  if (prediction.error) {
    return 0.5; // Neutral if error
  }

  if (prediction.prediction === "FAKE") {
    // FAKE prediction: confidence directly = fake probability
    return prediction.confidence;
  } else {
    // REAL prediction: inverse of confidence = fake probability
    return 1 - prediction.confidence;
  }
}

