import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { generateOtpCode, hashOtpCode } from "@/lib/otp";
import { sendEmail, generateOtpEmailHtml } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name } = validationResult.data;

    // Rate limiting per IP
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit({
      identifier: clientIp,
      action: 'register',
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many registration attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    // Check database connection first
    try {
      await prisma.$connect();
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { 
          error: "Database connection failed. Please check your DATABASE_URL environment variable and ensure the database is running.",
          details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        },
        { status: 503 }
      );
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
    } catch (prismaError: any) {
      console.error("Prisma query error:", prismaError);
      
      // Handle specific Prisma errors
      if (prismaError.code === 'P2024') {
        return NextResponse.json(
          { 
            error: "Database connection timed out. Please check your database connection and try again.",
            details: process.env.NODE_ENV === 'development' ? "P2024: Connection timeout" : undefined
          },
          { status: 503 }
        );
      }
      
      if (prismaError.code === 'P2021') {
        return NextResponse.json(
          { 
            error: "Database tables not found. Please run 'npm run db:push' to create the database schema.",
            details: process.env.NODE_ENV === 'development' ? "P2021: Table does not exist" : undefined
          },
          { status: 503 }
        );
      }
      
      throw prismaError;
    }

    if (existingUser) {
      // Don't reveal if user exists (security best practice)
      // But still check rate limit for email
      const emailRateLimit = checkRateLimit({
        identifier: email.toLowerCase(),
        action: 'otp_request',
        maxAttempts: 3,
        windowMs: 60 * 1000, // 1 minute cooldown
      });

      if (!emailRateLimit.allowed) {
        return NextResponse.json(
          { error: "Please wait before requesting another code." },
          { status: 429 }
        );
      }

      // Generic error to prevent user enumeration
      return NextResponse.json(
        { error: "If this email exists, a verification code has been sent." },
        { status: 200 } // Return 200 to not reveal if user exists
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otpCode = generateOtpCode();
    const otpHash = await hashOtpCode(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user (unverified)
    // Note: isEmailVerified defaults to false in schema, so we don't need to set it explicitly
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        passwordHash: hashedPassword,
        otpTokens: {
          create: {
            email: email.toLowerCase(),
            codeHash: otpHash,
            purpose: 'EMAIL_VERIFY',
            expiresAt,
            maxAttempts: 5,
          },
        },
      },
    });

    // Send OTP email - ensure it's sent successfully
    try {
      await sendEmail({
        to: email,
        subject: `Your ${process.env.EMAIL_FROM_NAME || 'Amit Techsolution'} verification code`,
        html: generateOtpEmailHtml(otpCode, 'verification'),
      });
      // Log success
      if (process.env.NODE_ENV === 'development') {
        console.log(`✓ OTP email sent successfully to ${email}`);
      }
    } catch (emailError: any) {
      // Log the error for debugging
      console.error('Failed to send OTP email during registration:', emailError);
      
      // In development, sendEmail already logs to console, so continue
      // In production, log but don't fail registration (user can resend)
      if (process.env.NODE_ENV === 'production') {
        console.error('OTP email failed during registration. User can request resend.');
      }
      // Note: sendEmail function handles SMTP fallback automatically
      // If both Resend and SMTP fail, it logs to console in development
    }

    // Return success (don't include OTP in response)
    return NextResponse.json(
      {
        success: true,
        message: "Account created. Please check your email for verification code.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    
    // Handle Prisma errors
    if (error.code === 'P2024') {
      return NextResponse.json(
        { 
          error: "Database connection timed out. Please check your database connection.",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }
    
    if (error.code === 'P2021') {
      return NextResponse.json(
        { 
          error: "Database tables not found. Please run database migrations.",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Something went wrong",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    // Disconnect Prisma to avoid connection pool issues
    await prisma.$disconnect().catch(() => {});
  }
}
