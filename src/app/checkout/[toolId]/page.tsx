import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ToolCheckoutClient } from '@/components/checkout/tool-checkout-client';
import { headers } from 'next/headers';
import { serializeTool } from '@/lib/utils';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default async function ToolCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ toolId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const { toolId } = await params;
    const search = searchParams ? await searchParams : {};
    const plan = search.plan as string | undefined;
    const duration = search.duration as string | undefined;
    const couponId = search.couponId as string | undefined;
    
    console.log('ToolCheckoutPage - toolId:', toolId);

    if (!toolId) {
      console.log('ToolCheckoutPage - No toolId provided');
      notFound();
    }

    console.log('ToolCheckoutPage - Fetching tool from database...');
    const tool = await prisma.tool.findUnique({
      where: { id: toolId },
    });

    console.log('ToolCheckoutPage - Tool found:', tool ? tool.name : 'NOT FOUND');

    if (!tool) {
      console.log('ToolCheckoutPage - Tool not found in database');
      notFound();
    }

    if (!tool.isActive) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="glass border-slate-200 rounded-lg p-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900 mb-4">
                Tool Unavailable
              </h1>
              <p className="text-slate-600 mb-6">
                This tool is currently unavailable for purchase.
              </p>
              <a
                href="/tools"
                className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
              >
                ← Back to Tools
              </a>
            </div>
          </div>
        </div>
      );
    }

    // Serialize tool to convert BigInt to numbers
    const serializedTool = serializeTool(tool);

    return (
      <ToolCheckoutClient 
        tool={serializedTool} 
        initialPlan={plan as 'shared' | 'private' | undefined}
        initialDuration={duration as '1month' | '3months' | '6months' | '1year' | undefined}
        initialCouponId={couponId}
      />
    );
  } catch (error) {
    console.error('Error loading tool checkout:', error);
    notFound();
  }
}

