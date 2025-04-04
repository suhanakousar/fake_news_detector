import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import TrustBadges from '@/components/TrustBadges';
import NewsAnalyzer from '@/components/NewsAnalyzer';
import Features from '@/components/Features';
import CallToAction from '@/components/CallToAction';
import AuthModal from '@/components/auth/AuthModal';

const Home: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <HeroSection />
        <TrustBadges />
        <NewsAnalyzer />
        <Features />
        <CallToAction onOpenAuthModal={openAuthModal} />
      </main>
      
      <Footer />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

export default Home;
