import type { AnalysisResult } from "@shared/schema";
import { fetchFactChecks } from "./factCheck";

// This is a simplified mock implementation for the backend analyzer
// In a real-world implementation, this would connect to actual AI models

export async function analyzeText(text: string): Promise<AnalysisResult> {
  // Simple detection based on keywords
  const lowerText = text.toLowerCase();

  // Define patterns for fake news detection
  const sensationalistPatterns = [
    "shocking", "you won't believe", "mind-blowing", "secret", "they don't want you to know",
    "conspiracy", "cover-up", "scandal", "shocking truth", "government hiding"
  ];

  const unreliableSourcePatterns = [
    "anonymous source", "unnamed expert", "some people say", "many believe",
    "scientists claim", "experts say", "insider reveals"
  ];

  const unverifiedClaimsPatterns = [
    "miracle", "instant", "guaranteed", "proven", "revolutionary", "breakthrough",
    "never before seen", "hidden", "secret remedy", "they're hiding", "nasa hiding"
  ];

  // Count matches
  const sensationalistCount = sensationalistPatterns.filter(pattern => lowerText.includes(pattern)).length;
  const unreliableSourceCount = unreliableSourcePatterns.filter(pattern => lowerText.includes(pattern)).length;
  const unverifiedClaimsCount = unverifiedClaimsPatterns.filter(pattern => lowerText.includes(pattern)).length;

  // Calculate a simple "fake news" score
  const totalMatches = sensationalistCount + unreliableSourceCount + unverifiedClaimsCount;
  const maxPossibleMatches = sensationalistPatterns.length + unreliableSourcePatterns.length + unverifiedClaimsPatterns.length;
  const fakeScore = totalMatches / maxPossibleMatches;

  // Determine classification based on the score
  let classification: "real" | "fake" | "misleading";
  if (fakeScore > 0.2) {
    classification = "fake";
  } else if (fakeScore > 0.1) {
    classification = "misleading";
  } else {
    classification = "real";
  }

  // Generate reasoning based on patterns found
  const reasoning: string[] = [];
  
  if (sensationalistCount > 0) {
    reasoning.push("Uses sensationalist language that is common in fake news articles");
  }
  
  if (unreliableSourceCount > 0) {
    reasoning.push("References unnamed or anonymous sources that cannot be verified");
  }
  
  if (unverifiedClaimsCount > 0) {
    reasoning.push("Makes unverified or exaggerated claims without proper evidence");
  }

  if (reasoning.length === 0) {
    reasoning.push("No common misinformation patterns detected");
  }

  // Perform sentiment analysis
  let emotionalTone = "Neutral";
  let emotionalToneScore = 0.5;
  let languageStyle = "Informative";
  let languageStyleScore = 0.5;
  
  if (sensationalistCount > 2) {
    emotionalTone = "Fear-inducing";
    emotionalToneScore = 0.8;
    languageStyle = "Sensationalist";
    languageStyleScore = 0.9;
  } else if (sensationalistCount > 0) {
    emotionalTone = "Emotional";
    emotionalToneScore = 0.65;
    languageStyle = "Slightly sensationalist";
    languageStyleScore = 0.7;
  }

  // Simple political leaning detection
  const leftPatterns = ["progressive", "liberal", "democrat", "socialism", "equity"];
  const rightPatterns = ["conservative", "republican", "tradition", "freedom", "liberty"];
  
  const leftCount = leftPatterns.filter(pattern => lowerText.includes(pattern)).length;
  const rightCount = rightPatterns.filter(pattern => lowerText.includes(pattern)).length;
  
  let politicalLeaning = "Neutral";
  let politicalLeaningScore = 0.5;
  
  if (leftCount > rightCount) {
    politicalLeaning = "Left-leaning";
    politicalLeaningScore = 0.3;
  } else if (rightCount > leftCount) {
    politicalLeaning = "Right-leaning";
    politicalLeaningScore = 0.7;
  }

  // Fetch fact checks
  const factChecks = await fetchFactChecks(text);

  // Create the source credibility information
  let sourceCredibility = {
    name: "Unknown Source",
    score: 0.5,
    level: "medium" as const
  };

  // Adjust source credibility based on detected patterns
  if (totalMatches > 5) {
    sourceCredibility = {
      name: "Suspicious Source",
      score: 0.2,
      level: "low" as const
    };
  } else if (totalMatches > 2) {
    sourceCredibility = {
      name: "Questionable Source",
      score: 0.4,
      level: "low" as const
    };
  } else if (totalMatches === 0) {
    sourceCredibility = {
      name: "Reliable Source",
      score: 0.8,
      level: "high" as const
    };
  }

  // Construct the final result
  return {
    classification,
    confidence: classification === "fake" ? 0.8 : (classification === "misleading" ? 0.6 : 0.7),
    reasoning,
    sourceCredibility,
    factChecks,
    sentiment: {
      emotionalTone,
      emotionalToneScore,
      languageStyle,
      languageStyleScore,
      politicalLeaning,
      politicalLeaningScore
    }
  };
}
