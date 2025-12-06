import { useMutation } from '@tanstack/react-query';

import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { 
  AlertCircle, Download, Share, Search, Lightbulb,
  ChevronDown, ExternalLink, FileText, Microscope, 
  Code, Link as LinkIcon, MessageSquare, SendIcon, Loader2
} from 'lucide-react';
import type { AnalysisResult } from '@shared/schema';
import ChatbotFloating from './ChatbotFloating';
import { 
  getClassificationColor,
  getClassificationBgColor,
  getCredibilityLevelColor,
  getSentimentColor 
} from '@/lib/helpers';
import { generatePDFReport } from '@/lib/pdfGenerator';

interface ExtendedAnalysisResult extends AnalysisResult {
  reasoning?: string[];
  sourceCredibility?: {
    name: string;
    score: number;
    level: 'high' | 'medium' | 'low';
  };
  factChecks?: Array<{
    source: string;
    title: string;
    snippet: string;
    url: string;
  }>;
  sentiment?: {
    emotionalTone: string;
    emotionalToneScore: number;
    languageStyle: string;
    languageStyleScore: number;
    politicalLeaning: string;
    politicalLeaningScore: number;
  };
  summary?: string;
  xai?: {
    keyPhrases?: Array<{
      text: string;
      impact: number;
      explanation: string;
    }>;
    detectionConfidence?: Array<{
      algorithm: string;
      score: number;
      explanation: string;
    }>;
    alternativeSources?: Array<{
      title: string;
      url: string;
      trustScore: number;
    }>;
  };
}

