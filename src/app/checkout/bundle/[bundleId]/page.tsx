import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { BundleCheckoutClient } from '@/components/checkout/bundle-checkout-client';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ bundleId: string }>;
}

export default async function BundleCheckoutPage({ params }: PageProps) {
  const { bundleId } = await params;

  try {
    // Check if bundle model exists in Prisma client
    if (!('bundle' in prisma) || typeof (prisma as any).bundle?.findUnique !== 'function') {
      console.warn('Bundle model not available. Please run: npx prisma generate && npx prisma db push');
      notFound();
    }

    const bundle = await (prisma as any).bundle.findUnique({
      where: { id: bundleId },
      include: {
        tools: {
          include: {
            tool: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    if (!bundle || !bundle.isActive) {
      notFound();
    }

    return <BundleCheckoutClient bundle={bundle} />;
  } catch (error) {
    console.error('Error fetching bundle:', error);
    notFound();
  }
}
