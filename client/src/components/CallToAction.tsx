import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface CallToActionProps {
  onOpenAuthModal: (tab: 'login' | 'register') => void;
}

const CallToAction: React.FC<CallToActionProps> = ({ onOpenAuthModal }) => {
  const { isAuthenticated } = useAuth();

  return (
    <motion.section 
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="glass rounded-xl overflow-hidden shadow-lg">
        <div className="md:flex">
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to fight misinformation?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {isAuthenticated 
                ? "Use TruthLens to verify news, analyze sources, and make informed decisions based on facts."
                : "Create a free account to save your analysis history, get personalized insights, and help improve our AI models."}
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              {isAuthenticated ? (
                <Button 
                  size="lg"
                  className="rounded-lg shadow-md hover:shadow-lg"
                  asChild
                >
                  <a href="#analyzer">Analyze Content Now</a>
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg"
                    className="rounded-lg shadow-md hover:shadow-lg"
                    onClick={() => onOpenAuthModal('register')}
                  >
                    Create Free Account
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="rounded-lg shadow-md hover:shadow-lg"
                    onClick={() => onOpenAuthModal('login')}
                  >
                    Log In
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="md:w-1/2 p-0 m-0 relative h-64 md:h-auto">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-32 w-32 text-white/80" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default CallToAction;
