import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { activatePrivateSubscription } from '@/lib/subscription-utils';

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { subscriptionId, credentials } = body;

    if (!subscriptionId || !credentials || !credentials.email || !credentials.password) {
      return NextResponse.json(
        { error: 'Subscription ID and credentials are required' },
        { status: 400 }
      );
    }

    const adminId = (session.user as any).id;

    const subscription = await activatePrivateSubscription(
      subscriptionId,
      adminId,
      credentials
    );

    // TODO: Send activation email/WhatsApp notification
    // await sendActivationNotification(subscription.user.email, subscription.tool.name);

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        activationStatus: subscription.activationStatus,
        activatedAt: subscription.activatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error activating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}
