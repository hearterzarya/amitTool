import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json(
        { error: 'Tool ID is required' },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;

    // Find subscription
    const subscription = await prisma.toolSubscription.findUnique({
      where: {
        userId_toolId: {
          userId,
          toolId,
        },
      },
      include: {
        sharedCredentials: true,
        privateCredentials: true,
        tool: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planType: subscription.planType,
        activationStatus: subscription.activationStatus,
        status: subscription.status,
        sharedCredentials: subscription.sharedCredentials ? {
          email: subscription.sharedCredentials.email,
          password: subscription.sharedCredentials.password,
        } : null,
        privateCredentials: subscription.privateCredentials ? {
          email: subscription.privateCredentials.email,
          password: subscription.privateCredentials.password,
        } : null,
      },
    });
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
