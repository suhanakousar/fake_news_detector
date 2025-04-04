import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Flag, AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getClassificationColor, getCredibilityLevelColor } from '@/lib/analysis';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const { toast } = useToast();

  // If loading, show loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  // If not an admin, show unauthorized
  if (user?.role !== "admin") {
    return (
      <div className="container max-w-6xl mx-auto py-10 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>
            You do not have permission to access this page. This area is restricted to admin users only.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-10 px-4">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, review analyses, and monitor platform activity.
          </p>
        </div>
        
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="analyses">All Analyses</TabsTrigger>
            <TabsTrigger value="flagged">Flagged Content</TabsTrigger>
            <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <UsersList />
          </TabsContent>
          
          <TabsContent value="analyses" className="space-y-4">
            <AnalysesList />
          </TabsContent>
          
          <TabsContent value="flagged" className="space-y-4">
            <FlaggedContentList />
          </TabsContent>
          
          <TabsContent value="feedback" className="space-y-4">
            <FeedbackList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UsersList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['/api/admin/users'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) return <LoadingState message="Loading users..." />;
  if (error) return <ErrorState message="Failed to load users" />;
  if (!users || !users.length) return <EmptyState message="No users found" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>
          {users.length} registered users on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AnalysesList() {
  const { data: analyses, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analyses'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { toast } = useToast();

  const flagMutation = useMutation({
    mutationFn: async ({ id, isFlagged }: { id: number; isFlagged: boolean }) => {
      const response = await fetch(`/api/admin/analysis/${id}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update flag status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analyses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analyses/flagged'] });
      toast({
        title: 'Analysis updated',
        description: 'The flag status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) return <LoadingState message="Loading analyses..." />;
  if (error) return <ErrorState message="Failed to load analyses" />;
  if (!analyses || !analyses.length) return <EmptyState message="No analyses found" />;

  const getUserName = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    return user ? user.username : `User ${userId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Analyses</CardTitle>
        <CardDescription>
          {analyses.length} content analyses performed on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Content Type</TableHead>
                <TableHead>Content Preview</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analyses.map((analysis) => {
                const contentPreview = analysis.content.length > 30
                  ? `${analysis.content.substring(0, 30)}...`
                  : analysis.content;
                
                return (
                  <TableRow key={analysis.id}>
                    <TableCell>{analysis.id}</TableCell>
                    <TableCell>{getUserName(analysis.userId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{analysis.contentType}</Badge>
                    </TableCell>
                    <TableCell title={analysis.content}>{contentPreview}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: getClassificationColor(analysis.result.classification) }}>
                        {analysis.result.classification}
                      </Badge>
                    </TableCell>
                    <TableCell>{(analysis.result.confidence * 100).toFixed(0)}%</TableCell>
                    <TableCell>{formatDate(analysis.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => flagMutation.mutate({
                            id: analysis.id,
                            isFlagged: !analysis.isFlagged
                          })}
                          title={analysis.isFlagged ? "Unflag this content" : "Flag this content"}
                        >
                          <Flag
                            className={`h-4 w-4 ${analysis.isFlagged ? "fill-destructive text-destructive" : ""}`}
                          />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function FlaggedContentList() {
  const { data: flaggedAnalyses, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analyses/flagged'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { toast } = useToast();

  const flagMutation = useMutation({
    mutationFn: async ({ id, isFlagged }: { id: number; isFlagged: boolean }) => {
      const response = await fetch(`/api/admin/analysis/${id}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFlagged }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update flag status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analyses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analyses/flagged'] });
      toast({
        title: 'Analysis updated',
        description: 'The flag status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) return <LoadingState message="Loading flagged content..." />;
  if (error) return <ErrorState message="Failed to load flagged content" />;
  if (!flaggedAnalyses || !flaggedAnalyses.length) return <EmptyState message="No flagged content found" />;

  const getUserName = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    return user ? user.username : `User ${userId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flagged Content</CardTitle>
        <CardDescription>
          {flaggedAnalyses.length} items of content flagged for review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Content Type</TableHead>
                <TableHead>Content Preview</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flaggedAnalyses.map((analysis) => {
                const contentPreview = analysis.content.length > 30
                  ? `${analysis.content.substring(0, 30)}...`
                  : analysis.content;
                
                return (
                  <TableRow key={analysis.id}>
                    <TableCell>{analysis.id}</TableCell>
                    <TableCell>{getUserName(analysis.userId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{analysis.contentType}</Badge>
                    </TableCell>
                    <TableCell title={analysis.content}>{contentPreview}</TableCell>
                    <TableCell>
                      <Badge style={{ backgroundColor: getClassificationColor(analysis.result.classification) }}>
                        {analysis.result.classification}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(analysis.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => flagMutation.mutate({
                            id: analysis.id,
                            isFlagged: false
                          })}
                          title="Remove flag"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function FeedbackList() {
  const { data: feedback, isLoading, error } = useQuery({
    queryKey: ['/api/admin/feedback'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  if (isLoading) return <LoadingState message="Loading feedback..." />;
  if (error) return <ErrorState message="Failed to load feedback" />;
  if (!feedback || !feedback.length) return <EmptyState message="No feedback found" />;

  const getUserName = (userId: number | null) => {
    if (!userId) return 'Anonymous';
    const user = users?.find(u => u.id === userId);
    return user ? user.username : `User ${userId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Feedback</CardTitle>
        <CardDescription>
          {feedback.length} items of feedback provided by users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Analysis ID</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{getUserName(item.userId)}</TableCell>
                  <TableCell>{item.analysisId || '-'}</TableCell>
                  <TableCell>{item.content}</TableCell>
                  <TableCell>{formatDate(item.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// Helper components
function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p>{message}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
      <div className="rounded-full bg-muted p-3">
        <Eye className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="font-medium text-lg">No data available</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

// Helper function to format dates
function formatDate(dateString: string | Date | null) {
  if (!dateString) return 'N/A';
  
  const date = typeof dateString === 'string' 
    ? new Date(dateString) 
    : dateString;
    
  return date instanceof Date && !isNaN(date.getTime())
    ? new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    : 'Invalid date';
}