interface ResultsDisplayProps {
  result: ExtendedAnalysisResult;
  contentPreview: string;
  onReset: () => void;
}

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, contentPreview, onReset }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  const chatbotMutation = useMutation({
    mutationFn: async (question: string) => {
      try {
        const response = await apiRequest('POST', '/api/chatbot', {
          question,
          content: contentPreview,
          analysisResult: result
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[CHATBOT] Response received:', data);
        
        if (!data.response) {
          throw new Error('No response in data');
        }
        
        return data;
      } catch (error) {
        console.error('[CHATBOT] Request error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[CHATBOT] Success, adding message:', data.response?.substring(0, 50));
      setChatMessages(prev => [
        ...prev,
        {
          text: data.response || "I couldn't generate a response, but here's what I know about this analysis.",
          isUser: false,
          timestamp: new Date()
        }
      ]);
    },
    onError: (error) => {
      console.error('[CHATBOT] Error:', error);
      // Provide helpful fallback based on analysis
      const fallbackText = `I encountered an issue, but based on the analysis: This content is classified as ${result.classification.toUpperCase()} (${Math.round(result.confidence * 100)}% confidence). ${result.explanation?.substring(0, 200) || 'Please try asking your question again.'}`;
      
      setChatMessages(prev => [
        ...prev,
        {
          text: fallbackText,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  });

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMessage: ChatMessage = {
      text: chatInput,
      isUser: true,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    chatbotMutation.mutate(chatInput);
    setChatInput('');
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
    const inputElement = document.getElementById('chat-input');
    inputElement?.focus();
  };

  const handleDownload = () => {
    setIsDownloading(true);
    
    try {
      // Generate beautiful PDF report
      generatePDFReport(result, contentPreview);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download if PDF generation fails
      const reportContent = `
# TruthLens Analysis Report

## Content Analyzed
${contentPreview}

## Classification
${result.classification.toUpperCase()} (${Math.round(result.confidence * 100)}% confidence)

## Explanation
${result.explanation || 'No explanation provided'}

## Key Patterns Detected
- Sensationalist Language: ${result.patterns.sensationalist.toFixed(2)}
- Unreliable Sources: ${result.patterns.unreliableSource.toFixed(2)}
- Unverified Claims: ${result.patterns.unverifiedClaims.toFixed(2)}

## Source Credibility
Source: ${result.sourceCredibility?.name || 'Unknown'}
Trust Score: ${Math.round((result.sourceCredibility?.score || 0) * 100)}%
Level: ${result.sourceCredibility?.level?.toUpperCase() || 'UNKNOWN'}

## Sentiment Analysis
Emotional Tone: ${result.sentiment?.emotionalTone || 'N/A'} (${Math.round((result.sentiment?.emotionalToneScore || 0) * 100)}%)
Language Style: ${result.sentiment?.languageStyle || 'N/A'} (${Math.round((result.sentiment?.languageStyleScore || 0) * 100)}%)
Political Leaning: ${result.sentiment?.politicalLeaning || 'N/A'} (${Math.round((result.sentiment?.politicalLeaningScore || 0) * 100)}%)

## Fact Checks
${result.factChecks?.length ? 
  result.factChecks.map(fc => `- ${fc.source}: ${fc.title}\n  ${fc.snippet}\n  URL: ${fc.url}`).join('\n\n') : 'No fact checks available'}

--- 
Generated by TruthLens on ${new Date().toLocaleString()}
      `;
      
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `truthlens-report-${new Date().getTime()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    setIsDownloading(false);
  };

  return (
    <section className="mb-16">
      <div className="max-w-4xl mx-auto">
        <ChatbotFloating analysisResult={result} contentPreview={contentPreview} isResultsPage={true} />
        
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          {/* Result Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 bg-opacity-90 dark:bg-opacity-90">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold font-serif">Analysis Results</h3>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                  Analysis completed
                </span>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={onReset}
                  className="h-8 w-8"
                >
                  <AlertCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Content Preview */}
          <div className="p-6 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p className="line-clamp-3">{contentPreview}</p>
            </div>
          </div>
          
          {/* Result Card */}
          <div className="p-6">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium">Credibility Assessment</h4>
                <div className="flex items-center space-x-1">
                  <span className={`text-sm font-semibold ${getClassificationColor(result.classification)}`}>
                    {result.confidence === 0 ? 'NOT APPLICABLE' : result.classification.toUpperCase()}
                  </span>
                  {result.confidence > 0 && (
                    <>
                      <div className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${getClassificationBgColor(result.classification)} transition-all duration-500`}
                          style={{ width: `${result.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </>
                  )}
                  {result.confidence === 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      N/A
                    </span>
                  )}
                </div>
              </div>
              
              <div className={`p-4 ${
                result.confidence === 0
                  ? 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                  : result.classification === 'fake' 
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                    : result.classification === 'misleading'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              } rounded-lg mb-6`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className={`
                      ${result.confidence === 0
                        ? 'text-gray-600 dark:text-gray-400'
                        : result.classification === 'fake' 
                          ? 'text-red-600 dark:text-red-400' 
                          : result.classification === 'misleading'
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-green-600 dark:text-green-400'
                      } h-5 w-5 mt-0.5
                    `} />
                  </div>
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      result.confidence === 0
                        ? 'text-gray-800 dark:text-gray-300'
                        : result.classification === 'fake' 
                          ? 'text-red-800 dark:text-red-300' 
                          : result.classification === 'misleading'
                            ? 'text-yellow-800 dark:text-yellow-300'
                            : 'text-green-800 dark:text-green-300'
                    }`}>
                      {result.confidence === 0
                        ? 'Fake News Detection Not Applicable'
                        : result.classification === 'fake' 
                          ? 'This content contains false information' 
                          : result.classification === 'misleading'
                            ? 'This content may be misleading'
                            : 'This content appears to be reliable'
                      }
                    </h3>
                    <div className={`mt-2 text-sm ${
                      result.confidence === 0
                        ? 'text-gray-700 dark:text-gray-300'
                        : result.classification === 'fake' 
                          ? 'text-red-700 dark:text-red-300' 
                          : result.classification === 'misleading'
                            ? 'text-yellow-700 dark:text-yellow-300'
                            : 'text-green-700 dark:text-green-300'
                    }`}>
                      <p>
                        {result.explanation || (
                          result.classification === 'fake' 
                            ? 'Our AI detected multiple misleading claims without credible sources. The content uses sensationalist language and unverified information.' 
                            : result.classification === 'misleading'
                              ? 'This content contains some potentially misleading elements or exaggerations, though not entirely false. Verify with additional sources.'
                              : 'This content appears to be based on credible information and presents a balanced view of the topic.'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* AI Reasoning */}
                <Collapsible defaultOpen className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h5 className="font-medium text-sm">AI Reasoning</h5>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 bg-white dark:bg-gray-800">
                      {result.explanation ? (
                        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {result.explanation}
                        </p>
                      ) : result.reasoning && result.reasoning.length > 0 ? (
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          {result.reasoning.map((reason, index) => (
                            <li key={index} className="flex items-start">
                              <span className={`inline-flex shrink-0 mr-2 mt-1 h-4 w-4 items-center justify-center rounded-full ${
                                result.classification === 'fake' 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                                  : result.classification === 'misleading'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                              }`}>
                                <AlertCircle className="h-3 w-3" />
                              </span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No reasoning provided.
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                {/* Source Credibility - Hide if not applicable or context-required */}
                {result.confidence > 0 && result.explanation && !result.explanation.includes("Context-Dependent") && (
                <Collapsible defaultOpen className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h5 className="font-medium text-sm">Source Credibility</h5>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className="w-5 h-5 mr-2 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs">
                              {(result.sourceCredibility?.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{result.sourceCredibility?.name || 'Unknown source'}</span>
                          </div>
                        <div className="flex items-center">
                            <span className={`text-xs font-medium ${getCredibilityLevelColor(result.sourceCredibility?.level || 'medium')} mr-2`}>
                              {result.sourceCredibility?.level === 'high' ? 'HIGH TRUST' : 
                               result.sourceCredibility?.level === 'medium' ? 'MEDIUM TRUST' : 'LOW TRUST'}
                          </span>
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                result.sourceCredibility?.level === 'high' ? 'bg-green-500' : 
                                result.sourceCredibility?.level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {result.sourceCredibility?.level === 'high' 
                          ? 'This source generally provides reliable information and follows journalistic standards.' 
                          : result.sourceCredibility?.level === 'medium' 
                            ? 'This source has mixed reliability. Verify important claims with additional sources.' 
                            : 'This source has a history of publishing unverified claims or misinformation.'}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                )}
                
                {/* Fact Checks - Hide if not applicable */}
                {result.confidence > 0 && (
                <Collapsible defaultOpen className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h5 className="font-medium text-sm">Fact Checks</h5>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 bg-white dark:bg-gray-800">
                      {result.factChecks?.length ? (
                        <div className="space-y-3">
                          {result.factChecks.map((factCheck, index) => (
                            <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center mb-1">
                                <div className="w-4 h-4 mr-2 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs">
                                  {factCheck.source.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-medium">{factCheck.source}</span>
                              </div>
                              <h6 className="text-sm font-medium mb-1">{factCheck.title}</h6>
                              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{factCheck.snippet}</p>
                              <a 
                                href={factCheck.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-xs text-primary hover:underline mt-1 inline-flex items-center"
                              >
                                Read full fact check <ExternalLink className="ml-1 h-3 w-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No specific fact checks found for this content.
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                )}
                
                {/* Sentiment & Bias Analysis - Hide if not applicable */}
                {result.confidence > 0 && (
                <Collapsible defaultOpen className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h5 className="font-medium text-sm">Sentiment & Bias Analysis</h5>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="flex flex-col sm:flex-row mb-3 gap-4">
                        <div className="w-full sm:w-1/3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Emotional Tone</p>
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${getSentimentColor(result.sentiment?.emotionalTone, result.sentiment?.emotionalToneScore)} mr-2`}>
                              {result.sentiment?.emotionalTone || 'N/A'}
                            </span>
                            <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getSentimentColor(result.sentiment?.emotionalTone, result.sentiment?.emotionalToneScore).replace('text-', 'bg-')}`}
                                style={{ width: `${(result.sentiment?.emotionalToneScore || 0) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="w-full sm:w-1/3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Language Style</p>
                          <div className="flex items-center">
                            <span className={`text-sm font-medium ${getSentimentColor(result.sentiment?.languageStyle, result.sentiment?.languageStyleScore)} mr-2`}>
                              {result.sentiment?.languageStyle || 'N/A'}
                            </span>
                            <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${getSentimentColor(result.sentiment?.languageStyle, result.sentiment?.languageStyleScore).replace('text-', 'bg-')}`}
                                style={{ width: `${(result.sentiment?.languageStyleScore || 0) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="w-full sm:w-1/3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Political Leaning</p>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">
                              {result.sentiment?.politicalLeaning || 'N/A'}
                            </span>
                            <div className="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gray-400"
                                style={{ width: `${(result.sentiment?.politicalLeaningScore || 0) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-4">
                        {result.sentiment?.emotionalTone === 'Fear-inducing' || result.sentiment?.languageStyle === 'Sensationalist' 
                          ? 'This content uses emotionally charged language designed to provoke strong reactions. It contains sensationalist phrases and emotional triggers that may influence judgment.'
                          : result.sentiment?.emotionalTone === 'Emotional' || result.sentiment?.languageStyle === 'Slightly sensationalist'
                            ? 'This content uses somewhat emotional language that may influence reader perception. Be aware of how tone affects the presentation of facts.'
                            : 'This content uses mostly neutral language and presents information in a balanced way without excessive emotional appeals.'}
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                )}

                {/* AI-Powered Summary (NEW) */}
                {result.summary && (
                  <Collapsible defaultOpen className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-primary" />
                        <h5 className="font-medium text-sm">AI Summary</h5>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="p-4 bg-white dark:bg-gray-800">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <p>{result.summary}</p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Explainable AI (NEW) */}
                {result.xai && (
                  <Collapsible defaultOpen className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <div className="flex items-center">
                        <Microscope className="h-4 w-4 mr-2 text-primary" />
                        <h5 className="font-medium text-sm">Why We Flagged This {result.classification === 'real' ? 'as Real' : 'Content'}</h5>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                      <div className="p-4 bg-white dark:bg-gray-800">
                        {/* Key Phrases */}
                        {result.xai.keyPhrases && result.xai.keyPhrases.length > 0 && (
                          <div className="mb-4">
                            <h6 className="text-sm font-medium mb-2 flex items-center">
                              <Code className="h-3 w-3 mr-1" /> Key Phrases
                            </h6>
                            <div className="space-y-2">
                              {result.xai.keyPhrases.map((phrase, idx) => (
                                <div key={idx} className="p-3 rounded-md bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className={`text-sm font-medium ${phrase.impact < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                      "{phrase.text}"
                                    </span>
                                    <div className="flex items-center">
                                      <span className="text-xs text-gray-500 mr-1">Impact:</span>
                                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full ${phrase.impact < 0 ? 'bg-red-500' : 'bg-green-500'}`}
                                          style={{ width: `${Math.abs(phrase.impact) * 100}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300">{phrase.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Detection Confidence */}
                        {result.xai.detectionConfidence && result.xai.detectionConfidence.length > 0 && (
                          <div className="mb-4">
                            <h6 className="text-sm font-medium mb-2 flex items-center">
                              <Lightbulb className="h-3 w-3 mr-1" /> Detection Methods
                            </h6>
                            <div className="space-y-2">
                              {result.xai.detectionConfidence.map((detection, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-800">
                                  <div className="flex items-center">
                                    <span className="text-sm">{detection.algorithm}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-xs text-gray-500 mr-2">{Math.round(detection.score * 100)}%</span>
                                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary"
                                        style={{ width: `${detection.score * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{result.xai.detectionConfidence[0]?.explanation}</p>
                          </div>
                        )}

                        {/* Alternative Sources */}
                        {result.xai.alternativeSources && result.xai.alternativeSources.length > 0 && (
                          <div>
                            <h6 className="text-sm font-medium mb-2 flex items-center">
                              <LinkIcon className="h-3 w-3 mr-1" /> Credible Alternative Sources
                            </h6>
                            <div className="space-y-2">
                              {result.xai.alternativeSources.map((source, idx) => (
                                <a 
                                  key={idx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                  <span className="text-sm text-primary">{source.title}</span>
                                  <div className="flex items-center">
                                    <span className="text-xs text-gray-500 mr-1">Trust:</span>
                                    <div className="w-8 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-green-500"
                                        style={{ width: `${source.trustScore * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* AI Debunker Chatbot */}
                <Collapsible 
                  open={isChatOpen}
                  onOpenChange={setIsChatOpen}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 text-primary" />
                      <h5 className="font-medium text-sm">AI Assistant (Beta)</h5>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        {chatMessages.length === 0 ? (
                          <div className="mb-3">
                            <p className="text-sm mb-2">Ask our AI assistant questions about this content:</p>
                            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                              <li 
                                className="flex items-center cursor-pointer hover:text-primary transition-colors" 
                                onClick={() => handleSuggestionClick(`Why is this considered ${result.classification}?`)}
                              >
                                <span className="inline-block w-1 h-1 bg-primary rounded-full mr-1.5"></span>
                                Why is this considered {result.classification}?
                              </li>
                              <li 
                                className="flex items-center cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSuggestionClick("Can you debunk the main claims?")}
                              >
                                <span className="inline-block w-1 h-1 bg-primary rounded-full mr-1.5"></span>
                                Can you debunk the main claims?
                              </li>
                              <li 
                                className="flex items-center cursor-pointer hover:text-primary transition-colors"
                                onClick={() => handleSuggestionClick("What are reliable sources on this topic?")}
                              >
                                <span className="inline-block w-1 h-1 bg-primary rounded-full mr-1.5"></span>
                                What are reliable sources on this topic?
                              </li>
                            </ul>
                          </div>
                        ) : (
                          <div className="mb-3 max-h-60 overflow-y-auto space-y-3">
                            {chatMessages.map((message, index) => (
                              <div 
                                key={index} 
                                className={`p-2 rounded-lg ${
                                  message.isUser 
                                    ? 'bg-primary/10 ml-6' 
                                    : 'bg-gray-100 dark:bg-gray-800 mr-6 border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <div className="flex items-start">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 ${
                                    message.isUser 
                                      ? 'bg-primary text-white' 
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  }`}>
                                    {message.isUser ? 'U' : 'AI'}
                                  </div>
                                  <div className="text-sm flex-1">
                                    {message.text}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {chatbotMutation.isPending && (
                              <div className="flex items-center justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                                <span className="text-xs text-gray-500">AI is thinking...</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <form onSubmit={handleChatSubmit} className="relative">
                          <input 
                            id="chat-input"
                            type="text" 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask a question..." 
                            className="w-full py-2 px-3 rounded-md border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            disabled={chatbotMutation.isPending}
                          />
                          <Button 
                            type="submit"
                            size="sm" 
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7"
                            disabled={chatbotMutation.isPending || !chatInput.trim()}
                          >
                            {chatbotMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <SendIcon className="h-3 w-3" />
                            )}
                          </Button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2">This feature is in beta. Responses are generated by AI and may not always be accurate.</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex space-x-3">
                <Button 
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <span className="animate-spin mr-2">
                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" /> Save Report
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'TruthLens Analysis',
                        text: `This content was analyzed as ${result.classification.toUpperCase()} with ${Math.round(result.confidence * 100)}% confidence`,
                        url: window.location.href
                      }).catch(console.error);
                    }
                  }}
                >
                  <Share className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default ResultsDisplay;
