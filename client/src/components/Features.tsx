import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Bot, 
  TrendingUp, 
  Globe, 
  Activity, 
  FileImage 
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: <Bot className="h-6 w-6" />,
      title: 'AI News Analyzer',
      description: 'Powered by advanced BERT/RoBERTa models trained on thousands of verified and fake news articles to detect misinformation with high accuracy.'
    },
    {
      icon: <Brain className="h-6 w-6" />,
      title: 'Explainable AI',
      description: 'Unlike other "black box" systems, TruthLens explains its reasoning, highlighting phrases and patterns that influenced its decision.'
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Credibility Scoring',
      description: 'Each source receives a trust score based on its historical accuracy, political bias, and recognition by journalistic standards bodies.'
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Cross-Check Sources',
      description: 'Automatically checks claims against trusted fact-checking databases like Snopes, PolitiFact, and other verified sources.'
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: 'Sentiment Analysis',
      description: 'Detects emotionally manipulative language, sensationalism, and other persuasion techniques often used in misinformation.'
    },
    {
      icon: <FileImage className="h-6 w-6" />,
      title: 'Document Analysis',
      description: 'Upload images, PDFs, or screenshots for automated text extraction and analysis, perfect for examining viral social media content.'
    }
  ];

  // Animation variants for staggered children
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <section id="how-it-works" className="mb-16">
      <div className="text-center mb-12">
        <motion.h2 
          className="text-3xl font-bold mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          How TruthLens Works
        </motion.h2>
        <motion.p 
          className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Our AI-powered platform combines multiple cutting-edge technologies to verify content and combat misinformation.
        </motion.p>
      </div>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        {features.map((feature, index) => (
          <motion.div 
            key={index} 
            className="glass rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            variants={item}
          >
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default Features;
