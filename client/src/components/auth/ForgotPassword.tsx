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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

// Create schema for password reset
const resetPasswordSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface ForgotPasswordProps {
  onBack: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const { forgotPassword } = useAuth();

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      await forgotPassword(values.email);
      setIsSuccess(true);
      // Toast is displayed by the AuthContext
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-6">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="p-0 mr-2 hover:bg-transparent"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-medium">Reset your password</h3>
      </div>
      
      {isSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center space-y-3"
        >
          <div className="flex justify-center">
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
              >
                <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400" />
              </motion.div>
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ 
                  repeat: Infinity,
                  duration: 1.5
                }}
              >
                <CheckCircle className="h-16 w-16 text-green-500/30 dark:text-green-400/30" />
              </motion.div>
            </div>
          </div>
          
          <h4 className="text-lg font-medium text-green-800 dark:text-green-300">Check your email</h4>
          
          <p className="text-sm text-green-700 dark:text-green-400">
            We've sent instructions to reset your password to <strong>{form.getValues().email}</strong>
          </p>
          
          <div className="pt-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={onBack} 
              className="mt-2"
            >
              Back to login
            </Button>
          </div>
        </motion.div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-1 text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder="your@email.com" 
                        type="email" 
                        {...field} 
                        autoComplete="email"
                        className="pl-10 py-5 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                      />
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                        <Mail className="h-5 w-5" />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full py-5 text-base relative overflow-hidden group mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
                  <span>Sending reset link...</span>
                </motion.div>
              ) : (
                <>
                  <span>Send Reset Link</span>
                  <span className="absolute right-full w-full h-0.5 bg-white/30 bottom-0 group-hover:animate-[slide-right_0.5s_ease-in-out_forwards]"></span>
                </>
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};

export default ForgotPassword;