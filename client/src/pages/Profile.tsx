import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { BarChart3, BellRing, Key, User, LockIcon, BellIcon, DownloadIcon, EyeOff, Clock, FileText, Trash2, ArrowLeft } from 'lucide-react';
import { Redirect } from 'wouter';

// Personal info form schema
const personalInfoSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  bio: z.string().optional(),
  location: z.string().optional()
});

// Security form schema
const securitySchema = z.object({
  currentPassword: z.string().min(6, { message: 'Current password is required' }),
  newPassword: z.string().min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
  confirmPassword: z.string().min(8, { message: 'Please confirm your password' })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;

const Profile = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [notificationSettings, setNotificationSettings] = useState({
    emailAlerts: true,
    browserNotifications: true,
    weeklyNewsletters: false,
    productUpdates: true
  });

  // Personal info form
  const personalInfoForm = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      username: user?.username || '',
      fullName: '', // Firebase user might have displayName, but our DB user doesn't
      email: user?.email || '',
      bio: '',
      location: ''
    }
  });

  // Security form
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const handlePersonalInfoSubmit = async (data: PersonalInfoFormValues) => {
    try {
      console.log('Updating personal info:', data);
      // In a real app, we would send this data to a backend API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Profile updated',
        description: 'Your personal information has been updated successfully.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSecuritySubmit = async (data: SecurityFormValues) => {
    try {
      console.log('Updating security settings:', data);
      // In a real app, we would send this data to a backend API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
        variant: 'default',
      });
      securityForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const toggleNotificationSetting = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    toast({
      title: 'Preferences updated',
      description: `Notification preference has been updated.`,
      variant: 'default',
    });
  };

  const recentAnalyses = [
    { id: 1, title: 'COVID-19 Vaccine Article', date: '2 days ago', result: 'real' },
    { id: 2, title: 'Climate Change Report', date: '1 week ago', result: 'misleading' },
    { id: 3, title: 'Political Statement Analysis', date: '2 weeks ago', result: 'fake' }
  ];

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast({
        title: 'Account deletion initiated',
        description: 'We have sent a confirmation email. Please follow the instructions to complete the process.',
        variant: 'default',
      });
    }
  };

  const handleDataDownload = () => {
    toast({
      title: 'Data export initiated',
      description: 'Your data is being prepared. We will email you when it\'s ready for download.',
      variant: 'default',
    });
  };

  // Redirect to login if not authenticated
  if (!loading && !isAuthenticated) {
    return <Redirect to="/auth" />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.history.back()}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <h1 className="text-4xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar / User Info */}
        <div className="lg:col-span-1">
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.photoURL || "/icon.png"} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    <img 
                      src="/icon.png" 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-bold">{user?.username}</h2>
                <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <Badge variant="secondary">Member since {new Date().getFullYear()}</Badge>
                  <Badge variant="outline">10 Analyses</Badge>
                </div>
                
                <Button className="mt-4 w-full" variant="outline" onClick={() => setActiveTab('personal')}>
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  <span>Total Analyses</span>
                </div>
                <span className="font-bold">10</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  <span>Accuracy Rate</span>
                </div>
                <span className="font-bold">92%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-primary" />
                  <span>Last Activity</span>
                </div>
                <span>2 days ago</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Personal Info</span>
              </TabsTrigger>
              <TabsTrigger value="security">
                <LockIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <BellIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="data">
                <Key className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Data & Privacy</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Personal Info Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...personalInfoForm}>
                    <form onSubmit={personalInfoForm.handleSubmit(handlePersonalInfoSubmit)} className="space-y-4">
                      <FormField
                        control={personalInfoForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bio</FormLabel>
                            <FormControl>
                              <Input placeholder="Tell us about yourself" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={personalInfoForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="City, Country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={personalInfoForm.formState.isSubmitting}
                        className="mt-4"
                      >
                        {personalInfoForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Password & Security</CardTitle>
                  <CardDescription>
                    Update your password and manage security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...securityForm}>
                    <form onSubmit={securityForm.handleSubmit(handleSecuritySubmit)} className="space-y-4">
                      <FormField
                        control={securityForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={securityForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={securityForm.formState.isSubmitting}
                        className="mt-4"
                      >
                        {securityForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                      </Button>
                    </form>
                  </Form>
                  
                  <Separator className="my-8" />
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                  
                  <Separator className="my-8" />
                  
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Active Sessions</h3>
                    <div className="rounded-md border p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Current Session</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Web Browser • {navigator.platform}
                          </p>
                        </div>
                        <Badge>Active Now</Badge>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">Sign Out All Other Sessions</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Communication</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-alerts">Email Alerts</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive notifications about your account activity and security
                        </p>
                      </div>
                      <Switch
                        id="email-alerts"
                        checked={notificationSettings.emailAlerts}
                        onCheckedChange={() => toggleNotificationSetting('emailAlerts')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="browser-notifs">Browser Notifications</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive real-time notifications in your browser
                        </p>
                      </div>
                      <Switch
                        id="browser-notifs"
                        checked={notificationSettings.browserNotifications}
                        onCheckedChange={() => toggleNotificationSetting('browserNotifications')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="weekly-news">Weekly Newsletter</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Get updates on fake news trends and verification tips
                        </p>
                      </div>
                      <Switch
                        id="weekly-news"
                        checked={notificationSettings.weeklyNewsletters}
                        onCheckedChange={() => toggleNotificationSetting('weeklyNewsletters')}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="prod-updates">Product Updates</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive notifications about new features and improvements
                        </p>
                      </div>
                      <Switch
                        id="prod-updates"
                        checked={notificationSettings.productUpdates}
                        onCheckedChange={() => toggleNotificationSetting('productUpdates')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Data & Privacy Tab */}
            <TabsContent value="data">
              <Card>
                <CardHeader>
                  <CardTitle>Data & Privacy</CardTitle>
                  <CardDescription>
                    Manage your personal data and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Data Control</h3>
                    
                    <div className="rounded-md border p-4">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                          <DownloadIcon className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <p className="font-medium">Download Your Data</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Get a copy of all your data including analysis history and profile information
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" onClick={handleDataDownload}>
                          Request Data Export
                        </Button>
                      </div>
                    </div>
                    
                    <div className="rounded-md border p-4">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                          <EyeOff className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <p className="font-medium">Privacy Settings</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Control who can see your activity and profile information
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="public-profile">Public Profile</Label>
                          <Switch id="public-profile" />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="analysis-history">Public Analysis History</Label>
                          <Switch id="analysis-history" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Account Management</h3>
                    
                    <div className="rounded-md border border-destructive p-4">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center">
                          <Trash2 className="h-5 w-5 mr-2 text-destructive" />
                          <div>
                            <p className="font-medium">Delete Your Account</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                          </div>
                        </div>
                        <Button variant="destructive" onClick={handleDeleteAccount}>
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Activity Card */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>
                Your most recent content analyses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                    <div>
                      <h4 className="font-medium">{analysis.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{analysis.date}</p>
                    </div>
                    <Badge variant={
                      analysis.result === 'real' ? 'default' : 
                      analysis.result === 'misleading' ? 'secondary' : 'destructive'
                    }>
                      {analysis.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = "/history"}>
                View All Analyses
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;