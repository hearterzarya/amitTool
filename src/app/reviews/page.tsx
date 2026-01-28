import { prisma } from '@/lib/prisma';
import { ReviewsPageClient } from './reviews-page-client';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  let screenshots: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
    sortOrder: number;
    isActive: boolean;
  }> = [];

  try {
    if ('reviewScreenshot' in prisma && typeof (prisma as any).reviewScreenshot?.findMany === 'function') {
      screenshots = await (prisma as any).reviewScreenshot.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          imageUrl: true,
          caption: true,
          sortOrder: true,
          isActive: true,
        },
      });
    }
  } catch (error) {
    console.warn('Review screenshots table may not exist yet:', error);
  }

  return <ReviewsPageClient screenshots={screenshots} />;
}
