// Firebase configuration and initialization for Analytics
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB6UYw3QF_chVvefgeWWlomarDf5eztk1o",
  authDomain: "alitool-a5847.firebaseapp.com",
  projectId: "alitool-a5847",
  storageBucket: "alitool-a5847.firebasestorage.app",
  messagingSenderId: "173949694300",
  appId: "1:173949694300:web:e60b17d4d1c3b852101199",
  measurementId: "G-8JLJVTG8CF"
};

// Initialize Firebase (only if not already initialized)
// Check if there's an existing app instance to avoid duplicate initialization
let app: FirebaseApp;
const existingApps = getApps();

if (existingApps.length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  // Use existing app instance (in case firebase-auth.ts already initialized)
  app = existingApps[0];
  
  // If the existing app has a different project ID, initialize a new one for analytics
  // This allows both auth and analytics to work with different projects if needed
  const existingProjectId = (existingApps[0].options as any)?.projectId;
  if (existingProjectId !== firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig, 'analytics');
    } catch (error) {
      // If initialization fails, use the existing app
      console.warn('Could not initialize separate Firebase app for analytics, using existing app');
    }
  }
}

// Initialize Analytics (client-side only)
let analytics: Analytics | null = null;

export const getFirebaseAnalytics = async (): Promise<Analytics | null> => {
  // Only initialize analytics on client side
  if (typeof window === "undefined") {
    return null;
  }

  // Return existing analytics instance if available
  if (analytics) {
    return analytics;
  }

  // Check if analytics is supported
  const supported = await isSupported();
  if (!supported) {
    console.warn("Firebase Analytics is not supported in this environment");
    return null;
  }

  // Initialize analytics
  try {
    analytics = getAnalytics(app);
    return analytics;
  } catch (error) {
    console.error("Error initializing Firebase Analytics:", error);
    return null;
  }
};

export { app };
export default app;
