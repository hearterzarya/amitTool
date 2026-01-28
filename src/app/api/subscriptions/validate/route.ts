import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAndUpdateExpiredSubscriptions } from '@/lib/subscription-validation';

/**
 * API route to check and update expired subscriptions
 * Can be called by cron job or manually
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Add authentication for cron jobs
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // If CRON_SECRET is set, require it
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await checkAndUpdateExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error validating subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to validate subscriptions' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for user to check their subscription status
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get all user subscriptions
    const subscriptions = await prisma.toolSubscription.findMany({
      where: {
        userId,
      },
      include: {
        tool: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        toolId: sub.toolId,
        toolName: sub.tool.name,
        status: sub.status,
        activationStatus: sub.activationStatus,
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching subscription status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
