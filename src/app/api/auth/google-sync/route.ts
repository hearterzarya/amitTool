import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { signIn } from 'next-auth/react';

const googleSyncSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  photoURL: z.string().nullable().optional(),
});

/**
 * Sync Google user with backend database
 * Creates or updates user account and returns session
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validationResult = googleSyncSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { uid, email, name, photoURL } = validationResult.data;
    const normalizedEmail = email.toLowerCase();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: name || null,
          emailVerified: new Date(), // Google accounts are pre-verified
          isEmailVerified: true,
        },
      });
    } else {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          emailVerified: new Date(), // Mark as verified
          isEmailVerified: true,
        },
      });
    }

    // Return user data (client will handle NextAuth session)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Google sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Google account' },
      { status: 500 }
    );
  }
}
