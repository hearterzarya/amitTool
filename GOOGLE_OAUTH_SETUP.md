# Google OAuth Setup Guide

## Fixing "redirect_uri_mismatch" Error

The error `Error 400: redirect_uri_mismatch` occurs when the redirect URI in your Google Cloud Console doesn't match what NextAuth is sending.

### Step 1: Check Your Environment Variables

Make sure your `.env` or `.env.local` file has:

```env
NEXTAUTH_URL=http://localhost:3000  # For local development
# OR
NEXTAUTH_URL=https://yourdomain.com  # For production

GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

### Step 2: Add Redirect URIs in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add these URIs:

#### For Local Development:
```
http://localhost:3000/api/auth/callback/google
```

#### For Production (amittechsolution.in):
```
https://amittechsolution.in/api/auth/callback/google
```

**Important:** Make sure both local and production URIs are added if you're testing locally.

### Step 3: Multiple Environments

If you're using multiple environments (dev, staging, production), add all redirect URIs:

```
http://localhost:3000/api/auth/callback/google
https://amittechsolution.in/api/auth/callback/google
```

**For your production site (amittechsolution.in):**
- Make sure `NEXTAUTH_URL=https://amittechsolution.in` is set in your production environment variables
- Add `https://amittechsolution.in/api/auth/callback/google` to Google Cloud Console

### Step 4: Verify Your Configuration

1. Make sure `NEXTAUTH_URL` matches your actual domain
2. The redirect URI format must be exactly: `{NEXTAUTH_URL}/api/auth/callback/google`
3. No trailing slashes
4. Use `http://` for localhost, `https://` for production

### Step 5: Restart Your Server

After updating the redirect URIs in Google Cloud Console:
1. Wait 1-2 minutes for changes to propagate
2. Restart your Next.js development server
3. Clear your browser cache/cookies
4. Try logging in again

### Common Issues:

1. **Wrong Protocol**: Using `http://` in production or `https://` in localhost
2. **Trailing Slash**: Having `/api/auth/callback/google/` instead of `/api/auth/callback/google`
3. **Wrong Domain**: Using `localhost:3001` when your app runs on `localhost:3000`
4. **Missing Port**: For localhost, you must include the port number

### Testing:

After setup, test the login:
1. Click "Sign in with Google"
2. You should be redirected to Google's consent screen
3. After consent, you should be redirected back to your app
4. Check the browser console for any errors

### Need Help?

If you're still having issues:
1. Check the browser console for the exact redirect URI being used
2. Verify it matches exactly what's in Google Cloud Console
3. Make sure there are no extra spaces or characters
4. Ensure your `NEXTAUTH_URL` environment variable is set correctly
