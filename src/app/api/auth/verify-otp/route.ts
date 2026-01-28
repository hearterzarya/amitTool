import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { verifyOtpCode } from "@/lib/otp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
  userId: z.string().uuid().optional(), // Optional, for when user is already created
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = verifyOtpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, code, userId } = validationResult.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `${clientIp}:${normalizedEmail}`,
      action: 'otp_verify',
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many verification attempts. Please request a new code.",
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Find user
    const user = userId 
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Find valid OTP token
    const otpToken = await prisma.otpToken.findFirst({
      where: {
        email: normalizedEmail,
        userId: user.id,
        purpose: 'EMAIL_VERIFY',
        expiresAt: {
          gt: new Date(),
        },
        verifiedAt: null,
        attempts: {
          lt: 5, // Max 5 attempts
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification code. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP code
    const isValid = await verifyOtpCode(code, otpToken.codeHash);

    if (!isValid) {
      // Increment attempts
      await prisma.otpToken.update({
        where: { id: otpToken.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      const remainingAttempts = otpToken.maxAttempts - otpToken.attempts - 1;
      
      return NextResponse.json(
        { 
          error: `Invalid code. ${remainingAttempts > 0 ? `${remainingAttempts} attempts remaining.` : 'Please request a new code.'}`,
        },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: {
        verifiedAt: new Date(),
      },
    });

    // Mark user email as verified
    const verifiedAt = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: verifiedAt,
        // Note: isEmailVerified will be set via database default or migration
      },
    });

    // Invalidate all other OTP tokens for this user
    await prisma.otpToken.updateMany({
      where: {
        userId: user.id,
        purpose: 'EMAIL_VERIFY',
        verifiedAt: null,
        id: {
          not: otpToken.id,
        },
      },
      data: {
        verifiedAt: new Date(), // Mark as used
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        userId: user.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
