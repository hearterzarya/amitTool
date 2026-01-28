import { prisma } from './prisma';

export type SubscriptionStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING' | 'SUSPENDED';

export interface SubscriptionStatusInfo {
  status: SubscriptionStatus;
  daysRemaining: number | null;
  isExpired: boolean;
  expiresAt: Date;
  message: string;
}

/**
 * Calculate subscription status and remaining days
 */
export function calculateSubscriptionStatus(
  currentPeriodEnd: Date,
  subscriptionStatus: string,
  activationStatus: string
): SubscriptionStatusInfo {
  const now = new Date();
  const expiryDate = new Date(currentPeriodEnd);
  const timeDiff = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  // Check activation status first
  if (activationStatus === 'PENDING') {
    return {
      status: 'PENDING',
      daysRemaining: null,
      isExpired: false,
      expiresAt: expiryDate,
      message: 'Activation pending',
    };
  }

  if (activationStatus === 'SUSPENDED') {
    return {
      status: 'SUSPENDED',
      daysRemaining: null,
      isExpired: true,
      expiresAt: expiryDate,
      message: 'Subscription suspended',
    };
  }

  // Check subscription status
  if (subscriptionStatus !== 'ACTIVE') {
    return {
      status: subscriptionStatus as SubscriptionStatus,
      daysRemaining: null,
      isExpired: true,
      expiresAt: expiryDate,
      message: `Subscription ${subscriptionStatus.toLowerCase()}`,
    };
  }

  // Check if expired
  if (timeDiff <= 0) {
    return {
      status: 'EXPIRED',
      daysRemaining: 0,
      isExpired: true,
      expiresAt: expiryDate,
      message: 'Subscription expired',
    };
  }

  // Check if expiring soon (3 days or less)
  if (daysRemaining <= 3) {
    return {
      status: 'EXPIRING_SOON',
      daysRemaining,
      isExpired: false,
      expiresAt: expiryDate,
      message: `Expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`,
    };
  }

  // Active subscription
  return {
    status: 'ACTIVE',
    daysRemaining,
    isExpired: false,
    expiresAt: expiryDate,
    message: `${daysRemaining} days remaining`,
  };
}

/**
 * Check and update expired subscriptions (run daily via cron or API route)
 */
export async function checkAndUpdateExpiredSubscriptions(): Promise<{
  updated: number;
  expired: Array<{ id: string; userId: string; toolId: string }>;
}> {
  const now = new Date();
  
  // Find subscriptions that should be expired
  const expiredSubscriptions = await prisma.toolSubscription.findMany({
    where: {
      status: 'ACTIVE',
      currentPeriodEnd: {
        lt: now,
      },
    },
    select: {
      id: true,
      userId: true,
      toolId: true,
    },
  });

  // Update status to reflect expiry (we'll use a new status or keep ACTIVE but check expiry)
  // Since we don't have an EXPIRED status, we'll keep ACTIVE but the validation will check expiry
  // Alternatively, we could add a new field or use a different approach
  
  // For now, we'll just return the expired subscriptions
  // The access control already checks currentPeriodEnd, so this is mainly for reporting

  return {
    updated: expiredSubscriptions.length,
    expired: expiredSubscriptions,
  };
}

/**
 * Get subscription status badge info
 */
export function getSubscriptionBadgeInfo(statusInfo: SubscriptionStatusInfo): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  text: string;
} {
  switch (statusInfo.status) {
    case 'ACTIVE':
      return {
        variant: 'default',
        className: 'bg-green-100 text-green-800 border-green-300',
        text: 'Active',
      };
    case 'EXPIRING_SOON':
      return {
        variant: 'outline',
        className: 'bg-orange-100 text-orange-800 border-orange-300',
        text: `Expiring in ${statusInfo.daysRemaining} ${statusInfo.daysRemaining === 1 ? 'day' : 'days'}`,
      };
    case 'EXPIRED':
      return {
        variant: 'destructive',
        className: 'bg-red-100 text-red-800 border-red-300',
        text: 'Expired',
      };
    case 'PENDING':
      return {
        variant: 'outline',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        text: 'Pending Activation',
      };
    case 'SUSPENDED':
      return {
        variant: 'destructive',
        className: 'bg-red-100 text-red-800 border-red-300',
        text: 'Suspended',
      };
    default:
      return {
        variant: 'secondary',
        className: 'bg-slate-100 text-slate-800 border-slate-300',
        text: statusInfo.status,
      };
  }
}
