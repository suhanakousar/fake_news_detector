/**
 * Source Analyzer - Analyzes URL/domain reputation and metadata
 * Part of the 5-step prediction pipeline
 */

import tldextract from 'tldextract';

// Known reliable news sources (whitelist)
const RELIABLE_SOURCES = new Set([
  'reuters.com', 'bbc.com', 'cnn.com', 'nytimes.com', 'washingtonpost.com',
  'theguardian.com', 'ap.org', 'npr.org', 'wsj.com', 'ft.com',
  'economist.com', 'bloomberg.com', 'abcnews.go.com', 'cbsnews.com',
  'nbcnews.com', 'usatoday.com', 'time.com', 'newsweek.com',
  'indiatoday.in', 'thehindu.com', 'indianexpress.com', 'hindustantimes.com',
  'timesofindia.indiatimes.com', 'ndtv.com', 'firstpost.com'
]);

// Known unreliable/fake news sources (blacklist)
const UNRELIABLE_SOURCES = new Set([
  'infowars.com', 'naturalnews.com', 'beforeitsnews.com', 'worldtruth.tv'
]);

export interface SourceAnalysis {
  domain: string;
  subdomain: string;
  isHttps: boolean;
  urlTokenCount: number;
  isKnownReliable: boolean;
  isKnownUnreliable: boolean;
  reputationScore: number; // 0 (unreliable) to 1 (reliable)
  domainAgeDays: number | null;
  hasAuthor: boolean;
  authorReputationScore: number;
}

/**
 * Analyze source/URL for reputation and metadata
 */
