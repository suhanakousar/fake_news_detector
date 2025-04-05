import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: (email: string, name: string, token: string) => Promise<void>;
  loginWithFacebook: (email: string, name: string, token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/register', { username, email, password });
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Registration successful!",
        description: "Welcome to TruthLens!",
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Login successful!",
        description: `Welcome back, ${userData.username}!`,
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (email: string, name: string, token: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/social/google', { email, name, token });
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Google login successful!",
        description: `Welcome, ${userData.username}!`,
      });
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Google login failed",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async (email: string, name: string, token: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/social/facebook', { email, name, token });
      const userData = await response.json();
      setUser(userData);
      
      toast({
        title: "Facebook login successful!",
        description: `Welcome, ${userData.username}!`,
      });
    } catch (error) {
      console.error('Facebook login error:', error);
      toast({
        title: "Facebook login failed",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/forgot-password', { email });
      const data = await response.json();
      
      toast({
        title: "Password reset email sent",
        description: data.message || "If an account with that email exists, a password reset link has been sent",
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      toast({
        title: "Password reset failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      register, 
      login,
      loginWithGoogle,
      loginWithFacebook,
      forgotPassword,
      logout,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
