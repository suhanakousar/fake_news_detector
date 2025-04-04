// This is a simplified mock implementation for the fact-checking API

interface FactCheck {
  source: string;
  title: string;
  snippet: string;
  url: string;
}

const mockFactCheckDatabase = [
  {
    keywords: ["nasa", "alien", "mars", "hidden", "evidence"],
    factChecks: [
      {
        source: "Snopes",
        title: "NASA Has Not Found Evidence of Alien Life on Mars",
        snippet: "Claims about NASA hiding evidence of alien life on Mars are false. NASA's Mars missions have found no evidence of past or present alien life.",
        url: "https://www.snopes.com/fact-check/nasa-mars-life/"
      },
      {
        source: "NASA Official",
        title: "Mars Exploration: What We've Actually Found",
        snippet: "NASA's Mars missions have discovered evidence of past water activity and organic molecules, but no evidence of past or present life has been found.",
        url: "https://mars.nasa.gov/news/8687/nasa-finds-ancient-organic-material-methane-on-mars/"
      }
    ]
  },
  {
    keywords: ["covid", "vaccine", "microchip", "5g", "bill gates"],
    factChecks: [
      {
        source: "Reuters",
        title: "COVID-19 vaccines do not contain microchips or tracking devices",
        snippet: "COVID-19 vaccines do not contain microchips, tracking mechanisms, or 5G technology. This claim has been repeatedly debunked.",
        url: "https://www.reuters.com/article/factcheck-coronavirus-vaccine-idUSL1N2M01PE"
      },
      {
        source: "WHO",
        title: "COVID-19 Vaccine Myths",
        snippet: "The World Health Organization addresses common misconceptions about COVID-19 vaccines, including the false claim about microchips.",
        url: "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters"
      }
    ]
  },
  {
    keywords: ["climate change", "hoax", "scientists", "conspiracy"],
    factChecks: [
      {
        source: "Climate.gov",
        title: "Climate Change Evidence",
        snippet: "Multiple lines of scientific evidence show that Earth's climate is warming due to human activities, particularly the emission of heat-trapping greenhouse gases.",
        url: "https://www.climate.gov/news-features/understanding-climate/climate-change-global-temperature"
      },
      {
        source: "NASA",
        title: "Scientific Consensus on Climate Change",
        snippet: "97 percent or more of actively publishing climate scientists agree that human activities are causing global warming and climate change.",
        url: "https://climate.nasa.gov/scientific-consensus/"
      }
    ]
  }
];

export async function fetchFactChecks(text: string): Promise<FactCheck[]> {
  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Find matching fact checks
  const matchingFactChecks: FactCheck[] = [];
  
  for (const entry of mockFactCheckDatabase) {
    // Check if the text contains any of the keywords
    const containsKeywords = entry.keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    
    if (containsKeywords) {
      // Add all fact checks associated with these keywords
      matchingFactChecks.push(...entry.factChecks);
    }
  }
  
  // Return unique fact checks (in case of overlapping keywords)
  return [...new Map(matchingFactChecks.map(check => [check.title, check])).values()];
}
