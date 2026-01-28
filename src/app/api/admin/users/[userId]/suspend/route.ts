import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role;
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { userId } = await params;

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    // Suspend all active subscriptions
    await prisma.toolSubscription.updateMany({
      where: {
        userId,
        activationStatus: 'ACTIVE',
      },
      data: {
        activationStatus: 'SUSPENDED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User suspended successfully',
    });
  } catch (error: any) {
    console.error('Error suspending user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to suspend user' },
      { status: 500 }
    );
  }
}
