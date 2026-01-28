/**
 * Environment Variables Validator
 * Ensures required environment variables are present at runtime
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Please set ${key} in your .env file.`
    );
  }
  
  return value;
}

export const env = {
  // Database
  DATABASE_URL: getEnvVar("DATABASE_URL"),
  
  // NextAuth
  NEXTAUTH_SECRET: getEnvVar("NEXTAUTH_SECRET"),
  NEXTAUTH_URL: getEnvVar("NEXTAUTH_URL", "http://localhost:3000"),
  
  // App
  NEXT_PUBLIC_APP_URL: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  NODE_ENV: process.env.NODE_ENV || "development",
  
  // Encryption
  COOKIE_ENCRYPTION_KEY: getEnvVar("COOKIE_ENCRYPTION_KEY"),
  
  // Email (optional - only required if using email features)
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "resend",
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  
  // Google OAuth (optional)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  
  // Payment Gateway (optional)
  PAYGIC_MERCHANT_ID: process.env.PAYGIC_MERCHANT_ID,
  PAYGIC_PASSWORD: process.env.PAYGIC_PASSWORD,
  
  // Cron Secret (optional)
  CRON_SECRET: process.env.CRON_SECRET,
} as const;

// Validate critical env vars on module load (server-side only)
if (typeof window === "undefined") {
  try {
    // Only validate DATABASE_URL as it's critical
    if (!process.env.DATABASE_URL) {
      console.warn(
        "⚠️  WARNING: DATABASE_URL is not set. " +
        "Database operations will fail. " +
        "Set DATABASE_URL in your .env file."
      );
    }
  } catch (error) {
    // Silently fail during build if env vars are missing
    // This allows the build to complete without a database connection
  }
}
