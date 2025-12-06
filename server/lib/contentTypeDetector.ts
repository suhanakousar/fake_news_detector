/**
 * Content Type Detector
 * Classifies input text before fake news analysis
 * Prevents treating opinions, questions, and emotions as factual claims
 */

export type ContentType = 
  | "OPINION"           // Subjective statements, feelings, personal views
  | "QUESTION"          // Questions that can't be fact-checked
  | "EMOTION"           // Emotional expressions
  | "FACTUAL_CLAIM"     // Verifiable factual statements
  | "NEWS_CLAIM"        // News-like claims that can be fact-checked
  | "CONTEXT_REQUIRED"  // Needs more context to determine
  | "UNKNOWN";          // Could not determine

export interface ContentTypeResult {
  type: ContentType;
  confidence: number;
  explanation: string;
}

/**
 * Check if text is context-dependent (requires location/time context)
 * This MUST be checked BEFORE BERT or any fake news models
 */
export function isContextDependent(text: string): boolean {
  const t = text.toLowerCase().trim();
  
  const climate = ["rainy", "monsoon", "season", "winter", "summer", "spring", "fall", "autumn", "dry", "wet", "hot", "cold", "snowy"];
  const months = ["january", "february", "march", "april", "may", "june",
                  "july", "august", "september", "october", "november", "december"];
  
  const hasClimate = climate.some(w => t.includes(w));
  const hasMonth = months.some(m => t.includes(m));
  
  // Check for location indicators (more comprehensive)
  const hasLocation = /\b(in|at|from|of)\s+[A-Z][a-zA-Z]+/g.test(text) || 
                     /\b(country|region|state|city|area|place|location|india|usa|china|europe|asia|africa|america)\b/i.test(text) ||
                     /\b(north|south|east|west|northern|southern|eastern|western)\s+(hemisphere|region|part)\b/i.test(text);
  
  // Pattern 1: "rainy season is on june/july" or "season is on june" (handles slashes and "on")
  const seasonMonthPattern = /\b(rainy|dry|winter|summer|spring|fall|autumn|monsoon)\s+season\s+(is|are|on|in|during|starts|begins|occurs)\s+(january|february|march|april|may|june|july|august|september|october|november|december)(\s*\/\s*(january|february|march|april|may|june|july|august|september|october|november|december))?/i;
  if (seasonMonthPattern.test(text) && !hasLocation) {
    return true;
  }
  
  // Pattern 1b: "rainy season on june/july" (without "is")
  const seasonMonthPattern2 = /\b(rainy|dry|winter|summer|spring|fall|autumn|monsoon)\s+season\s+on\s+(january|february|march|april|may|june|july|august|september|october|november|december)(\s*\/\s*(january|february|march|april|may|june|july|august|september|october|november|december))?/i;
  if (seasonMonthPattern2.test(text) && !hasLocation) {
    return true;
  }
  
  // Pattern 2: "june/july is rainy season" or "june is the rainy season"
  const monthSeasonPattern = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s*\/?\s*(january|february|march|april|may|june|july|august|september|october|november|december)?\s+(is|are|is the|are the)\s+(the|a|an)?\s*(rainy|dry|winter|summer|spring|fall|autumn|monsoon)\s+season/i;
  if (monthSeasonPattern.test(text) && !hasLocation) {
    return true;
  }
  
  // Pattern 3: Climate + month without location = context dependent
  // This is a catch-all for any climate/season + month combination
  if (hasClimate && hasMonth && !hasLocation) {
    // Additional check: make sure it's actually about seasons/weather
    const weatherKeywords = /\b(season|weather|climate|temperature|rainfall|precipitation|snow|monsoon)\b/i;
    if (weatherKeywords.test(text)) {
      return true;
    }
    // Also check if "season" appears anywhere (even if not in climate array)
    if (t.includes("season")) {
      return true;
    }
  }
  
  // Time-dependent statements without context
  const timePatterns = [
    /\b(today|yesterday|tomorrow|now|recently|soon|later)\s+(is|are|was|were)\b/i,
    /\b(this|that|these|those)\s+(week|month|year|time|period)\b/i
  ];
  
  if (timePatterns.some(pattern => pattern.test(text)) && !hasLocation) {
    return true;
  }
  
  return false;
}

