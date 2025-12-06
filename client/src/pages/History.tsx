import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, Link, Image, FileSearch, Search, Filter, Calendar, 
  ChevronDown, ChevronUp, ExternalLink, Clock, ArrowDownAZ, 
  ArrowUpAZ, AlertCircle, ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Analysis } from '@shared/schema';
import { Link as WouterLink, useLocation } from 'wouter';
import ResultsDisplay from '@/components/ResultsDisplay';

const History: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [selectedClassification, setSelectedClassification] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  
  // Get user analysis history
  const { data: analysisHistory, isLoading } = useQuery<Analysis[]>({
    queryKey: ['/api/history'],
    enabled: isAuthenticated,
  });

  // Filter and sort analyses
  const filteredAnalyses = React.useMemo(() => {
    if (!analysisHistory) return [];
    
    let filtered = [...analysisHistory];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by content type
    if (selectedContentType) {
      filtered = filtered.filter(a => a.contentType === selectedContentType);
    }
    
    // Filter by classification
    if (selectedClassification) {
      filtered = filtered.filter(a => {
        const result = a.result as any;
        return result.classification === selectedClassification;
      });
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  }, [analysisHistory, searchTerm, selectedContentType, selectedClassification, sortOrder]);

  const handleViewAnalysis = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    // Scroll to the analysis details after a short delay
    setTimeout(() => {
      document.getElementById('analysis-details')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedContentType(null);
    setSelectedClassification(null);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const getContentTypeIcon = (contentType: string) => {
    switch(contentType) {
      case 'text': return <FileText className="h-5 w-5" />;
      case 'url': return <Link className="h-5 w-5" />;
      case 'image': return <Image className="h-5 w-5" />;
      case 'document': return <FileSearch className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Your Analysis History</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Review all your previous fact checks and analyses
          </p>
        </div>
        
        {!isAuthenticated ? (
          <Card className="mb-8">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-60">
              <h3 className="text-xl font-semibold mb-4">You need to be logged in</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please log in or create an account to view your analysis history
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <WouterLink href="/">Go Home</WouterLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Analysis history */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex flex-col lg:flex-row justify-between">
                  <div>
                    <CardTitle>Analysis History</CardTitle>
                    <CardDescription>
                      {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'analysis' : 'analyses'} found
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row mt-4 lg:mt-0 gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <Input
                        placeholder="Search analyses..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-xs text-gray-500">Content Type</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => setSelectedContentType('text')}
                            className={selectedContentType === 'text' ? 'bg-primary/10' : ''}
                          >
                            <FileText className="mr-2 h-4 w-4" /> Text
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setSelectedContentType('url')}
                            className={selectedContentType === 'url' ? 'bg-primary/10' : ''}
                          >
                            <Link className="mr-2 h-4 w-4" /> URL
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setSelectedContentType('image')}
                            className={selectedContentType === 'image' ? 'bg-primary/10' : ''}
                          >
                            <Image className="mr-2 h-4 w-4" /> Image
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setSelectedContentType('document')}
                            className={selectedContentType === 'document' ? 'bg-primary/10' : ''}
                          >
                            <FileSearch className="mr-2 h-4 w-4" /> Document
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-xs text-gray-500">Classification</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => setSelectedClassification('real')}
                            className={selectedClassification === 'real' ? 'bg-primary/10' : ''}
                          >
                            <span className="mr-2 h-3 w-3 rounded-full bg-green-500" /> Real
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setSelectedClassification('fake')}
                            className={selectedClassification === 'fake' ? 'bg-primary/10' : ''}
                          >
                            <span className="mr-2 h-3 w-3 rounded-full bg-red-500" /> Fake
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setSelectedClassification('misleading')}
                            className={selectedClassification === 'misleading' ? 'bg-primary/10' : ''}
                          >
                            <span className="mr-2 h-3 w-3 rounded-full bg-yellow-500" /> Misleading
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={clearFilters}>
                          <AlertCircle className="mr-2 h-4 w-4" /> Clear All Filters
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                      {sortOrder === 'newest' ? (
                        <Calendar className="h-4 w-4" />
                      ) : (
                        <Calendar className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {filteredAnalyses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Search className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          {searchTerm || selectedContentType || selectedClassification
                            ? "No analyses match your filters"
                            : "No analyses yet"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                          {searchTerm || selectedContentType || selectedClassification
                            ? "Try adjusting your search or filters"
                            : "Get started by analyzing some content"}
                        </p>
                        {searchTerm || selectedContentType || selectedClassification ? (
                          <Button onClick={clearFilters}>Clear Filters</Button>
                        ) : (
                          <Button asChild>
                            <WouterLink href="/#analyzer">Analyze Content</WouterLink>
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredAnalyses.map((analysis) => {
                          const result = analysis.result as any;
                          return (
                            <div 
                              key={analysis.id} 
                              className="flex p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                              onClick={() => handleViewAnalysis(analysis)}
                            >
                              <div className="mr-4">
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center
                                  ${result.classification === 'real' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                                    result.classification === 'fake' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}
                                >
                                  {getContentTypeIcon(analysis.contentType)}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium truncate max-w-[200px] md:max-w-md">
                                      {analysis.contentType === 'text' 
                                        ? analysis.content.length > 60 ? analysis.content.substring(0, 60) + '...' : analysis.content
                                        : analysis.content}
                                    </p>
                                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {new Date(analysis.createdAt).toLocaleString()}
                                      <span className="mx-2">•</span>
                                      <span className="capitalize">{analysis.contentType}</span>
                                    </div>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-xs font-medium
                                    ${result.classification === 'real' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                                      result.classification === 'fake' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}
                                  >
                                    {result.classification.toUpperCase()}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-1">
                                  {result.reasoning?.[0] || result.explanation || 'No reasoning available'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Selected analysis details */}
            {selectedAnalysis && (
              <div id="analysis-details">
                <ResultsDisplay 
                  result={selectedAnalysis.result as any} 
                  contentPreview={selectedAnalysis.content} 
                  onReset={() => setSelectedAnalysis(null)} 
                />
              </div>
            )}
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default History;
