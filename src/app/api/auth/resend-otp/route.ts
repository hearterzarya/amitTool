import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateOtpCode, hashOtpCode } from "@/lib/otp";
import { sendEmail, generateOtpEmailHtml } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const resendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  userId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = resendOtpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, userId } = validationResult.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limiting per email (prevent spam)
    const emailRateLimit = checkRateLimit({
      identifier: normalizedEmail,
      action: 'otp_request',
      maxAttempts: 3,
      windowMs: 60 * 1000, // 1 minute cooldown
    });

    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Please wait before requesting another code.",
          retryAfter: Math.ceil((emailRateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Rate limiting per IP
    const clientIp = getClientIp(req);
    const ipRateLimit = checkRateLimit({
      identifier: clientIp,
      action: 'otp_request',
      maxAttempts: 10,
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

    // Find user
    const user = userId 
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Don't reveal if user exists (security)
      return NextResponse.json(
        { 
          success: true,
          message: "If this email exists, a verification code has been sent.",
        },
        { status: 200 }
      );
    }

    // If already verified, no need to resend (use emailVerified DateTime as source of truth)
    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified." },
        { status: 400 }
      );
    }

    // Invalidate previous unverified OTPs
    await prisma.otpToken.updateMany({
      where: {
        userId: user.id,
        email: normalizedEmail,
        purpose: 'EMAIL_VERIFY',
        verifiedAt: null,
      },
      data: {
        verifiedAt: new Date(), // Mark as used/invalid
      },
    });

    // Generate new OTP
    const otpCode = generateOtpCode();
    const otpHash = await hashOtpCode(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new OTP token
    await prisma.otpToken.create({
      data: {
        userId: user.id,
        email: normalizedEmail,
        codeHash: otpHash,
        purpose: 'EMAIL_VERIFY',
        expiresAt,
        maxAttempts: 5,
      },
    });

    // Send OTP email
    try {
      await sendEmail({
        to: email,
        subject: `Your ${process.env.EMAIL_FROM_NAME || 'Amit Techsolution'} verification code`,
        html: generateOtpEmailHtml(otpCode, 'verification'),
      });
    } catch (emailError: any) {
      // In development, email might be logged to console instead
      // In production, this is a real error
      if (process.env.NODE_ENV === 'production') {
        console.error('Failed to send OTP email:', emailError);
        return NextResponse.json(
          { error: "Failed to send verification email. Please try again later." },
          { status: 500 }
        );
      }
      // In development, if email was logged to console, continue successfully
      // The sendEmail function handles development fallback
    }

    return NextResponse.json(
      {
        success: true,
        message: "Verification code sent to your email.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
