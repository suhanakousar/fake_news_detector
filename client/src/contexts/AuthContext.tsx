import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { 
  auth, 
  loginWithEmailPassword, 
  registerWithEmailPassword, 
  loginWithGoogle as firebaseLoginWithGoogle, 
  loginWithFacebook as firebaseLoginWithFacebook,
  resetPassword,
  logoutUser,
  onAuthChange
} from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (username: string, email: string, password: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in via session
    const checkSession = async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me', undefined);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        // No active session, user is not logged in
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Also listen for Firebase auth state changes (for social logins)
    const unsubscribe = onAuthChange((firebaseUserResult) => {
      setFirebaseUser(firebaseUserResult);
      
      if (firebaseUserResult) {
        // If Firebase user exists, sync with our backend
        syncUserWithBackend(firebaseUserResult);
      }
    });
    
    checkSession();
    
    return () => unsubscribe();
  }, []);
  
  // Sync Firebase user with our backend
  const syncUserWithBackend = async (firebaseUser: FirebaseUser) => {
    try {
      // Send the Firebase user's ID token to our backend to verify and get/create user data
      const idToken = await firebaseUser.getIdToken();
      const response = await apiRequest('POST', '/api/auth/firebase-auth', { 
        token: idToken,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      // Use backend register endpoint
      const response = await apiRequest('POST', '/api/auth/register', {
        username,
        email,
        password
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        toast({
          title: "Registration successful!",
          description: "Welcome to TruthLens!",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error?.message || "An error occurred during registration",
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
      
      // Use backend login endpoint for username/password authentication
      const response = await apiRequest('POST', '/api/auth/login', {
        username,
        password
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        toast({
          title: "Login successful!",
          description: `Welcome back!`,
        });
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error?.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Login with Google through Firebase
      await firebaseLoginWithGoogle();
      
      // Backend will be updated via the Firebase auth state change listener
      
      toast({
        title: "Google login successful!",
        description: "Welcome to TruthLens!",
      });
    } catch (error: any) {
      console.error('Google login error:', error);
      toast({
        title: "Google login failed",
        description: error?.message || "Authentication failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = async () => {
    try {
      setLoading(true);
      
      // Login with Facebook through Firebase
      await firebaseLoginWithFacebook();
      
      // Backend will be updated via the Firebase auth state change listener
      
      toast({
        title: "Facebook login successful!",
        description: "Welcome to TruthLens!",
      });
    } catch (error: any) {
      console.error('Facebook login error:', error);
      toast({
        title: "Facebook login failed",
        description: error?.message || "Authentication failed",
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
      
      // Send password reset email through Firebase
      await resetPassword(email);
      
      toast({
        title: "Password reset email sent",
        description: "If an account with that email exists, a password reset link has been sent",
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast({
        title: "Password reset failed",
        description: error?.message || "An error occurred",
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
      
      // Logout from Firebase
      await logoutUser();
      
      // Clear local user state
      setUser(null);
      
      // Also notify our backend
      await apiRequest('POST', '/api/auth/logout', {});
      
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
      isAuthenticated: !!user,
      firebaseUser
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
