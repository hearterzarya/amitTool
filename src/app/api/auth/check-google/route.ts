import { NextResponse } from 'next/server';

/**
 * Check if Google OAuth is configured
 * This endpoint allows client-side components to check if Google sign-in is available
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  const isConfigured = !!(
    clientId && 
    clientSecret && 
    clientId.trim() !== '' && 
    clientSecret.trim() !== '' &&
    !clientId.includes('your-client-id') &&
    !clientSecret.includes('your-client-secret') &&
    !clientId.includes('placeholder') &&
    !clientSecret.includes('placeholder')
  );

  return NextResponse.json({ 
    available: isConfigured,
    message: isConfigured 
      ? 'Google Sign-in is configured' 
      : 'Google Sign-in is not configured. Please contact support.'
  });
}
