'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  text?: string;
  className?: string;
  callbackUrl?: string;
}

export function GoogleSignInButton({ 
  text = 'Sign in with Google', 
  className = '',
  callbackUrl 
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Google OAuth is configured
  useEffect(() => {
    const checkGoogleAvailability = async () => {
      try {
        const response = await fetch('/api/auth/check-google');
        const data = await response.json();
        setIsAvailable(data.available);
        if (!data.available) {
          setError(data.message);
        }
      } catch (err) {
        console.error('Failed to check Google OAuth availability:', err);
        setIsAvailable(false);
        setError('Unable to verify Google Sign-in availability');
      }
    };

    checkGoogleAvailability();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!isAvailable) {
      setError('Google Sign-in is not configured. Please contact support.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Use redirect: true for OAuth flows - NextAuth will handle the redirect properly
      // The middleware will redirect admins to /admin after successful authentication
      const finalCallbackUrl = callbackUrl || '/dashboard';
      
      // signIn with redirect: true will redirect immediately to Google OAuth
      // This is required for OAuth flows - NextAuth handles the redirect
      await signIn('google', {
        callbackUrl: finalCallbackUrl,
        redirect: true, // Required for OAuth - NextAuth handles redirect
      });
      
      // This code won't execute if redirect works (which is expected)
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      // Only show error if it's not a redirect (redirect throws an error but it's expected)
      if (error?.message && !error.message.includes('NEXT_REDIRECT')) {
        setError(error.message || 'Failed to sign in with Google. Please try again.');
      }
      setLoading(false);
    }
  };

  // Don't render button if Google OAuth is not available
  if (isAvailable === false) {
    return null; // Or return a disabled button with error message
  }

  // Show loading state while checking availability
  if (isAvailable === null) {
    return (
      <div className="space-y-2">
        <Button
          type="button"
          disabled
          className={`w-full bg-white text-gray-700 border border-gray-300 shadow-sm ${className}`}
          variant="outline"
        >
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>Loading...</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || !isAvailable}
        className={`w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm ${className}`}
        variant="outline"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        <span>{text}</span>
      </Button>
      {error && (
        <p className="text-sm text-red-600 text-center mt-2">{error}</p>
      )}
    </div>
  );
}
