import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Database, Globe } from 'lucide-react';

const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: <ShieldCheck className="h-8 w-8" />,
      text: '90%+ Accuracy'
    },
    {
      icon: <Globe className="h-8 w-8" />,
      text: 'Multilingual Support'
    },
    {
      icon: <Zap className="h-8 w-8" />,
      text: 'Real-time Analysis'
    },
    {
      icon: <Database className="h-8 w-8" />,
      text: 'Trusted Sources'
    }
  ];

  return (
    <motion.section 
      className="mb-16"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl p-6 shadow-lg flex flex-wrap justify-center items-center gap-8 md:gap-12 border border-gray-200/50 dark:border-gray-700/50">
        {badges.map((badge, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="text-primary mb-2">
              {badge.icon}
            </div>
            <p className="text-sm font-medium text-center">{badge.text}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

export default TrustBadges;
