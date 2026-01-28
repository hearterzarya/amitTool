import { prisma } from './prisma';

interface RateLimitOptions {
  identifier: string; // IP address or email
  action: string; // 'otp_request', 'otp_verify', 'password_reset', etc.
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Simple in-memory rate limiting (for production, use Redis)
 * Tracks attempts per identifier + action combination
 */
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

/**
 * Check rate limit for an action
 */
export function checkRateLimit({
  identifier,
  action,
  maxAttempts,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const key = `${identifier}:${action}`;
  const now = new Date();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    // No record or expired, create new
    const resetAt = new Date(now.getTime() + windowMs);
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetAt,
    };
  }
  
  if (record.count >= maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }
  
  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  
  return {
    allowed: true,
    remaining: maxAttempts - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Get client IP from request
 */
export function getClientIp(req: Request): string {
  // Try various headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return 'unknown';
}

/**
 * Clean up expired rate limit records (run periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = new Date();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
