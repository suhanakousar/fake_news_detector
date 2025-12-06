 import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, User, Mail, Key, ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPassword from './ForgotPassword';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'login' | 'register';
  setActiveTab: (tab: 'login' | 'register') => void;
}

type AuthView = 'tabs' | 'forgot-password';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  // Track animation state for background pattern
  const [patternOffset, setPatternOffset] = useState({ x: 0, y: 0 });
  const [currentView, setCurrentView] = useState<AuthView>('tabs');
  
  // Create subtle background pattern animation
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setPatternOffset({
          x: Math.sin(Date.now() / 2000) * 5,
          y: Math.cos(Date.now() / 2000) * 5,
        });
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);
  
  // Reset view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentView('tabs');
      }, 300);
    }
  }, [isOpen]);
  
  const handleForgotPasswordClick = () => {
    setCurrentView('forgot-password');
  };
  
  const handleBackToLogin = () => {
    setCurrentView('tabs');
    setActiveTab('login');
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl border-0 shadow-lg">
        <div className="flex flex-col md:flex-row w-full">
          {/* Left panel with form */}
          <div className="md:w-1/2 p-6 md:p-8 relative">
            <AnimatePresence mode="wait">
              {currentView === 'tabs' ? (
                <motion.div
                  key="auth-tabs"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <DialogHeader className="pb-2 text-left">
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
                      {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500 dark:text-gray-400 mt-1">
                      {activeTab === 'login' 
                        ? 'Log in to access your TruthLens account' 
                        : 'Join TruthLens to fight misinformation together'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-900/50 p-1 rounded-lg">
                      <TabsTrigger value="login" className="rounded-md py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm transition-all duration-300">
                        <Lock className="w-4 h-4 mr-2" />
                        Login
                      </TabsTrigger>
                      <TabsTrigger value="register" className="rounded-md py-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm transition-all duration-300">
                        <User className="w-4 h-4 mr-2" />
                        Register
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="relative">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <TabsContent value="login" className="mt-0">
                            <LoginForm 
                              onSuccess={onClose} 
                              onForgotPassword={handleForgotPasswordClick}
                            />
                          </TabsContent>
                          
                          <TabsContent value="register" className="mt-0">
                            <RegisterForm onSuccess={onClose} />
                          </TabsContent>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </Tabs>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      By signing up, you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <ForgotPassword onBack={handleBackToLogin} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Right panel with illustrations */}
          <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-primary/90 to-indigo-700/90 p-8 rounded-r-xl relative overflow-hidden">
            <motion.div 
              className="absolute inset-0 opacity-10"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundPosition: `${patternOffset.x}px ${patternOffset.y}px`,
                transition: 'background-position 0.5s ease'
              }}
            />
            
            <div className="relative h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {currentView === 'forgot-password'
                    ? 'Recover Your Account'
                    : activeTab === 'login'
                      ? 'Welcome Back!'
                      : 'Join the Truth Movement'}
                </h3>
                <p className="text-white/90 mb-8 max-w-md">
                  {currentView === 'forgot-password'
                    ? "No worries! We'll send you reset instructions to get you back into your account quickly and securely."
                    : activeTab === 'login' 
                      ? 'Log in to access your saved analyses, personal dashboard, and continue fighting misinformation together.' 
                      : 'Sign up to verify news, analyze content, and make informed decisions based on facts, not fiction.'}
                </p>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div 
                  key={currentView === 'forgot-password' ? 'forgot' : activeTab}
                  className="w-full h-72 relative"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                >
                  {currentView === 'forgot-password' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center opacity-20"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                      >
                        <Mail className="w-64 h-64 text-white" />
                      </motion.div>
                      <motion.div 
                        className="relative flex flex-col items-center"
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div 
                          className="bg-white/20 backdrop-blur-sm rounded-lg p-6 text-white text-center max-w-xs"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                        >
                          <Mail className="w-16 h-16 mx-auto mb-4 text-white" />
                          <p className="font-semibold text-lg">Check your inbox</p>
                          <p className="text-sm mt-2">We'll send you a magic link that will securely sign you in</p>
                        </motion.div>
                      </motion.div>
                    </div>
                  ) : activeTab === 'login' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center"
                        initial={{ rotate: -5 }}
                        animate={{ rotate: 5 }}
                        transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      >
                        <Shield className="w-64 h-64 text-white/20" />
                      </motion.div>
                      <motion.div 
                        className="relative flex flex-col items-center"
                        initial={{ y: 20 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                        >
                          <ShieldCheck className="w-24 h-24 text-white" />
                        </motion.div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mt-4 text-white text-center">
                          <p className="font-semibold">Trusted by fact-checkers worldwide</p>
                          <p className="text-sm mt-1">Analyze content with confidence</p>
                        </div>
                      </motion.div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                        <motion.div 
                          className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center"
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.5 }}
                        >
                          <CheckCircle2 className="w-10 h-10 text-green-300 mb-2" />
                          <p className="text-white text-sm font-medium">Verify news articles</p>
                        </motion.div>
                        <motion.div 
                          className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center"
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                        >
                          <XCircle className="w-10 h-10 text-red-300 mb-2" />
                          <p className="text-white text-sm font-medium">Identify fake news</p>
                        </motion.div>
                        <motion.div 
                          className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center"
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          <AlertTriangle className="w-10 h-10 text-yellow-300 mb-2" />
                          <p className="text-white text-sm font-medium">Detect misleading content</p>
                        </motion.div>
                        <motion.div 
                          className="bg-white/20 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center"
                          initial={{ x: 50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.4, duration: 0.5 }}
                        >
                          <Shield className="w-10 h-10 text-blue-300 mb-2" />
                          <p className="text-white text-sm font-medium">Access fact-checks</p>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
              
              <div className="pt-4 mt-auto">
                <p className="text-white/80 text-sm">
                  {currentView === 'forgot-password'
                    ? "Remember your password? Go back to the login screen."
                    : activeTab === 'login' 
                      ? "Don't have an account yet? Click 'Register' to get started." 
                      : "Already have an account? Click 'Login' to access your dashboard."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