/**
 * Detect the type of content before fake news analysis
 */
export function detectContentType(text: string): ContentTypeResult {
  if (!text || text.trim().length === 0) {
    return {
      type: "UNKNOWN",
      confidence: 0,
      explanation: "Empty text provided"
    };
  }

  // CHECK CONTEXT-DEPENDENT FIRST (before any other analysis)
  if (isContextDependent(text)) {
    return {
      type: "CONTEXT_REQUIRED",
      confidence: 0.9,
      explanation: "This claim depends on geographic location or time context. The same statement can be true in some regions but false in others (e.g., 'December is rainy season' is true in South India but false in Northern Hemisphere). Provide a location to verify."
    };
  }

  const t = text.toLowerCase().trim();
  const words = t.split(/\s+/);
  const wordCount = words.length;

  // Very short inputs are likely opinions or incomplete
  if (wordCount <= 3) {
    // Check if it's a question
    if (t.endsWith("?")) {
      return {
        type: "QUESTION",
        confidence: 0.9,
        explanation: "Short question detected - not a factual claim"
      };
    }
    
    // Check for opinion indicators
    const shortOpinionPatterns = [
      /^(good|bad|great|nice|ok|fine|cool|awesome|terrible|wow|amazing|sad|happy)/i,
      /^(today|yesterday|tomorrow) (is|was|will be) (good|bad|great|nice)/i
    ];
    
    if (shortOpinionPatterns.some(pattern => pattern.test(text))) {
      return {
        type: "OPINION",
        confidence: 0.85,
        explanation: "Short subjective statement detected - expresses opinion or feeling"
      };
    }
  }

  // Opinion patterns
  const opinionPatterns = [
    /\b(i think|i feel|i believe|i guess|i hope|i wish|in my opinion|personally|to me)\b/i,
    /\b(feel|feeling|feelings|emotion|emotions|mood|moods)\b/i,
    /\b(good day|bad day|great day|nice day|wonderful day|terrible day)\b/i,
    /\b(love|hate|like|dislike|prefer|enjoy|enjoying)\b/i,
    /\b(happy|sad|angry|excited|bored|tired|worried|anxious|calm|peaceful)\b/i,
    /\b(awesome|terrible|amazing|horrible|wonderful|awful|fantastic|disgusting)\b/i,
    /\b(beautiful|ugly|pretty|cute|nice|mean|kind|cruel)\b/i
  ];

  const opinionMatches = opinionPatterns.filter(pattern => pattern.test(text)).length;
  if (opinionMatches >= 2 || (opinionMatches >= 1 && wordCount <= 8)) {
    return {
      type: "OPINION",
      confidence: 0.8,
      explanation: "Contains opinion indicators - subjective statement, not a factual claim"
    };
  }

  // Question detection
  if (t.endsWith("?") || t.startsWith("is ") || t.startsWith("are ") || 
      t.startsWith("was ") || t.startsWith("were ") || t.startsWith("do ") ||
      t.startsWith("does ") || t.startsWith("did ") || t.startsWith("will ") ||
      t.startsWith("can ") || t.startsWith("could ") || t.startsWith("should ") ||
      t.startsWith("would ") || t.startsWith("what ") || t.startsWith("when ") ||
      t.startsWith("where ") || t.startsWith("why ") || t.startsWith("how ")) {
    return {
      type: "QUESTION",
      confidence: 0.9,
      explanation: "Question detected - cannot be fact-checked as true/false"
    };
  }

  // Emotion/feeling expressions
  const emotionPatterns = [
    /\b(i'm|i am|im) (feeling|feeling like|happy|sad|angry|excited|tired|worried)\b/i,
    /\b(makes me|made me|make me) (feel|happy|sad|angry|excited)\b/i,
    /\b(emotionally|feeling|feelings|mood|emotions)\b/i
  ];

  if (emotionPatterns.some(pattern => pattern.test(text))) {
    return {
      type: "EMOTION",
      confidence: 0.85,
      explanation: "Emotional expression detected - not a factual claim"
    };
  }

  // Factual claim indicators
  const factualIndicators = [
    /\b(is|are|was|were|has|have|had|will|would|can|could|should)\b.*\b(true|false|fact|facts|proven|evidence|study|studies|research|scientists|experts|according to|reports|data|statistics)\b/i,
    /\b(according to|research shows|studies show|scientists found|experts say|data indicates|evidence suggests)\b/i,
    /\b(announced|declared|stated|claimed|reported|revealed|discovered|found|proved|confirmed|denied)\b/i,
    /\b(percent|percentage|million|billion|thousand|hundred|people|person|persons|country|countries|government|president|minister|official)\b/i
  ];

  const factualMatches = factualIndicators.filter(pattern => pattern.test(text)).length;
  
  // News-like patterns
  const newsPatterns = [
    /\b(breaking|news|report|reports|article|headline|breaking news|latest news)\b/i,
    /\b(president|prime minister|government|official|authority|ministry|department)\b/i,
    /\b(announced|declared|stated|confirmed|denied|revealed|disclosed)\b/i
  ];

  const newsMatches = newsPatterns.filter(pattern => pattern.test(text)).length;

  // Determine if it's a factual claim or news claim
  if (newsMatches >= 2 || (newsMatches >= 1 && factualMatches >= 1)) {
    return {
      type: "NEWS_CLAIM",
      confidence: 0.8,
      explanation: "News-like claim detected - can be fact-checked"
    };
  }

  if (factualMatches >= 2 || (factualMatches >= 1 && wordCount >= 10)) {
    return {
      type: "FACTUAL_CLAIM",
      confidence: 0.75,
      explanation: "Factual claim detected - can be verified"
    };
  }

  // Additional context-dependent patterns (already checked above, but keeping for fallback)
  // This section is now redundant but kept for edge cases

  // Default to unknown if we can't determine
  return {
    type: "UNKNOWN",
    confidence: 0.5,
    explanation: "Could not determine content type - will proceed with caution"
  };
}

/**
 * Check if content type should bypass fake news detection
 */
export function shouldBypassFakeNewsDetection(type: ContentType): boolean {
  return type === "OPINION" || type === "QUESTION" || type === "EMOTION";
}

/**
 * Get appropriate response for non-factual content types
 */
export function getNonFactualResponse(type: ContentType, explanation: string): {
  classification: "real" | "fake" | "misleading";
  confidence: number;
  explanation: string;
  sources: any[];
  patterns: {
    sensationalist: number;
    unreliableSource: number;
    unverifiedClaims: number;
  };
} {
  const baseResponse = {
    sources: [] as any[],
    patterns: {
      sensationalist: 0,
      unreliableSource: 0,
      unverifiedClaims: 0
    }
  };

  switch (type) {
    case "OPINION":
      return {
        classification: "real", // Neutral classification
        confidence: 0,
        explanation: "This statement expresses a personal opinion or feeling. It does not make a factual claim that can be verified or debunked. Fake news detection is not applicable to subjective statements.",
        ...baseResponse
      };

    case "QUESTION":
      return {
        classification: "real", // Neutral classification
        confidence: 0,
        explanation: "This is a question, not a factual claim. Questions cannot be fact-checked as true or false. Fake news detection is not applicable.",
        ...baseResponse
      };

    case "EMOTION":
      return {
        classification: "real", // Neutral classification
        confidence: 0,
        explanation: "This statement expresses an emotion or feeling. It does not make a factual claim that can be verified. Fake news detection is not applicable to emotional expressions.",
        ...baseResponse
      };

    case "CONTEXT_REQUIRED":
      return {
        classification: "misleading", // Using misleading as closest match, but with fixed low confidence
        confidence: 0.35, // Fixed confidence for context-required (not arbitrary)
        explanation: `${explanation} This claim cannot be verified without additional context (location, time, or specific details). It may be true in some contexts but false in others.`,
        ...baseResponse
      };

    default:
      return {
        classification: "real",
        confidence: 0,
        explanation: "Content type could not be determined. Proceeding with caution.",
        ...baseResponse
      };
  }
}

