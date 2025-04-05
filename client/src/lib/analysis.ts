import { AnalysisResult } from '@shared/schema';
import { apiRequest } from './queryClient';

export interface AnalysisRequest {
  text?: string;
  url?: string;
  file?: File;
  language?: string;
}

export async function analyzeContent(request: AnalysisRequest): Promise<AnalysisResult> {
  try {
    if (request.text) {
      const response = await apiRequest('POST', '/api/analyze/text', { 
        text: request.text,
        language: request.language || 'en'
      });
      return await response.json();
    } 
    
    if (request.url) {
      const response = await apiRequest('POST', '/api/analyze/url', { 
        url: request.url,
        language: request.language || 'en'
      });
      return await response.json();
    }
    
    if (request.file) {
      // Determine file type and endpoint
      const fileType = request.file.type;
      let endpoint = '';
      
      if (fileType.startsWith('image/')) {
        endpoint = '/api/analyze/image';
      } else if (
        fileType === 'application/pdf' || 
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileType === 'text/plain' ||
        fileType === 'text/html'
      ) {
        endpoint = '/api/analyze/document';
      } else {
        throw new Error('Unsupported file type');
      }
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append(endpoint.includes('image') ? 'image' : 'document', request.file);
      
      // Add language parameter if provided
      if (request.language) {
        formData.append('language', request.language);
      }
      
      // Make request with FormData
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return await response.json();
    }
    
    throw new Error('Invalid analysis request. Please provide text, URL, or file.');
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

export function getClassificationColor(classification: string): string {
  switch (classification) {
    case 'real':
      return 'text-green-500';
    case 'fake':
      return 'text-red-500';
    case 'misleading':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
}

export function getClassificationBgColor(classification: string): string {
  switch (classification) {
    case 'real':
      return 'bg-green-500';
    case 'fake':
      return 'bg-red-500';
    case 'misleading':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 0.7) return 'text-green-500';
  if (score >= 0.4) return 'text-yellow-500';
  return 'text-red-500';
}

export function getCredibilityLevelColor(level: string): string {
  switch (level) {
    case 'high':
      return 'text-green-500';
    case 'medium':
      return 'text-yellow-500';
    case 'low':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

export function getSentimentColor(sentiment: string, score: number): string {
  if (sentiment === 'Fear-inducing' || sentiment === 'Sensationalist') {
    return 'text-orange-500';
  }
  if (sentiment === 'Emotional' || sentiment === 'Slightly sensationalist') {
    return 'text-yellow-500';
  }
  return 'text-blue-500';
}
