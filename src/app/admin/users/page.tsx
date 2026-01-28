import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { UsersManagementClient } from '@/components/admin/users-management-client';

export const dynamic = 'force-dynamic';

export default async function UsersManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all users with their subscriptions
  const users = await prisma.user.findMany({
    include: {
      subscriptions: {
        include: {
          tool: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
      },
      _count: {
        select: {
          subscriptions: true,
          payments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch pending subscriptions (private plans waiting for activation)
  const pendingSubscriptions = await prisma.toolSubscription.findMany({
    where: {
      activationStatus: 'PENDING',
      planType: 'PRIVATE',
    },
    include: {
      user: true,
      tool: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <UsersManagementClient 
      users={users} 
      pendingSubscriptions={pendingSubscriptions}
      adminId={(session.user as any).id}
    />
  );
}
