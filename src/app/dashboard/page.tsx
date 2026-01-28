import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AccessToolButton } from "@/components/dashboard/access-tool-button";
import { TutorialSection } from "@/components/dashboard/tutorial-section";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate, serializeTool } from "@/lib/utils";
import { getMinimumStartingPrice } from "@/lib/price-utils";
import { ShoppingCart, AlertCircle, RefreshCw } from "lucide-react";
import { ToolIcon } from "@/components/tools/tool-icon";
import { SubscriptionStatusBadge } from "@/components/dashboard/subscription-status-badge";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const isTestUser = userRole === 'TEST_USER' || userRole === 'ADMIN';

  // Fetch user data to check if they're a new customer
  let user: { id: string; createdAt: Date; subscriptions: Array<{ id: string }> } | null = null;
  let dbError: string | null = null;

  try {
    user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        createdAt: true,
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
    });
  } catch (error: any) {
    console.error('Database error fetching user:', error);
    dbError = error.message || 'Database connection failed';
    
    // Check if it's a connection error
    if (error.message?.includes("Can't reach database server") || 
        error.message?.includes('P1001') ||
        error.code === 'P1001' ||
        error.code === 'P2024') {
      dbError = 'Database connection failed. Please check your database connection.';
    }
  }

  // Check if user is new (created within last 7 days and has no active subscriptions)
  const isNewCustomer = user && (
    new Date().getTime() - new Date(user.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
  ) && user.subscriptions.length === 0;

  // For test users, show all active tools. For regular users, show only subscriptions
  let subscriptions: Array<{
    id: string;
    tool: any;
    status: string;
    activationStatus?: string;
    currentPeriodEnd: Date;
    createdAt: Date;
  }> = [];

  if (dbError) {
    // If database error, show error message
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900 dark:text-red-100">
                Database Connection Error
              </CardTitle>
            </div>
            <CardDescription className="text-red-700 dark:text-red-300">
              {dbError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2 text-sm text-red-800 dark:text-red-200">
                <p><strong>To fix this issue:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Check your <code className="bg-red-100 dark:bg-red-900 px-1 rounded">DATABASE_URL</code> in your <code className="bg-red-100 dark:bg-red-900 px-1 rounded">.env</code> file</li>
                  <li>Ensure your Neon PostgreSQL database is running</li>
                  <li>Verify network connectivity to the database server</li>
                  <li>Check if your database credentials are correct and not expired</li>
                </ul>
              </div>
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                <Link href="/dashboard" className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {
    if (isTestUser) {
      // Fetch all active tools for test users
      const allTools = await prisma.tool.findMany({
        where: {
          isActive: true,
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
          sharedPlanPrice1Month: true,
          privatePlanPrice1Month: true,
          sharedPlanPrice: true,
          privatePlanPrice: true,
          sharedPlanFeatures: true,
          privatePlanFeatures: true,
          sharedPlanEnabled: true,
          privatePlanEnabled: true,
          cookiesEncrypted: true,
          isActive: true,
          isFeatured: true,
          sortOrder: true,
          stripePriceId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Convert tools to subscription-like format for display
      subscriptions = allTools.map((tool) => ({
        id: `test-${tool.id}`,
        tool: tool,
        status: 'ACTIVE',
        activationStatus: 'ACTIVE',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
      }));
    } else {
      // Fetch user's subscriptions (including expired ones for display)
      subscriptions = await prisma.toolSubscription.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          status: true,
          activationStatus: true,
          currentPeriodEnd: true,
          createdAt: true,
          tool: {
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
          sharedPlanPrice1Month: true,
          privatePlanPrice1Month: true,
          sharedPlanPrice: true,
          privatePlanPrice: true,
          sharedPlanFeatures: true,
          privatePlanFeatures: true,
          sharedPlanEnabled: true,
          privatePlanEnabled: true,
          cookiesEncrypted: true,
              isActive: true,
              isFeatured: true,
              sortOrder: true,
              stripePriceId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
  } catch (error: any) {
    console.error('Database error fetching subscriptions:', error);
    dbError = error.message || 'Failed to load subscriptions';
    
    if (error.message?.includes("Can't reach database server") || 
        error.message?.includes('P1001') ||
        error.code === 'P1001' ||
        error.code === 'P2024') {
      dbError = 'Database connection failed. Please check your database connection.';
    }
  }

  // Show error if database failed during subscription fetch
  if (dbError && subscriptions.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900 dark:text-red-100">
                Database Connection Error
              </CardTitle>
            </div>
            <CardDescription className="text-red-700 dark:text-red-300">
              {dbError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2 text-sm text-red-800 dark:text-red-200">
                <p><strong>To fix this issue:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Check your <code className="bg-red-100 dark:bg-red-900 px-1 rounded">DATABASE_URL</code> in your <code className="bg-red-100 dark:bg-red-900 px-1 rounded">.env</code> file</li>
                  <li>Ensure your Neon PostgreSQL database is running</li>
                  <li>Verify network connectivity to the database server</li>
                  <li>Check if your database credentials are correct and not expired</li>
                </ul>
              </div>
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                <Link href="/dashboard" className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:mt-[60px]">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">My Tools</h1>
          {isTestUser && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              🧪 Test Mode
            </Badge>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {isTestUser 
            ? "Access all tools without payment (Testing Mode)"
            : "Access and manage your subscribed tools"}
        </p>
      </div>

      {/* Tutorial Section */}
      <TutorialSection isNewCustomer={isNewCustomer || false} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Tools</CardDescription>
            <CardTitle className="text-3xl">{subscriptions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monthly Cost</CardDescription>
            <CardTitle className="text-3xl">
              {formatPrice(
                subscriptions.reduce((sum, sub) => sum + Number(sub.tool.priceMonthly || 0), 0)
              )}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Member Since</CardDescription>
            <CardTitle className="text-2xl">
              {formatDate(subscriptions[subscriptions.length - 1]?.createdAt || new Date())}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tools List */}
      {subscriptions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Subscribed Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <ToolIcon icon={subscription.tool.icon} name={subscription.tool.name} size="md" />
                      <div>
                        <CardTitle className="text-lg">{subscription.tool.name}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {subscription.tool.shortDescription}
                        </CardDescription>
                      </div>
                    </div>
                    <SubscriptionStatusBadge
                      currentPeriodEnd={subscription.currentPeriodEnd}
                      subscriptionStatus={subscription.status}
                      activationStatus={(subscription as any).activationStatus || 'ACTIVE'}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {!isTestUser && (
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {new Date(subscription.currentPeriodEnd) > new Date() ? 'Expires on' : 'Expired on'}
                          </span>
                          <span className="font-medium">
                            {formatDate(subscription.currentPeriodEnd)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Monthly cost</span>
                          <span className="font-bold text-lg">
                            {(() => {
                              const serializedTool = serializeTool(subscription.tool);
                              const minPrice = getMinimumStartingPrice(serializedTool);
                              return formatPrice(minPrice);
                            })()}
                          </span>
                        </div>
                      </>
                    )}
                    {isTestUser && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Price</span>
                        <span className="font-bold text-lg text-green-600">
                          FREE (Test Mode)
                        </span>
                      </div>
                    )}
                    <AccessToolButton tool={subscription.tool} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tools yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't subscribed to any tools yet. Browse our catalog to get started.
            </p>
            <Button asChild>
              <Link href="/tools">Browse Tools</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
