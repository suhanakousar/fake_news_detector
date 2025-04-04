import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Chart } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Analysis } from '@shared/schema';
import { 
  FileText, 
  Link as LinkIcon, 
  Image, 
  FileSearch, 
  ChartBarStacked,
  Activity,
  Clock,
  Search,
  ChevronRight
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Get user analysis history
  const { data: analysisHistory, isLoading } = useQuery<Analysis[]>({
    queryKey: ['/api/history'],
    enabled: isAuthenticated,
  });

  // Build fake news statistics from the history
  const getAnalysisStats = () => {
    if (!analysisHistory) return { real: 0, fake: 0, misleading: 0, total: 0 };
    
    const stats = {
      real: 0,
      fake: 0,
      misleading: 0,
      total: analysisHistory.length
    };
    
    analysisHistory.forEach(analysis => {
      const result = analysis.result as any;
      if (result.classification === 'real') stats.real++;
      else if (result.classification === 'fake') stats.fake++;
      else if (result.classification === 'misleading') stats.misleading++;
    });
    
    return stats;
  };

  const stats = getAnalysisStats();
  
  // Mock data for charts
  const chartData = [
    { name: 'Real', value: stats.real || 0 },
    { name: 'Fake', value: stats.fake || 0 },
    { name: 'Misleading', value: stats.misleading || 0 },
  ];

  const activityData = [
    { day: 'Mon', analyses: 4 },
    { day: 'Tue', analyses: 7 },
    { day: 'Wed', analyses: 5 },
    { day: 'Thu', analyses: 8 },
    { day: 'Fri', analyses: 12 },
    { day: 'Sat', analyses: 3 },
    { day: 'Sun', analyses: 2 },
  ];

  // Get latest analyses (limit to 5)
  const latestAnalyses = analysisHistory?.slice(0, 5) || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {user ? `Welcome back, ${user.username}!` : 'Welcome to your dashboard'}
          </p>
        </div>
        
        {!isAuthenticated ? (
          <Card className="mb-8">
            <CardContent className="pt-6 flex flex-col items-center justify-center text-center h-60">
              <h3 className="text-xl font-semibold mb-4">You need to be logged in</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Please log in or create an account to access your dashboard
              </p>
              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Dashboard content for logged in users */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Stats cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Analyses</CardTitle>
                  <CardDescription>All time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <FileSearch className="h-8 w-8 mr-3 text-primary" />
                    <div className="text-3xl font-bold">
                      {isLoading ? (
                        <Skeleton className="h-9 w-20" />
                      ) : (
                        stats.total
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Fake News Detected</CardTitle>
                  <CardDescription>All time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 mr-3 text-red-500" />
                    <div className="text-3xl font-bold">
                      {isLoading ? (
                        <Skeleton className="h-9 w-20" />
                      ) : (
                        stats.fake
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Last Analysis</CardTitle>
                  <CardDescription>Date and time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 mr-3 text-primary" />
                    <div className="text-sm font-medium">
                      {isLoading ? (
                        <Skeleton className="h-6 w-28" />
                      ) : (
                        analysisHistory && analysisHistory.length > 0 ? (
                          new Date(analysisHistory[0].createdAt).toLocaleString()
                        ) : (
                          "No analyses yet"
                        )
                      )}
                    </div>
                  </div>
                  
                  {user?.role === 'admin' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href="/admin">
                          <span className="flex items-center justify-center">
                            Admin Dashboard <ChevronRight className="ml-1 h-4 w-4" />
                          </span>
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
              {/* Charts */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Analysis Activity</CardTitle>
                  <CardDescription>Your fact-checking activity for the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <Chart 
                      type="bar"
                      data={activityData} 
                      xField="day"
                      yField="analyses"
                      height={250}
                    />
                  )}
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Content Classification</CardTitle>
                  <CardDescription>Breakdown of analysis results</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <Chart 
                      type="pie"
                      data={chartData} 
                      nameField="name"
                      valueField="value"
                      height={250}
                      colors={["#10b981", "#dc2626", "#f59e0b"]}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Recent analyses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Analyses</CardTitle>
                  <CardDescription>Your most recent fact checks</CardDescription>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/history">
                    <span className="flex items-center">View All <ChevronRight className="ml-1 h-4 w-4" /></span>
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {latestAnalyses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Search className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by analyzing some content</p>
                        <Button asChild>
                          <Link href="/#analyzer">Analyze Content</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {latestAnalyses.map((analysis) => {
                          const result = analysis.result as any;
                          // Get appropriate icon based on content type
                          let TypeIcon = FileText;
                          if (analysis.contentType === 'url') TypeIcon = LinkIcon;
                          else if (analysis.contentType === 'image') TypeIcon = Image;
                          
                          return (
                            <div key={analysis.id} className="flex p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                              <div className="mr-4">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center
                                  ${result.classification === 'real' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                                    result.classification === 'fake' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}
                                >
                                  <TypeIcon className="h-5 w-5" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium truncate max-w-[200px] md:max-w-md">
                                      {analysis.contentType === 'text' 
                                        ? analysis.content.length > 40 ? analysis.content.substring(0, 40) + '...' : analysis.content
                                        : analysis.content}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {new Date(analysis.createdAt).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className={`px-2 py-1 rounded text-xs font-medium
                                    ${result.classification === 'real' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                                      result.classification === 'fake' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'}`}
                                  >
                                    {result.classification.toUpperCase()}
                                  </div>
                                </div>
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
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
