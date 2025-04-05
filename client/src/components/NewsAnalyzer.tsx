import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  AlignLeft, Link, FileText, Image, Mic, 
  Search, Globe, FileSearch, ImageUp, Waves,
  Upload, FileUp, Square, Loader
} from 'lucide-react';
import ResultsDisplay from './ResultsDisplay';
import { analyzeContent } from '@/lib/analysis';
import { AnalysisResult } from '@shared/schema';

// Add Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const NewsAnalyzer: React.FC = () => {
  const [activeTab, setActiveTab] = useState('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [voiceInput, setVoiceInput] = useState('');
  const [speechRecognition, setSpeechRecognition] = useState<any>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if (activeTab === 'voice') {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          setRecordedText(finalTranscript || interimTranscript);
          setVoiceInput(finalTranscript || interimTranscript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          if (event.error === 'not-allowed') {
            toast({
              title: "Microphone access denied",
              description: "Please allow microphone access to use voice input",
              variant: "destructive",
            });
            stopRecording();
          }
        };
        
        setSpeechRecognition(recognition);
      } else {
        toast({
          title: "Speech recognition not supported",
          description: "Your browser doesn't support speech recognition. Try using Chrome or Edge.",
          variant: "destructive",
        });
      }
    }
    
    return () => {
      if (speechRecognition) {
        stopRecording();
      }
    };
  }, [activeTab]);
  
  const startRecording = () => {
    if (speechRecognition) {
      try {
        speechRecognition.start();
        setIsRecording(true);
        if (visualizerRef.current) {
          visualizerRef.current.classList.remove('hidden');
        }
        toast({
          title: "Recording started",
          description: "Speak clearly into your microphone",
        });
      } catch (error) {
        console.error('Failed to start recording:', error);
        toast({
          title: "Failed to start recording",
          description: "Please try again or use text input",
          variant: "destructive",
        });
      }
    }
  };
  
  const stopRecording = () => {
    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (error) {
        console.error('Error stopping recording:', error);
      }
      setIsRecording(false);
      if (visualizerRef.current) {
        visualizerRef.current.classList.add('hidden');
      }
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset result when changing tabs
    setAnalysisResult(null);
    setShowResults(false);
  };

  const handleFileClick = (type: 'document' | 'image') => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      
      let request = {};
      
      switch (activeTab) {
        case 'text':
          if (!textInput.trim()) {
            toast({
              title: "Empty input",
              description: "Please enter some text to analyze",
              variant: "destructive",
            });
            setIsAnalyzing(false);
            return;
          }
          request = { text: textInput, language: selectedLanguage };
          break;
        
        case 'url':
          if (!urlInput.trim()) {
            toast({
              title: "Empty URL",
              description: "Please enter a URL to analyze",
              variant: "destructive",
            });
            setIsAnalyzing(false);
            return;
          }
          request = { url: urlInput, language: selectedLanguage };
          break;
        
        case 'document':
        case 'image':
          if (!selectedFile) {
            toast({
              title: "No file selected",
              description: `Please select a ${activeTab} to analyze`,
              variant: "destructive",
            });
            setIsAnalyzing(false);
            return;
          }
          request = { file: selectedFile, language: selectedLanguage };
          break;
        
        case 'voice':
          if (!voiceInput.trim()) {
            toast({
              title: "No voice input detected",
              description: "Please record your voice or upload an audio file",
              variant: "destructive",
            });
            setIsAnalyzing(false);
            return;
          }
          
          if (isRecording) {
            stopRecording();
          }
          
          request = { text: voiceInput, language: selectedLanguage };
      }
      
      // Analyze content
      const result = await analyzeContent(request);
      
      // Set result and show results section
      setAnalysisResult(result);
      setShowResults(true);
      
      // Scroll to results after a short delay
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setShowResults(false);
    setTextInput('');
    setUrlInput('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'text':
        return (
          <>
            <h3 className="text-xl font-semibold mb-4 font-serif">Analyze Text for Misinformation</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Paste news article, social media post, or any text to verify its authenticity.</p>
            <div className="mb-6">
              <Textarea 
                className="h-40 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition"
                placeholder="Paste text here to analyze..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="rounded-lg shadow-md hover:shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Analyze Now
                  </>
                )}
              </Button>
            </div>
          </>
        );
      
      case 'url':
        return (
          <>
            <h3 className="text-xl font-semibold mb-4 font-serif">Analyze News URL</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Enter a news article URL to extract and analyze its content.</p>
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe className="h-5 w-5 text-gray-400" />
                </div>
                <Input 
                  type="url" 
                  className="pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  placeholder="https://example.com/news-article"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="rounded-lg shadow-md hover:shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" /> Analyze URL
                  </>
                )}
              </Button>
            </div>
          </>
        );
      
      case 'document':
        return (
          <>
            <h3 className="text-xl font-semibold mb-4 font-serif">Upload Document</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Upload PDF or DOCX files to extract and analyze text.</p>
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileUp className="h-8 w-8" />
                </div>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Drag and drop files here, or click to browse'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Supports PDF, DOCX (Max 5MB)</p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.docx,.txt,.html" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleFileClick('document')}
                >
                  Browse Files
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !selectedFile}
                className="rounded-lg shadow-md hover:shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileSearch className="mr-2 h-4 w-4" /> Analyze Document
                  </>
                )}
              </Button>
            </div>
          </>
        );
      
      case 'image':
        return (
          <>
            <h3 className="text-xl font-semibold mb-4 font-serif">Upload Image</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Upload screenshots or images with text to extract and analyze.</p>
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Image className="h-8 w-8" />
                </div>
                <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
                  {selectedFile ? `Selected: ${selectedFile.name}` : 'Drag and drop images here, or click to browse'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Supports JPG, PNG (Max 5MB)</p>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => handleFileClick('image')}
                >
                  Browse Images
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !selectedFile}
                className="rounded-lg shadow-md hover:shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ImageUp className="mr-2 h-4 w-4" /> Analyze Image
                  </>
                )}
              </Button>
            </div>
          </>
        );
      
      case 'voice':
        return (
          <>
            <h3 className="text-xl font-semibold mb-4 font-serif">Record or Upload Voice</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Record audio or upload audio files to transcribe and analyze.</p>
            <div className="mb-6">
              <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col items-center justify-center">
                  <div 
                    className={`mb-4 w-16 h-16 flex items-center justify-center rounded-full cursor-pointer transition-colors ${isRecording 
                      ? 'bg-red-600 text-white animate-pulse' 
                      : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    role="button"
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                  >
                    {isRecording ? (
                      <Square className="h-6 w-6" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </div>
                  <p className="text-sm font-medium mb-4">
                    {isRecording ? "Click to stop recording" : "Click to start recording"}
                  </p>
                  
                  <div 
                    ref={visualizerRef}
                    className="w-full mb-6 flex justify-center hidden"
                  >
                    <div className="flex space-x-1">
                      <div className="w-1 h-6 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-1 h-10 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-8 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                      <div className="w-1 h-7 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.8s' }}></div>
                    </div>
                  </div>
                  
                  {voiceInput && (
                    <div className="w-full mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 font-medium">Transcribed Text:</p>
                      <p className="text-sm italic">{voiceInput}</p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Or upload audio file</p>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="audio/*" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <Button 
                      variant="outline"
                      onClick={() => handleFileClick('document')}
                    >
                      Browse Audio Files
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || (!voiceInput && !selectedFile)}
                className="rounded-lg shadow-md hover:shadow-lg"
              >
                {isAnalyzing ? (
                  <>
                    <span className="animate-spin mr-2">
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Waves className="mr-2 h-4 w-4" /> Analyze Voice Input
                  </>
                )}
              </Button>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <section id="analyzer" className="mb-16">
        <div className="max-w-4xl mx-auto">
          {/* Analyzer Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="mb-6 overflow-x-auto pb-2">
              <TabsList className="bg-gray-100 dark:bg-gray-800 p-1">
                <TabsTrigger value="text" className="flex items-center">
                  <AlignLeft className="mr-2 h-4 w-4" /> Text
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center">
                  <Link className="mr-2 h-4 w-4" /> URL
                </TabsTrigger>
                <TabsTrigger value="document" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" /> Document
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center">
                  <Image className="mr-2 h-4 w-4" /> Image
                </TabsTrigger>
                <TabsTrigger value="voice" className="flex items-center">
                  <Mic className="mr-2 h-4 w-4" /> Voice
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Language Selector */}
            <div className="mb-4 flex justify-end">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <Select 
                  value={selectedLanguage} 
                  onValueChange={setSelectedLanguage}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish (Español)</SelectItem>
                    <SelectItem value="fr">French (Français)</SelectItem>
                    <SelectItem value="de">German (Deutsch)</SelectItem>
                    <SelectItem value="it">Italian (Italiano)</SelectItem>
                    <SelectItem value="pt">Portuguese (Português)</SelectItem>
                    <SelectItem value="ru">Russian (Русский)</SelectItem>
                    <SelectItem value="zh">Chinese (中文)</SelectItem>
                    <SelectItem value="ja">Japanese (日本語)</SelectItem>
                    <SelectItem value="ko">Korean (한국어)</SelectItem>
                    <SelectItem value="ar">Arabic (العربية)</SelectItem>
                    <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Tab Content */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <CardContent className="p-6">
                <TabsContent value={activeTab} forceMount={true} hidden={activeTab !== 'text'}>
                  {renderTabContent()}
                </TabsContent>
                <TabsContent value={activeTab} forceMount={true} hidden={activeTab !== 'url'}>
                  {renderTabContent()}
                </TabsContent>
                <TabsContent value={activeTab} forceMount={true} hidden={activeTab !== 'document'}>
                  {renderTabContent()}
                </TabsContent>
                <TabsContent value={activeTab} forceMount={true} hidden={activeTab !== 'image'}>
                  {renderTabContent()}
                </TabsContent>
                <TabsContent value={activeTab} forceMount={true} hidden={activeTab !== 'voice'}>
                  {renderTabContent()}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </section>

      {/* Results Section */}
      {showResults && analysisResult && (
        <motion.div
          id="results"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ResultsDisplay 
            result={analysisResult} 
            contentPreview={activeTab === 'text' ? textInput.substring(0, 200) + (textInput.length > 200 ? '...' : '') : 
                            activeTab === 'url' ? urlInput : 
                            selectedFile ? selectedFile.name : ''}
            onReset={resetAnalysis}
          />
        </motion.div>
      )}
    </>
  );
};

export default NewsAnalyzer;
