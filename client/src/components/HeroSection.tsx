import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

const HeroSection: React.FC = () => {
  return (
    <motion.section 
      className="mb-12 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white font-serif">
        Verify the truth with <span className="text-primary">AI precision</span>
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
        TruthLens uses advanced AI models to instantly verify news authenticity, explain reasoning, and provide credibility scores.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button 
          size="lg" 
          className="rounded-lg shadow-md hover:shadow-lg"
          asChild
        >
          <a href="#analyzer">Start Analyzing</a>
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="rounded-lg shadow-md hover:shadow-lg"
          asChild
        >
          <a href="#how-it-works">How It Works</a>
        </Button>
      </div>
    </motion.section>
  );
};

export default HeroSection;
