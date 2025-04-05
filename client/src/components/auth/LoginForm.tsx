import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { User, Lock, EyeOff, Eye, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Create schema for login
const loginSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: () => void;
  onForgotPassword?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onForgotPassword }) => {
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'facebook' | null>(null);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoginError(null);
    try {
      await login(values.username, values.password);
      // Add success animation
      const successAnimation = async () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 300);
        });
      };
      await successAnimation();
      onSuccess();
    } catch (error) {
      setLoginError("Invalid username or password. Please try again.");
    }
  };

  const { loginWithGoogle, loginWithFacebook } = useAuth();

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setSocialLoading(provider);
    try {
      // For demonstration purposes, we'll create mock user data
      // In a real app, this would be data from the OAuth provider
      const mockUserData = {
        email: provider === 'google' ? 'user@gmail.com' : 'user@facebook.com',
        name: 'Demo User',
        token: 'mock-oauth-token'
      };
      
      if (provider === 'google') {
        await loginWithGoogle(mockUserData.email, mockUserData.name, mockUserData.token);
      } else {
        await loginWithFacebook(mockUserData.email, mockUserData.name, mockUserData.token);
      }
      
      // Add success animation
      const successAnimation = async () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 300);
        });
      };
      
      await successAnimation();
      onSuccess();
    } catch (error) {
      toast({
        title: "Login failed",
        description: `Could not log in with ${provider}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {loginError && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start space-x-2"
          >
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{loginError}</p>
          </motion.div>
        )}
        
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-1 text-sm">
                <User className="h-3.5 w-3.5" />
                <span>Username</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="truthseeker" 
                    {...field} 
                    autoComplete="username"
                    className="pl-10 py-5 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center space-x-1 text-sm">
                <Lock className="h-3.5 w-3.5" />
                <span>Password</span>
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="••••••••" 
                    type={showPassword ? 'text' : 'password'} 
                    {...field} 
                    autoComplete="current-password"
                    className="pl-10 pr-10 py-5 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </FormControl>
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={onForgotPassword} 
                  className="text-xs text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full py-5 text-base relative overflow-hidden group"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Verifying credentials...</span>
            </motion.div>
          ) : (
            <>
              <span>Log in</span>
              <span className="absolute right-full w-full h-0.5 bg-white/30 bottom-0 group-hover:animate-[slide-right_0.5s_ease-in-out_forwards]"></span>
            </>
          )}
        </Button>
        
        <div className="relative flex items-center justify-center mt-6">
          <div className="absolute border-t border-gray-200 dark:border-gray-700 w-full"></div>
          <div className="relative bg-white dark:bg-gray-800 px-4 text-sm text-gray-500 dark:text-gray-400">or continue with</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button 
            type="button" 
            variant="outline"
            className="bg-white dark:bg-gray-700/50 flex items-center justify-center space-x-2 py-5 relative overflow-hidden group"
            onClick={() => handleSocialLogin('google')}
            disabled={!!socialLoading}
          >
            {socialLoading === 'google' ? (
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </motion.div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
                  <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
                  <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
                  <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
                </svg>
                <span>Google</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 group-hover:w-full transition-all duration-300"></span>
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            className="bg-white dark:bg-gray-700/50 flex items-center justify-center space-x-2 py-5 relative overflow-hidden group"
            onClick={() => handleSocialLogin('facebook')}
            disabled={!!socialLoading}
          >
            {socialLoading === 'facebook' ? (
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </motion.div>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" fill="#1877F2" />
                </svg>
                <span>Facebook</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;
