/**
 * Firebase Authentication Client-Side Integration
 * This provides an alternative client-side Firebase auth option
 * Note: NextAuth Google provider is recommended for Next.js apps
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
  Auth
} from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCf7r76hx5_9mjKaN8lZNrJf1OnWdlNGAk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "alitool-22bc4.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "alitool-22bc4",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "alitool-22bc4.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "271496020101",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:271496020101:web:69e21bd5f88bb864b7a9ec",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-GGSQ1G3QQT",
};

// Initialize Firebase (only once)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    // Initialize Analytics only in browser
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      // Analytics may fail in development or if not configured
      console.warn('Firebase Analytics initialization failed:', error);
    }
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
}

/**
 * Sign in with Google using Firebase (popup)
 */
export async function googleSignIn(): Promise<{
  success: boolean;
  user?: {
    uid: string;
    email: string;
    name: string | null;
    photoURL: string | null;
  };
  error?: string;
}> {
  if (!auth) {
    return {
      success: false,
      error: 'Firebase not initialized. Please check your configuration.',
    };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account',
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Store user data in localStorage
    const userData = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName,
      photoURL: user.photoURL,
    };

    localStorage.setItem('firebase_user', JSON.stringify(userData));

    // Sync with backend API
    try {
      const syncResponse = await fetch('/api/auth/google-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
        }),
      });

      if (syncResponse.ok) {
        const data = await syncResponse.json();
        // Store session token if provided
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
      }
    } catch (syncError) {
      console.error('Failed to sync with backend:', syncError);
      // Continue even if sync fails
    }

    return {
      success: true,
      user: userData,
    };
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign in with Google',
    };
  }
}

/**
 * Sign out from Firebase
 */
export async function googleSignOut(): Promise<void> {
  if (!auth) return;

  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('firebase_user');
    localStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const userData = localStorage.getItem('firebase_user');
  return !!userData;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): {
  uid: string;
  email: string;
  name: string | null;
  photoURL: string | null;
} | null {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('firebase_user');
  if (!userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  if (!auth) {
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
}
