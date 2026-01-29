import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ToolProductPageClient } from "@/components/tools/tool-product-page";
import { Metadata } from "next";
import { serializeTool } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Helper function to normalize slug (decode URL encoding and convert to database format)
function normalizeSlug(slug: string): string {
  // Decode URL encoding (e.g., %20 -> space, %2B -> +)
  const decoded = decodeURIComponent(slug);
  // Normalize to database format: lowercase, replace spaces/special chars with hyphens
  return decoded
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);
  
  const tool = await prisma.tool.findUnique({
    where: { slug: normalizedSlug },
    select: {
      name: true,
      shortDescription: true,
      description: true,
    },
  });

  if (!tool) {
    return {
      title: "Tool Not Found",
    };
  }

  return {
    title: `${tool.name} - ${process.env.EMAIL_FROM_NAME || 'Amit Techsolution'}`,
    description: tool.shortDescription || tool.description || `Get ${tool.name} subscription at affordable prices`,
  };
}

export default async function ToolProductPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const normalizedSlug = normalizeSlug(slug);

  const tool = await prisma.tool.findUnique({
    where: { slug: normalizedSlug },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
        },
      },
    },
  });

  if (!tool) {
    notFound();
  }

  if (!tool.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">
              Tool Unavailable
            </h1>
            <p className="text-slate-600 mb-6">
              This tool is currently unavailable.
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

  // Get related tools (same category, excluding current tool)
  // Fetch all price fields to ensure proper price calculation
  const relatedTools = await prisma.tool.findMany({
    where: {
      category: tool.category,
      id: { not: tool.id },
      isActive: true,
    },
    take: 4,
    // Don't use select - let Prisma fetch all fields, then serializeTool will handle conversion
  });

  // Serialize tool to convert BigInt to numbers
  const serializedTool = serializeTool(tool);
  
  // Serialize related tools as well
  const serializedRelatedTools = relatedTools.map(t => serializeTool(t));

  // Canonical URL for share links (same on server and client to avoid hydration mismatch)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://amittechsolution.in';
  const shareUrl = `${baseUrl.replace(/\/$/, '')}/tools/${normalizedSlug}`;

  return <ToolProductPageClient tool={serializedTool} relatedTools={serializedRelatedTools} shareUrl={shareUrl} />;
}
