import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const Footer: React.FC = () => {
  const handleLinkClick = (e: React.MouseEvent, resourceType: string) => {
    e.preventDefault();
    // We'll implement proper functionality later, but for now we'll show an alert
    alert(`${resourceType} section coming soon!`);
  };

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">TruthLens</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/about">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm cursor-pointer">
                    About Us
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/about#mission">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm cursor-pointer">
                    Our Mission
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/about#how-it-works">
                  <span className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm cursor-pointer">
                    How It Works
                  </span>
                </Link>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'API Access')}
                >
                  API Access
                </Button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'Education Hub')}
                >
                  Education Hub
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'Blog')}
                >
                  Blog
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'Research Papers')}
                >
                  Research Papers
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'Press Kit')}
                >
                  Press Kit
                </Button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'Terms of Service')}
                >
                  Terms of Service
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'Privacy Policy')}
                >
                  Privacy Policy
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'Cookie Policy')}
                >
                  Cookie Policy
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={(e) => handleLinkClick(e, 'GDPR Compliance')}
                >
                  GDPR Compliance
                </Button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Connect</h4>
            <ul className="space-y-2">
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={() => window.open('https://twitter.com', '_blank')}
                >
                  Twitter
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={() => window.open('https://linkedin.com', '_blank')}
                >
                  LinkedIn
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={() => window.open('https://github.com', '_blank')}
                >
                  GitHub
                </Button>
              </li>
              <li>
                <Button
                  variant="link"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary text-sm p-0 h-auto"
                  onClick={() => window.location.href = 'mailto:suhanakousar2005@gmail.com'}
                >
                  Contact Us
                </Button>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg overflow-hidden">
                <img 
                  src="/icon.png" 
                  alt="TruthLens Logo" 
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="text-lg font-bold text-primary font-serif">TruthLens</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              © {new Date().getFullYear()} TruthLens. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Created by suhanakousar
            </p>
          </div>
          <div className="flex space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary"
              onClick={() => window.open('https://twitter.com', '_blank')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary"
              onClick={() => window.open('https://facebook.com', '_blank')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary"
              onClick={() => window.open('https://instagram.com', '_blank')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-primary"
              onClick={() => window.open('https://github.com', '_blank')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
