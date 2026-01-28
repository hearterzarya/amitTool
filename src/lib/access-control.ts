import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export type AccessLevel = 'FREE' | 'PENDING' | 'ACTIVE' | 'ADMIN';

/**
 * Middleware to check if user has access to a tool
 * Returns user status and subscription details
 */
export async function checkToolAccess(toolId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Admins and test users have full access
  if (userRole === 'ADMIN' || userRole === 'TEST_USER') {
    return {
      hasAccess: true,
      userStatus: 'ACTIVE' as const,
      subscription: null,
      reason: 'Admin/Test user access',
    };
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });

  if (!user) {
    redirect('/login');
  }

  // Check user status
  if (user.status === 'SUSPENDED') {
    return {
      hasAccess: false,
      userStatus: user.status,
      subscription: null,
      reason: 'Your account has been suspended. Please contact support.',
    };
  }

  if (user.status === 'FREE') {
    return {
      hasAccess: false,
      userStatus: user.status,
      subscription: null,
      reason: 'Please purchase a subscription to access this tool.',
    };
  }

  // Check subscription
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
    },
  });

  if (!subscription) {
    return {
      hasAccess: false,
      userStatus: user.status,
      subscription: null,
      reason: 'No active subscription found for this tool.',
    };
  }

  // Check activation status
  if (subscription.activationStatus === 'PENDING') {
    return {
      hasAccess: false,
      userStatus: user.status,
      subscription,
      reason: 'Your subscription is pending activation. You will receive confirmation via Email or WhatsApp.',
    };
  }

  if (subscription.activationStatus === 'SUSPENDED') {
    return {
      hasAccess: false,
      userStatus: user.status,
      subscription,
      reason: 'Your subscription has been suspended. Please contact support.',
    };
  }

  // Check if subscription is active
  if (subscription.status !== 'ACTIVE') {
    return {
      hasAccess: false,
      userStatus: user.status,
      subscription,
      reason: 'Your subscription is not active.',
    };
  }

  // Check if subscription period is valid
  const now = new Date();
  if (subscription.currentPeriodEnd < now) {
    return {
      hasAccess: false,
      userStatus: user.status,
      subscription,
      reason: 'Your subscription has expired. Please renew.',
    };
  }

  // User has access
  return {
    hasAccess: true,
    userStatus: user.status,
    subscription,
    reason: 'Access granted',
  };
}

/**
 * Check if user can access dashboard
 */
export async function checkDashboardAccess() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // Admins always have access
  if (userRole === 'ADMIN') {
    return { hasAccess: true, userStatus: 'ACTIVE' as const };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });

  if (!user) {
    redirect('/login');
  }

  return {
    hasAccess: true, // Users can always access dashboard to see their status
    userStatus: user.status,
  };
}
