import { prisma } from '@/lib/prisma';
import { PlanType, ActivationStatus } from '@prisma/client';

export type PlanTypeEnum = PlanType;

/**
 * Creates a subscription based on plan type
 * - SHARED: Instant activation with shared credentials
 * - PRIVATE: Pending status, requires admin activation
 */
export async function createSubscriptionAfterPayment(
  userId: string,
  toolId: string,
  planType: PlanTypeEnum,
  paymentId: string,
  durationDays: number = 30 // Default to 30 days (monthly), can be 365 for yearly
) {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setDate(periodEnd.getDate() + durationDays);

  // Check if subscription already exists
  const existingSubscription = await prisma.toolSubscription.findUnique({
    where: {
      userId_toolId: {
        userId,
        toolId,
      },
    },
  });

  if (existingSubscription) {
    // Update existing subscription
    if (planType === 'SHARED') {
      // SHARED: Instant activation
      return await prisma.toolSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          planType: PlanType.SHARED,
          status: 'ACTIVE',
          activationStatus: ActivationStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
    } else {
      // PRIVATE: Pending activation
      return await prisma.toolSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          planType: PlanType.PRIVATE,
          status: 'ACTIVE', // Payment successful, but activation pending
          activationStatus: ActivationStatus.PENDING,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          canceledAt: null,
          cancelAtPeriodEnd: false,
        },
      });
    }
  }

  // Create new subscription
  if (planType === 'SHARED') {
    // SHARED PLAN: Instant activation
    // Get or create shared credentials pool
    const sharedCredentials = await getOrCreateSharedCredentials(toolId);

    const subscription = await prisma.toolSubscription.create({
        data: {
          userId,
          toolId,
          planType: PlanType.SHARED,
          status: 'ACTIVE',
          activationStatus: ActivationStatus.ACTIVE, // Instant activation
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        sharedCredentials: {
          create: {
            email: sharedCredentials.email,
            password: sharedCredentials.password, // Should be encrypted in production
            sharedAccountId: sharedCredentials.sharedAccountId,
            maxUsers: 5,
            currentUsers: sharedCredentials.currentUsers + 1,
          },
        },
      },
      include: {
        sharedCredentials: true,
      },
    });

    // Update user status to ACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
    });

    return subscription;
  } else {
    // PRIVATE PLAN: Pending activation
    const subscription = await prisma.toolSubscription.create({
        data: {
          userId,
          toolId,
          planType: PlanType.PRIVATE,
          status: 'ACTIVE', // Payment successful
          activationStatus: ActivationStatus.PENDING, // Requires admin activation
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Update user status to PENDING (waiting for admin activation)
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'PENDING' },
    });

    return subscription;
  }
}

/**
 * Gets or creates shared credentials for a tool
 * Manages the pool of shared accounts (4-5 users per account)
 */
async function getOrCreateSharedCredentials(toolId: string) {
  // Find an existing shared account with available slots
  const existingShared = await prisma.sharedCredentials.findFirst({
    where: {
      subscription: {
        toolId,
        planType: PlanType.SHARED,
        activationStatus: ActivationStatus.ACTIVE,
      },
      currentUsers: { lt: 5 }, // Less than 5 users
    },
    include: {
      subscription: true,
    },
    orderBy: {
      currentUsers: 'asc', // Use account with fewest users first
    },
  });

  if (existingShared && existingShared.currentUsers < 5) {
    // Update user count
    await prisma.sharedCredentials.update({
      where: { id: existingShared.id },
      data: {
        currentUsers: existingShared.currentUsers + 1,
      },
    });

    return {
      email: existingShared.email,
      password: existingShared.password,
      sharedAccountId: existingShared.sharedAccountId,
      currentUsers: existingShared.currentUsers,
    };
  }

  // Create new shared account pool
  // In production, these should come from admin-managed credential pool
  const sharedAccountId = `shared-${toolId}-${Date.now()}`;
  
  // TODO: Fetch from admin-managed credentials or generate
  // For now, using placeholder - admin should set these
  return {
    email: `shared-${toolId}@example.com`, // Should be managed by admin
    password: 'PLACEHOLDER_PASSWORD', // Should be encrypted and managed by admin
    sharedAccountId,
    currentUsers: 0,
  };
}

/**
 * Activates a private plan subscription (called by admin)
 */
export async function activatePrivateSubscription(
  subscriptionId: string,
  adminId: string,
  credentials: { email: string; password: string }
) {
  const subscription = await prisma.toolSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  if (subscription.planType !== PlanType.PRIVATE) {
    throw new Error('Only private plans require manual activation');
  }

  if (subscription.activationStatus === ActivationStatus.ACTIVE) {
    throw new Error('Subscription already activated');
  }

  // Update subscription with activation
  const updated = await prisma.toolSubscription.update({
    where: { id: subscriptionId },
    data: {
      activationStatus: ActivationStatus.ACTIVE,
      activatedAt: new Date(),
      activatedBy: adminId,
      privateCredentials: {
        create: {
          email: credentials.email,
          password: credentials.password, // Should be encrypted
        },
      },
    },
    include: {
      privateCredentials: true,
      user: true,
    },
  });

  // Update user status to ACTIVE
  await prisma.user.update({
    where: { id: subscription.userId },
    data: { status: 'ACTIVE' },
  });

  return updated;
}

/**
 * Suspends a subscription
 */
export async function suspendSubscription(subscriptionId: string, adminId: string) {
  const subscription = await prisma.toolSubscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  await prisma.toolSubscription.update({
    where: { id: subscriptionId },
    data: {
      activationStatus: ActivationStatus.SUSPENDED,
    },
  });

  // Check if user has any active subscriptions
  const activeSubscriptions = await prisma.toolSubscription.count({
    where: {
      userId: subscription.userId,
      activationStatus: ActivationStatus.ACTIVE,
    },
  });

  // If no active subscriptions, suspend user
  if (activeSubscriptions === 0) {
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { status: 'SUSPENDED' },
    });
  }

  return { success: true };
}
