import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { verifyResetToken } from "@/lib/otp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, email, password } = validationResult.data;
    const normalizedEmail = email.toLowerCase();

    // Rate limiting
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: `${clientIp}:${normalizedEmail}`,
      action: 'password_reset_verify',
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    // Find valid reset token
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date(),
        },
        usedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Try to verify token against all valid tokens
    let validToken = null;
    for (const resetToken of resetTokens) {
      const isValid = await verifyResetToken(token, resetToken.tokenHash);
      if (isValid) {
        validToken = resetToken;
        break;
      }
    }

    if (!validToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
      },
    });

    // Mark reset token as used
    await prisma.passwordResetToken.update({
      where: { id: validToken.id },
      data: {
        usedAt: new Date(),
      },
    });

    // Invalidate all other reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
        id: {
          not: validToken.id,
        },
      },
      data: {
        usedAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully. You can now login with your new password.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
