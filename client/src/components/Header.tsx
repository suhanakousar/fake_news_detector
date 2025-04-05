import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthModal from './auth/AuthModal';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Sun, Moon, User, LogOut, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [, setLocation] = useLocation();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const openAuthModal = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/');
  };

  return (
    <header className="w-full sticky top-0 z-50 shadow-sm bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-white font-bold text-xl">
              <span className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </span>
            </div>
            <span className="text-xl font-bold text-primary font-serif">TruthLens</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/">
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Home</span>
          </Link>
          {isAuthenticated && (
            <Link href="/history">
              <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">History</span>
            </Link>
          )}
          <Link href="/about">
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">About</span>
          </Link>
          <Link href="/contact">
            <span className="text-sm font-medium hover:text-primary transition-colors cursor-pointer">Contact</span>
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center space-x-4">
          {/* Language selector */}
          <div className="hidden md:flex items-center">
            <Select 
              value={language} 
              onValueChange={setLanguage}
            >
              <SelectTrigger className="w-[70px] h-9 mr-1">
                <SelectValue placeholder="Lang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
                <SelectItem value="bn">বাংলা</SelectItem>
                <SelectItem value="ta">தமிழ்</SelectItem>
                <SelectItem value="te">తెలుగు</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Dark mode toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* User dropdown or auth buttons */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium hidden md:block">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <span className="w-full cursor-pointer">My Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <span className="w-full cursor-pointer">Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/history">
                    <span className="w-full cursor-pointer">My History</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex space-x-2">
              <Button 
                variant="ghost" 
                onClick={() => openAuthModal('login')}
              >
                Log in
              </Button>
              <Button 
                variant="default" 
                onClick={() => openAuthModal('register')}
              >
                Sign up
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-8">
                <Link href="/">
                  <span className="text-lg font-medium hover:text-primary transition-colors py-2 block cursor-pointer">Home</span>
                </Link>
                {isAuthenticated && (
                  <>
                    <Link href="/profile">
                      <span className="text-lg font-medium hover:text-primary transition-colors py-2 block cursor-pointer">My Profile</span>
                    </Link>
                    <Link href="/history">
                      <span className="text-lg font-medium hover:text-primary transition-colors py-2 block cursor-pointer">History</span>
                    </Link>
                    <Link href="/dashboard">
                      <span className="text-lg font-medium hover:text-primary transition-colors py-2 block cursor-pointer">Dashboard</span>
                    </Link>
                  </>
                )}
                <Link href="/about">
                  <span className="text-lg font-medium hover:text-primary transition-colors py-2 block cursor-pointer">About</span>
                </Link>
                <Link href="/contact">
                  <span className="text-lg font-medium hover:text-primary transition-colors py-2 block cursor-pointer">Contact</span>
                </Link>
                
                {/* Mobile language selector */}
                <div className="py-2">
                  <p className="text-sm text-gray-500 mb-2">Language</p>
                  <Select 
                    value={language} 
                    onValueChange={setLanguage}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="it">Italiano</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                      <SelectItem value="bn">বাংলা</SelectItem>
                      <SelectItem value="ta">தமிழ்</SelectItem>
                      <SelectItem value="te">తెలుగు</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!isAuthenticated ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => openAuthModal('login')}
                      className="w-full mt-4"
                    >
                      Log in
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={() => openAuthModal('register')}
                      className="w-full"
                    >
                      Sign up
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="destructive" 
                    onClick={handleLogout}
                    className="w-full mt-4"
                  >
                    Log out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </header>
  );
};

export default Header;
