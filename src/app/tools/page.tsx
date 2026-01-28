import { prisma } from "@/lib/prisma";
import { ToolCard } from "@/components/tools/tool-card";
import { FeaturedSlider } from "@/components/tools/featured-slider";
import { CategoryToolsSearch } from "@/components/tools/category-tools-search";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ToolCategory } from "@prisma/client";
import { serializeTool } from "@/lib/utils";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

const VALID_CATEGORIES: ToolCategory[] = [
  'AI_WRITING',
  'SEO_TOOLS',
  'DESIGN',
  'PRODUCTIVITY',
  'CODE_DEV',
  'VIDEO_AUDIO',
  'OTHER',
];

export default async function ToolsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedCategory = params.category;
  const searchQuery = params.search;

  // Validate category
  const validCategory = selectedCategory && VALID_CATEGORIES.includes(selectedCategory as ToolCategory)
    ? (selectedCategory as ToolCategory)
    : undefined;

  // Fetch all tools from database
  let allTools: any[] = [];
  let featuredTools: any[] = [];
  let categories: Array<{ value: string; label: string; count: number }> = [];
  let totalCount = 0;

  try {
    allTools = await prisma.tool.findMany({
      where: {
        isActive: true,
        ...(validCategory && { category: validCategory }),
        ...(searchQuery && {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } },
            { shortDescription: { contains: searchQuery, mode: 'insensitive' } },
            { sharedPlanFeatures: { contains: searchQuery, mode: 'insensitive' } },
            { privatePlanFeatures: { contains: searchQuery, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        category: true,
        icon: true,
        toolUrl: true,
        priceMonthly: true,
        // Duration-specific prices
        sharedPlanPrice1Month: true,
        sharedPlanPrice3Months: true,
        sharedPlanPrice6Months: true,
        sharedPlanPrice1Year: true,
        privatePlanPrice1Month: true,
        privatePlanPrice3Months: true,
        privatePlanPrice6Months: true,
        privatePlanPrice1Year: true,
        // Legacy fields
        sharedPlanPrice: true,
        privatePlanPrice: true,
        sharedPlanFeatures: true,
        privatePlanFeatures: true,
        sharedPlanEnabled: true,
        privatePlanEnabled: true,
        isActive: true,
        isFeatured: true,
        sortOrder: true,
      },
    });

    // Fetch featured tools for slider (gracefully handle if column doesn't exist yet)
    try {
      // Use type assertion to bypass TypeScript check if Prisma client not regenerated
      featuredTools = await (prisma.tool.findMany as any)({
        where: {
          isActive: true,
          isFeatured: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
      console.log('Featured tools found:', featuredTools.length);
    } catch (featuredError: any) {
      // If isFeatured column doesn't exist yet, just use empty array
      // User needs to run: npx prisma generate && npx prisma db push
      if (featuredError?.message?.includes('isFeatured') || 
          featuredError?.code === 'P2021' ||
          featuredError?.message?.includes('column') ||
          featuredError?.message?.includes('Unknown column')) {
        console.warn('isFeatured column not found. Run: npx prisma generate && npx prisma db push');
        featuredTools = [];
      } else {
        console.error('Error fetching featured tools:', featuredError);
        featuredTools = [];
      }
    }

    totalCount = await prisma.tool.count({ where: { isActive: true } });

    // Get unique categories for filtering
    categories = [
      { 
        value: 'AI_WRITING', 
        label: 'AI Writing', 
        count: await prisma.tool.count({ where: { category: 'AI_WRITING', isActive: true } }) 
      },
      { 
        value: 'SEO_TOOLS', 
        label: 'SEO & Marketing', 
        count: await prisma.tool.count({ where: { category: 'SEO_TOOLS', isActive: true } }) 
      },
      { 
        value: 'DESIGN', 
        label: 'Design', 
        count: await prisma.tool.count({ where: { category: 'DESIGN', isActive: true } }) 
      },
      { 
        value: 'PRODUCTIVITY', 
        label: 'Productivity', 
        count: await prisma.tool.count({ where: { category: 'PRODUCTIVITY', isActive: true } }) 
      },
      { 
        value: 'CODE_DEV', 
        label: 'Code & Dev', 
        count: await prisma.tool.count({ where: { category: 'CODE_DEV', isActive: true } }) 
      },
      { 
        value: 'VIDEO_AUDIO', 
        label: 'Video & Audio', 
        count: await prisma.tool.count({ where: { category: 'VIDEO_AUDIO', isActive: true } }) 
      },
      { 
        value: 'OTHER', 
        label: 'Other', 
        count: await prisma.tool.count({ where: { category: 'OTHER', isActive: true } }) 
      },
    ].filter(cat => cat.count > 0);

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16">
        {/* Header */}
        <section className="relative overflow-hidden gradient-bg py-12 sm:py-16">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/30 via-blue-100/30 to-slate-100/30 animate-gradient" />
          <div className="absolute inset-0 bg-grid-slate-300/[0.03] bg-[size:75px_75px]" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center animate-fade-in-up">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-slate-900">
                Premium <span className="gradient-text">Tools</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-700 max-w-3xl mx-auto">
                Access the best productivity, entertainment, and AI tools with our curated selection
              </p>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Featured Tools Slider */}
          {!validCategory && !searchQuery && (
            <>
              {featuredTools.length > 0 ? (
                <FeaturedSlider 
                  tools={featuredTools.map(t => serializeTool(t))} 
                  categories={categories.map(c => ({ value: c.value, label: c.label }))}
                />
              ) : (
                <div className="mb-12 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                  <p className="text-yellow-800 text-sm">
                    No featured tools yet. Go to <Link href="/admin/tools" className="underline font-medium">Admin Panel</Link> to mark tools as featured.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Category Sections */}
          {!searchQuery && (
            <>
              {categories.map((category, catIdx) => {
                const categoryTools = allTools.filter(tool => tool.category === category.value);
                if (categoryTools.length === 0) return null;

                return (
                  <div key={category.value} className="mb-12 animate-fade-in-up" style={{ animationDelay: `${catIdx * 0.1}s` }}>
                    {/* Category Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                      <div className="flex items-center space-x-3">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                          {category.label}
                        </h2>
                        <Badge variant="secondary" className="glass border-slate-200 text-slate-700">
                          {categoryTools.length} {categoryTools.length === 1 ? 'tool' : 'tools'}
                        </Badge>
                      </div>
                      {categoryTools.length > 3 && (
                        <Link
                          href={`/tools?category=${category.value}`}
                          className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 transition-colors text-sm sm:text-base"
                        >
                          <span>View All</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>

                    {/* Search Bar for Individual Tools Section */}
                    <CategoryToolsSearch 
                      tools={categoryTools.slice(0, validCategory === category.value ? undefined : 4).map(t => serializeTool(t))} 
                      categoryLabel={category.label}
                    />
                  </div>
                );
              })}
            </>
          )}

          {/* Search Results or Filtered Results */}
          {(searchQuery || validCategory) && (
            <div className="animate-fade-in-up">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
                    {validCategory
                      ? categories.find(c => c.value === validCategory)?.label || 'Tools'
                      : 'Search Results'}
                  </h2>
                  <p className="text-sm text-slate-600">
                    {allTools.length} {allTools.length === 1 ? 'tool' : 'tools'} found
                    {searchQuery && ` for "${searchQuery}"`}
                  </p>
                </div>
                {(searchQuery || validCategory) && (
                  <Link
                    href="/tools"
                    className="text-sm text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Clear filters
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allTools.map((tool, idx) => (
                  <div
                    key={tool.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <ToolCard tool={serializeTool(tool)} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error: any) {
    console.error('Database error:', error?.message);
    
    // Check if it's a table missing error or column missing error
    const isAuthFailed =
      error?.code === 'P1000' ||
      error?.message?.includes('Authentication failed against database server');
    const isDbUnreachable =
      error?.code === 'P1001' ||
      error?.message?.includes("Can't reach database server") ||
      error?.message?.includes('Can\'t reach database server');
    const isTableMissing = error?.message?.includes('does not exist') || 
                           error?.code === 'P2021' ||
                           error?.message?.includes('table');
    const isColumnMissing = error?.message?.includes('isFeatured') || 
                           error?.message?.includes('column') ||
                           error?.message?.includes('Unknown column');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 flex items-center justify-center">
        <div className="text-center glass rounded-xl p-8 border border-slate-200 max-w-2xl">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900">
            {isTableMissing
              ? 'Database Not Set Up'
              : isColumnMissing
                ? 'Database Schema Update Required'
                : isAuthFailed || isDbUnreachable
                  ? 'Database Connection Failed'
                  : 'Error loading tools'}
          </h3>
          {isAuthFailed || isDbUnreachable ? (
            <>
              <p className="text-slate-600 mb-4">
                The app can’t connect to your database. Please verify your <code className="bg-slate-100 px-2 py-1 rounded">DATABASE_URL</code> in{' '}
                <code className="bg-slate-100 px-2 py-1 rounded">.env</code> and{' '}
                <code className="bg-slate-100 px-2 py-1 rounded">.env.local</code>, then restart the dev server.
              </p>
              <div className="bg-slate-100 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-mono text-slate-800 mb-2">Common fixes:</p>
                <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
                  <li>Copy a fresh connection string from Neon (credentials may be rotated)</li>
                  <li>Use the <span className="font-mono">direct</span> endpoint for local dev if the pooler is flaky</li>
                  <li>Ensure the value is wrapped in quotes if it contains special characters</li>
                </ul>
              </div>
              <p className="text-sm text-slate-500">
                After updating the env files, stop and restart: <code className="bg-slate-100 px-2 py-1 rounded">npm run dev</code>
              </p>
            </>
          ) : isTableMissing ? (
            <>
              <p className="text-slate-600 mb-4">
                The database tables haven't been created yet. Please run the setup command to create them.
              </p>
              <div className="bg-slate-100 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-mono text-slate-800 mb-2">Run this command in your terminal:</p>
                <code className="text-sm bg-slate-200 px-3 py-2 rounded block">
                  npm run db:setup
                </code>
              </div>
              <p className="text-sm text-slate-500">
                Or see <code className="bg-slate-100 px-2 py-1 rounded">DATABASE_SETUP.md</code> for detailed instructions.
              </p>
            </>
          ) : isColumnMissing ? (
            <>
              <p className="text-slate-600 mb-4">
                The database schema needs to be updated. Please run these commands to add the new featured field.
              </p>
              <div className="bg-slate-100 rounded-lg p-4 mb-4 text-left space-y-2">
                <p className="text-sm font-mono text-slate-800 mb-2">Run these commands in your terminal:</p>
                <code className="text-sm bg-slate-200 px-3 py-2 rounded block">
                  npx prisma generate
                </code>
                <code className="text-sm bg-slate-200 px-3 py-2 rounded block">
                  npx prisma db push
                </code>
              </div>
              <p className="text-sm text-slate-500">
                This will add the <code className="bg-slate-100 px-2 py-1 rounded">isFeatured</code> field to your database.
              </p>
            </>
          ) : (
            <p className="text-slate-600 mb-4">
              Please try again later or contact support
            </p>
          )}
        </div>
      </div>
    );
  }
}
