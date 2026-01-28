import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateResetToken, hashResetToken } from "@/lib/otp";
import { sendEmail, generatePasswordResetEmailHtml } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limiting per email
    const emailRateLimit = checkRateLimit({
      identifier: normalizedEmail,
      action: 'password_reset',
      maxAttempts: 3,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many password reset requests. Please try again later.",
          retryAfter: Math.ceil((emailRateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Rate limiting per IP
    const clientIp = getClientIp(req);
    const ipRateLimit = checkRateLimit({
      identifier: clientIp,
      action: 'password_reset',
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((ipRateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Find user (don't reveal if exists)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Always return success to prevent user enumeration
    // But only send email if user exists
    if (user) {
      // Invalidate previous unused reset tokens
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(), // Mark as used
        },
      });

      // Generate reset token
      const resetToken = generateResetToken();
      const tokenHash = await hashResetToken(resetToken);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Create reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Generate reset link
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const resetLink = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Send reset email
      try {
        await sendEmail({
          to: email,
          subject: `Reset Your Password - ${process.env.EMAIL_FROM_NAME || 'Amit Techsolution'}`,
          html: generatePasswordResetEmailHtml(resetLink),
        });
        // Log success in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✓ Password reset email sent to ${email}`);
        }
      } catch (emailError: any) {
        // Log error for debugging
        console.error('Failed to send password reset email:', emailError);
        // In development, email might be logged to console instead
        // In production, log error but don't reveal to user (security)
        // The sendEmail function handles SMTP fallback automatically
      }
    }

    // Always return success (security: prevent user enumeration)
    return NextResponse.json(
      {
        success: true,
        message: "If this email exists, a password reset link has been sent.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
