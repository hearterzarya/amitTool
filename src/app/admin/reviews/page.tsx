import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ReviewsManagementClient } from '@/components/admin/reviews-management-client';

export const dynamic = 'force-dynamic';

export default async function ReviewsManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userRole = (session.user as any).role;
  if (userRole !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all review screenshots
  let screenshots: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];

  try {
    if ('reviewScreenshot' in prisma && typeof (prisma as any).reviewScreenshot?.findMany === 'function') {
      screenshots = await (prisma as any).reviewScreenshot.findMany({
        orderBy: { sortOrder: 'asc' },
      });
    }
  } catch (error) {
    console.warn('Review screenshots table may not exist yet:', error);
  }

  return (
    <ReviewsManagementClient screenshots={screenshots} />
  );
}
