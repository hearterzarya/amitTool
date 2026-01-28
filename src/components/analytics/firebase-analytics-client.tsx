'use client';

import { useEffect } from 'react';
import { getFirebaseAnalytics } from '@/lib/firebase';
import { logEvent } from 'firebase/analytics';

export function FirebaseAnalyticsClient() {
  useEffect(() => {
    // Initialize Firebase Analytics on client side
    const initAnalytics = async () => {
      const analytics = await getFirebaseAnalytics();
      
      if (analytics) {
        // Log page view
        logEvent(analytics, 'page_view', {
          page_path: window.location.pathname,
          page_title: document.title,
        });
      }
    };

    initAnalytics();
  }, []);

  return null;
}
