import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  MessageSquare, X, Send, Mic, MinusSquare, 
  ChevronUp, Loader2, AlertCircle, PaperclipIcon, FileText
} from 'lucide-react';
import { AnalysisResult } from '@shared/schema';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatbotFloatingProps {
  analysisResult?: AnalysisResult;
  contentPreview?: string;
  isResultsPage?: boolean;
}

const ChatbotFloating: React.FC<ChatbotFloatingProps> = ({ 
  analysisResult, 
  contentPreview,
  isResultsPage = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Introduction message shown when chat opens
  useEffect(() => {
    if (isOpen && chatMessages.length === 0) {
      const welcomeMessage = analysisResult 
        ? `Hello! I can help answer questions about this ${analysisResult.classification} content. What would you like to know?`
        : "Hello! I'm TruthLens AI Assistant. How can I help you verify information today?";
      
      setChatMessages([{
        text: welcomeMessage,
        isUser: false,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, analysisResult, chatMessages.length]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Create the chatbot mutation
  const chatbotMutation = useMutation({
    mutationFn: async (question: string) => {
      const payload = analysisResult ? {
        question,
        content: contentPreview || '',
        analysisResult
      } : {
        question,
        content: '',
        analysisResult: null
      };
      
      const response = await apiRequest('POST', '/api/chatbot', payload);
      return await response.json();
    },
    onSuccess: (data) => {
      // Add bot response to messages
      setChatMessages(prev => [
        ...prev,
        {
          text: data.response,
          isUser: false,
          timestamp: new Date()
        }
      ]);
    },
    onError: (error) => {
      // Handle error
      setChatMessages(prev => [
        ...prev,
        {
          text: "Sorry, I couldn't process your question. Please try again.",
          isUser: false,
          timestamp: new Date()
        }
      ]);
    }
  });

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatInput.trim()) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      text: chatInput,
      isUser: true,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    
    // Send question to API
    chatbotMutation.mutate(chatInput);
    
    // Clear input
    setChatInput('');
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setChatInput(suggestion);
    
    // Focus the input after setting the value
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const toggleChat = () => {
    setIsOpen(prev => !prev);
    setIsMinimized(false);
  };
  
  const minimizeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(true);
  };
  
  const maximizeChat = () => {
    setIsMinimized(false);
  };
  
  const closeChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };
  
  const startVoiceRecording = () => {
    // Voice recording logic would go here
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setChatInput('What evidence supports this being classified as misinformation?');
    }, 1500);
  };
  
  // File upload handling
  const handleFileUpload = () => {
    // This would normally handle file selection
    const mockUploadedText = "Breaking news: Scientists discover new renewable energy source with 90% efficiency. Critics say the technology is still unproven. The team at Stanford University claims their new device can convert solar energy at unprecedented rates, but industry experts point out the lack of peer review and real-world testing conditions. The research funded by private investors has yet to be replicated by independent labs.";
    
    // Add a user message showing the uploaded content
    setChatMessages(prev => [
      ...prev,
      {
        text: "I've uploaded a news article for analysis:",
        isUser: true,
        timestamp: new Date()
      },
      {
        text: mockUploadedText,
        isUser: true,
        timestamp: new Date()
      }
    ]);
    
    // Show an automatic article summary
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          text: "**Article Summary**\n\nResearchers claim to have developed a highly efficient renewable energy technology, but the article lacks verification from independent sources and peer-reviewed evidence. The claimed 90% efficiency would be groundbreaking if true, but experts express skepticism due to missing details about testing conditions.",
          isUser: false,
          timestamp: new Date()
        }
      ]);
      
      // Then ask for analysis
      setTimeout(() => {
        chatbotMutation.mutate("Can you analyze this article for potential misinformation?");
      }, 800);
    }, 1000);
  };
  
  // Suggestions based on analysis result
  const getSuggestions = () => {
    if (!analysisResult) return [
      "Can you help me check if an article is reliable?",
      "How do I spot fake news?",
      "What are signs of disinformation?"
    ];
    
    return [
      `Why is this considered ${analysisResult.classification}?`,
      "Can you debunk the main claims?",
      "What are reliable sources on this topic?",
      "How can I verify this information?"
    ];
  };
  
  const suggestions = getSuggestions();

  return (
    <div className={`fixed ${isResultsPage ? 'left-4 bottom-4' : 'right-4 bottom-4'} z-50`}>
      {/* Floating Chat Button */}
      {!isOpen && (
        <motion.button
          onClick={toggleChat}
          className="bg-primary text-white p-4 rounded-full shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MessageSquare className="h-6 w-6" />
        </motion.button>
      )}
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '60px' : '500px',
              width: isMinimized ? '240px' : '350px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            {/* Chat Header - Fixed at the top */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-primary/5 sticky top-0 z-10">
              <div className="flex items-center cursor-pointer" onClick={maximizeChat}>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-2">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium flex items-center">
                    TruthLens AI
                    <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="ml-1 text-xs text-green-500 font-normal">Online</span>
                  </h3>
                  {isMinimized && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Click to expand</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {!isMinimized && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-700" 
                    onClick={minimizeChat}
                  >
                    <MinusSquare className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 hover:bg-gray-100 dark:hover:bg-gray-700" 
                  onClick={closeChat}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Chat Content - Only shown when not minimized */}
            {!isMinimized && (
              <div className="flex flex-col h-[calc(500px-56px)]">
                {/* Messages Area - Scrollable */}
                <div className="flex-1 p-3 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/30">
                  <div className="space-y-4">
                    {chatMessages.map((message, index) => (
                      <motion.div 
                        key={index} 
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} px-1`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div 
                          className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                            message.isUser 
                              ? 'bg-primary text-white rounded-br-none' 
                              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none'
                          }`}
                        >
                          {/* Message Content */}
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.text.split('\n').map((line, i) => {
                              const boldText = line.replace(
                                /\*\*(.*?)\*\*/g, 
                                '<strong>$1</strong>'
                              );
                              
                              const formattedText = boldText.replace(
                                /\*(.*?)\*/g, 
                                '<em>$1</em>'
                              );
                              
                              return (
                                <span 
                                  key={i} 
                                  className="block" 
                                  dangerouslySetInnerHTML={{ __html: formattedText }}
                                />
                              );
                            })}
                          </p>
                          
                          {/* Sources section - shown only for AI messages with sources */}
                          {!message.isUser && index > 0 && index % 2 === 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <details className="text-xs">
                                <summary className="cursor-pointer text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-300">
                                  Sources
                                </summary>
                                <ul className="mt-1 pl-3 space-y-1 list-disc">
                                  <li className="text-blue-600 dark:text-blue-400">
                                    <a 
                                      href="https://www.factcheck.org/" 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      FactCheck.org
                                    </a>
                                  </li>
                                  <li className="text-blue-600 dark:text-blue-400">
                                    <a 
                                      href="https://www.politifact.com/" 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:underline"
                                    >
                                      PolitiFact
                                    </a>
                                  </li>
                                </ul>
                              </details>
                            </div>
                          )}
                          
                          {/* Timestamp */}
                          <span className="text-xs opacity-60 mt-1 block text-right">
                            {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {chatbotMutation.isPending && (
                      <motion.div 
                        className="flex justify-start px-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 max-w-[85%] rounded-bl-none">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1 animate-pulse"></span>
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1 animate-pulse delay-75"></span>
                              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse delay-150"></span>
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Empty div for scrolling to bottom */}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                
                {/* Suggestions */}
                {suggestions.length > 0 && chatMessages.length <= 1 && (
                  <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Input Area - Fixed at the bottom */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0 z-10">
                  {/* Action buttons bar */}
                  <div className="flex mb-2 gap-1 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs flex items-center gap-1 rounded-full px-2 text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={handleFileUpload}
                      disabled={chatbotMutation.isPending}
                    >
                      <PaperclipIcon className="h-3 w-3" />
                      <span>Upload article</span>
                    </Button>
                  </div>
                  
                  <form onSubmit={handleChatSubmit} className="relative">
                    <input 
                      ref={inputRef}
                      type="text" 
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask me anything about this news..." 
                      className="w-full py-2.5 px-10 pr-12 rounded-full border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      disabled={chatbotMutation.isPending}
                    />
                    
                    <button 
                      type="button"
                      onClick={startVoiceRecording}
                      disabled={isRecording || chatbotMutation.isPending}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {isRecording ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button 
                      type="submit"
                      disabled={chatbotMutation.isPending || !chatInput.trim()}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                  
                  {/* Powered by message */}
                  <div className="mt-2 text-center">
                    <p className="text-[10px] text-gray-400">
                      Powered by Perplexity AI Technology
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatbotFloating;