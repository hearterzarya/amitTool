/**
 * Centralized logging utility
 * Suppresses logs in production, provides structured logging in development
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[LOG]', ...args);
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
    // In production, you might want to send warnings to an error tracking service
  },
  
  error: (...args: unknown[]) => {
    // Errors should always be logged, even in production
    console.error('[ERROR]', ...args);
    // In production, send to error tracking service (e.g., Sentry)
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
};
