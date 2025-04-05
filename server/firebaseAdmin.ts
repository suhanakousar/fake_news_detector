import * as admin from 'firebase-admin';
import { storage } from './storage';
import type { User } from '@shared/schema';

// Initialize Firebase Admin with environment variables
// In a production environment, you would use a service account key file
// For a development environment, we'll use the Firebase project ID from environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
}

export const auth = admin.auth();

/**
 * Verify Firebase ID token and get or create a user in our system
 */
export async function verifyFirebaseToken(idToken: string, email?: string, displayName?: string): Promise<User | null> {
  try {
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (!decodedToken.uid) {
      console.error('Invalid token - missing UID');
      return null;
    }
    
    // First try to find user by email
    let user = email ? await storage.getUserByEmail(email) : null;
    
    if (!user) {
      // Create a new user if not found
      const username = email?.split('@')[0] || `user_${decodedToken.uid.substring(0, 8)}`;
      const name = displayName || username;
      
      // Use a randomly generated password since auth is handled by Firebase
      const randomPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      
      try {
        user = await storage.createUser({
          username,
          email: email || `${username}@example.com`, // Fallback email if not provided
          password: randomPassword,
          role: 'user',
          isActive: true
        });
        
        console.log(`Created new user: ${username}`);
      } catch (error) {
        console.error('Error creating user:', error);
        return null;
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return null;
  }
}