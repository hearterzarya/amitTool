import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

/**
 * Generate a 6-digit OTP code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP code for storage
 */
export async function hashOtpCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10);
}

/**
 * Verify OTP code against hash
 */
export async function verifyOtpCode(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/**
 * Generate secure random token for password reset
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash reset token for storage
 */
export async function hashResetToken(token: string): Promise<string> {
  return bcrypt.hash(token, 10);
}

/**
 * Verify reset token against hash
 */
export async function verifyResetToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Clean up expired OTP tokens (run periodically)
 */
export async function cleanupExpiredOtps(): Promise<void> {
  try {
    await prisma.otpToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}

/**
 * Clean up expired password reset tokens
 */
export async function cleanupExpiredResetTokens(): Promise<void> {
  try {
    await prisma.passwordResetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up expired reset tokens:', error);
  }
}