export async function analyzeSource(url?: string, author?: string): Promise<SourceAnalysis> {
  const defaultAnalysis: SourceAnalysis = {
    domain: '',
    subdomain: '',
    isHttps: false,
    urlTokenCount: 0,
    isKnownReliable: false,
    isKnownUnreliable: false,
    reputationScore: 0.5, // Neutral default
    domainAgeDays: null,
    hasAuthor: !!author,
    authorReputationScore: 0.5
  };

  if (!url) {
    return defaultAnalysis;
  }

  try {
    // Normalize URL to handle cases where protocol might be missing or different
    let normalizedUrl = url.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      // If no protocol, assume https for known reliable domains
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Extract domain information
    const extracted = tldextract(normalizedUrl);
    let domain = extracted.domain && extracted.suffix 
      ? `${extracted.domain}.${extracted.suffix}` 
      : extracted.domain || '';
    const subdomain = extracted.subdomain || '';

    // Fallback: if domain extraction fails or seems incomplete, try to extract from URL directly
    // This is especially important for country-code TLDs like .in, .co.uk, etc.
    if (!domain || domain.length < 3 || !domain.includes('.')) {
      try {
        const urlObj = new URL(normalizedUrl);
        domain = urlObj.hostname.replace(/^www\./, ''); // Remove www. prefix
      } catch (e) {
        // If URL parsing also fails, try regex extraction
        const match = normalizedUrl.match(/https?:\/\/(?:www\.)?([^\/\?]+)/i);
        if (match) {
          domain = match[1].toLowerCase();
        }
      }
    }
    
    // Ensure domain is properly formatted (remove port if present)
    if (domain.includes(':')) {
      domain = domain.split(':')[0];
    }

    // Check HTTPS - check both original URL and normalized URL
    // Trim and normalize the URL to handle any whitespace or encoding issues
    const urlTrimmed = url.trim().toLowerCase();
    const normalizedUrlTrimmed = normalizedUrl.trim().toLowerCase();
    
    // More robust HTTPS detection - check for https:// at the start
    // Also handle cases where URL might have been encoded or modified
    let isHttps = urlTrimmed.startsWith('https://') || normalizedUrlTrimmed.startsWith('https://');
    
    // Fallback: check if URL contains https:// anywhere (in case of encoding issues)
    if (!isHttps) {
      isHttps = urlTrimmed.includes('https://') || normalizedUrlTrimmed.includes('https://');
    }
    
    // Additional check: if URL clearly has https in it, trust it
    if (!isHttps && (url.toLowerCase().includes('https') || normalizedUrl.toLowerCase().includes('https'))) {
      // Only set to true if it's clearly https, not just the word "https" in the path
      const httpsMatch = url.match(/^https?:\/\//i) || normalizedUrl.match(/^https?:\/\//i);
      if (httpsMatch && httpsMatch[0].toLowerCase() === 'https://') {
        isHttps = true;
      }
    }
    
    // Debug logging for HTTPS detection
    if (!isHttps && (url.toLowerCase().includes('http') || normalizedUrl.toLowerCase().includes('http'))) {
      console.warn(`[SOURCE_ANALYZER] HTTPS check failed for URL: ${url}, normalized: ${normalizedUrl}, urlTrimmed: ${urlTrimmed}`);
    }

    // Count URL tokens (subdomains, path segments)
    const urlParts = url.split(/[\/\?]/);
    const urlTokenCount = urlParts.length;

    // Check against whitelist/blacklist - normalize domain for comparison
    // Remove www. prefix and ensure lowercase for matching
    let domainLower = domain.toLowerCase().replace(/^www\./, '');
    // Also try without the subdomain in case tldextract included it
    if (subdomain && domainLower.startsWith(subdomain.toLowerCase() + '.')) {
      domainLower = domainLower.replace(new RegExp('^' + subdomain.toLowerCase() + '\\.'), '');
    }
    
    const isKnownReliable = RELIABLE_SOURCES.has(domainLower);
    const isKnownUnreliable = UNRELIABLE_SOURCES.has(domainLower);
    
    // Debug logging for domain matching
    if (!isKnownReliable && !isKnownUnreliable && domainLower) {
      console.log(`[SOURCE_ANALYZER] Domain "${domainLower}" not found in reliable/unreliable lists. Available reliable sources include:`, Array.from(RELIABLE_SOURCES).slice(0, 5));
    }

    // Calculate reputation score
    let reputationScore = 0.5; // Neutral default
    
    if (isKnownReliable) {
      reputationScore = 0.9; // High trust
    } else if (isKnownUnreliable) {
      reputationScore = 0.1; // Low trust
    } else {
      // Heuristic scoring for unknown domains
      // Penalize if no HTTPS
      if (!isHttps) {
        reputationScore -= 0.2;
      }
      
      // Penalize if domain looks suspicious (numbers, hyphens, etc.)
      const suspiciousPatterns = /\d{4,}|-{2,}|[0-9]{3,}/;
      if (suspiciousPatterns.test(domain)) {
        reputationScore -= 0.15;
      }
      
      // Bonus for common TLDs
      const trustedTlds = ['.com', '.org', '.edu', '.gov', '.net', '.in', '.co.uk', '.au', '.ca'];
      if (trustedTlds.some(tld => domain.endsWith(tld))) {
        reputationScore += 0.1;
      }
      
      reputationScore = Math.max(0, Math.min(1, reputationScore));
    }

    // Domain age (simplified - would need WHOIS in production)
    // For now, we'll skip actual WHOIS lookup as it's async and can be slow
    const domainAgeDays = null; // Would be calculated from WHOIS data

    // Author analysis (simplified)
    const hasAuthor = !!author && author.trim().length > 0;
    let authorReputationScore = 0.5;
    
    if (hasAuthor) {
      // Heuristic: if author name looks professional (has space, proper capitalization)
      const authorWords = author.trim().split(/\s+/);
      if (authorWords.length >= 2) {
        authorReputationScore = 0.6; // Slightly positive
      }
      
      // Check for suspicious author patterns
      if (/anonymous|unknown|staff|editor/i.test(author)) {
        authorReputationScore = 0.3; // Lower score
      }
    } else {
      authorReputationScore = 0.4; // Slightly negative if no author
    }

    // Debug logging
    console.log(`[SOURCE_ANALYZER] URL: ${url}, Domain: ${domain}, HTTPS: ${isHttps}, Reliable: ${isKnownReliable}`);
    
    return {
      domain,
      subdomain,
      isHttps,
      urlTokenCount,
      isKnownReliable,
      isKnownUnreliable,
      reputationScore,
      domainAgeDays,
      hasAuthor,
      authorReputationScore
    };
  } catch (error) {
    console.error('Error analyzing source:', error);
    return defaultAnalysis;
  }
}

/**
 * Calculate source reputation score (0-1 scale)
 * Higher score = more reliable source
 */
export function calculateSourceScore(analysis: SourceAnalysis): number {
  let score = analysis.reputationScore;
  
  // Adjust based on HTTPS
  if (analysis.isHttps) {
    score += 0.05;
  } else {
    score -= 0.1;
  }
  
  // Adjust based on author
  score = (score * 0.7) + (analysis.authorReputationScore * 0.3);
  
  // Adjust based on domain age (if available)
  if (analysis.domainAgeDays !== null) {
    if (analysis.domainAgeDays < 30) {
      score -= 0.2; // Very new domain is suspicious
    } else if (analysis.domainAgeDays > 365) {
      score += 0.1; // Established domain is more trustworthy
    }
  }
  
  return Math.max(0, Math.min(1, score));
}

