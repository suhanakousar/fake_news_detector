import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Bot, 
  Brain, 
  Database, 
  Server, 
  Code, 
  Network, 
  Layers,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const About: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        {/* Hero Section */}
        <motion.section 
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            About <span className="text-primary">TruthLens</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Cutting through misinformation with AI-powered fact checking to deliver clarity in an age of information overload.
          </p>
        </motion.section>
        
        {/* Mission Section */}
        <section id="mission" className="mb-16">
          <div className="glass rounded-xl p-8 md:p-12 shadow-lg">
            <motion.div 
              className="md:flex items-center gap-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="md:w-1/2 mb-6 md:mb-0">
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  In today's digital landscape, misinformation spreads faster than facts. At TruthLens, we're dedicated to empowering individuals with the tools to identify fake news, verify information, and make informed decisions based on facts, not fiction.
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We believe that access to accurate information is a fundamental right. By combining cutting-edge AI technology with rigorous journalistic principles, we're creating a future where truth prevails over deception.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-6">
                  <Button asChild className="rounded-lg shadow-md hover:shadow-lg">
                    <Link href="/#analyzer">Start Fact-Checking</Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <div className="relative w-64 h-64 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <ShieldCheck className="h-24 w-24 text-primary" />
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-secondary-100 dark:bg-secondary-900 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-secondary-500 dark:text-secondary-400" />
                  </div>
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Brain className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="mb-16">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">How TruthLens Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our powerful AI engine analyzes content through multiple layers to provide comprehensive fact-checking results.
            </p>
          </motion.div>
          
          <motion.div 
            className="relative"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {/* Step 1 */}
            <motion.div 
              className="flex flex-col md:flex-row items-center mb-12 relative"
              variants={itemVariants}
            >
              <div className="md:w-1/3 mb-6 md:mb-0 flex justify-center">
                <div className="w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
              </div>
              <Card className="md:w-2/3">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">1. Input Processing</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    TruthLens accepts multiple content formats: text, URLs, documents, and images. Our system automatically extracts text from all formats using advanced OCR technology for images and documents, and web scraping for URLs.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Step 2 */}
            <motion.div 
              className="flex flex-col md:flex-row-reverse items-center mb-12 relative"
              variants={itemVariants}
            >
              <div className="md:w-1/3 mb-6 md:mb-0 flex justify-center">
                <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Brain className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <Card className="md:w-2/3">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">2. AI Analysis Pipeline</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Our proprietary BERT/RoBERTa models analyze the content for misinformation patterns. These models were trained on thousands of verified and fake news articles to detect subtle signs of misinformation with high accuracy. The system evaluates language patterns, source credibility, and content coherence.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Step 3 */}
            <motion.div 
              className="flex flex-col md:flex-row items-center mb-12 relative"
              variants={itemVariants}
            >
              <div className="md:w-1/3 mb-6 md:mb-0 flex justify-center">
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Database className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <Card className="md:w-2/3">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">3. Cross-Referencing</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    TruthLens compares analyzed content with established fact-checking databases like Snopes, PolitiFact, and other trusted sources. This ensures that known misinformation is quickly identified and provides additional context from verified sources.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Step 4 */}
            <motion.div 
              className="flex flex-col md:flex-row-reverse items-center mb-12 relative"
              variants={itemVariants}
            >
              <div className="md:w-1/3 mb-6 md:mb-0 flex justify-center">
                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Layers className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <Card className="md:w-2/3">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">4. Multiple Analysis Layers</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Beyond basic true/false classification, TruthLens performs sentiment analysis to detect emotionally manipulative language, source credibility evaluation based on historical accuracy, and political bias detection to give you a complete picture of the content's reliability.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Step 5 */}
            <motion.div 
              className="flex flex-col md:flex-row items-center relative"
              variants={itemVariants}
            >
              <div className="md:w-1/3 mb-6 md:mb-0 flex justify-center">
                <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <Code className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <Card className="md:w-2/3">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">5. Explainable Results</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Unlike black-box systems, TruthLens provides transparent reasoning for its decisions. You'll see exactly which phrases, patterns, or sources influenced the analysis, along with comprehensive metrics and fact-check references to help you understand why content was classified as it was.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </section>
        
        {/* Technology Stack Section */}
        <section className="mb-16">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Our Technology Stack</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              TruthLens is built on cutting-edge technologies to deliver fast, accurate results.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <motion.div 
              className="glass rounded-xl p-6 shadow-md"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                AI Models
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>BERT/RoBERTa for classification</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>VADER for sentiment analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Tesseract OCR for image text extraction</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>T5 for text summarization</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="glass rounded-xl p-6 shadow-md"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Server className="h-5 w-5 mr-2 text-primary" />
                Backend
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Express.js server</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Python for AI processing</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>RESTful API architecture</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Serverless functions for scalability</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div 
              className="glass rounded-xl p-6 shadow-md"
              variants={itemVariants}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Code className="h-5 w-5 mr-2 text-primary" />
                Frontend
              </h3>
              <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>React with TypeScript</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Tailwind CSS for styling</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Framer Motion for animations</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>ShadCN UI components</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        </section>
        
        {/* Call to Action */}
        <motion.section 
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="glass rounded-xl p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to verify the truth?</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
              Start using TruthLens today and join the fight against misinformation.
            </p>
            <Button asChild size="lg" className="rounded-lg shadow-md hover:shadow-lg">
              <Link href="/#analyzer">Start Analyzing</Link>
            </Button>
          </div>
        </motion.section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;
