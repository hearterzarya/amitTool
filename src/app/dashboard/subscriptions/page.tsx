import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate, serializeTool } from "@/lib/utils";
import { getMinimumStartingPrice } from "@/lib/price-utils";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CreditCard, Calendar, DollarSign, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;
  const isTestUser = userRole === 'TEST_USER' || userRole === 'ADMIN';

  // Fetch all subscriptions (active and canceled)
  let subscriptions: Array<{
    id: string;
    tool: any;
    status: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    createdAt: Date;
  }> = [];

  if (isTestUser) {
    // For test users, show all active tools
    const allTools = await prisma.tool.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    subscriptions = allTools.map((tool) => ({
      id: `test-${tool.id}`,
      tool: tool,
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    }));
  } else {
    // Fetch user's all subscriptions
    subscriptions = await prisma.toolSubscription.findMany({
      where: {
        userId: userId,
      },
      include: {
        tool: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
  const canceledSubscriptions = subscriptions.filter(s => s.status === 'CANCELED');
  const totalMonthlyCost = activeSubscriptions.reduce((sum, sub) => {
    const serializedTool = serializeTool(sub.tool);
    const minPrice = getMinimumStartingPrice(serializedTool);
    return sum + minPrice;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Subscriptions</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and view all your tool subscriptions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Active Subscriptions</CardDescription>
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-3xl">{activeSubscriptions.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Monthly Cost</CardDescription>
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <CardTitle className="text-3xl">
              {formatPrice(totalMonthlyCost)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Subscriptions</CardDescription>
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <CardTitle className="text-3xl">{subscriptions.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <ToolIcon icon={subscription.tool.icon} name={subscription.tool.name} size="md" />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{subscription.tool.name}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {subscription.tool.shortDescription || subscription.tool.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      ACTIVE
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Started
                      </span>
                      <span className="font-medium">
                        {formatDate(subscription.currentPeriodStart)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Next billing
                      </span>
                      <span className="font-medium">
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        Monthly cost
                      </span>
                      <span className="font-bold text-lg">
                        {isTestUser ? (
                          <span className="text-green-600">FREE (Test Mode)</span>
                        ) : (() => {
                          const serializedTool = serializeTool(subscription.tool);
                          const minPrice = getMinimumStartingPrice(serializedTool);
                          return formatPrice(minPrice);
                        })()}
                      </span>
                    </div>
                    {!isTestUser && (
                      <div className="pt-2">
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          Cancel Subscription
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Canceled Subscriptions */}
      {canceledSubscriptions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Canceled Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {canceledSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="opacity-75 hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <ToolIcon icon={subscription.tool.icon} name={subscription.tool.name} size="md" />
                      <div className="flex-1">
                        <CardTitle className="text-lg">{subscription.tool.name}</CardTitle>
                        <CardDescription className="line-clamp-1">
                          {subscription.tool.shortDescription || subscription.tool.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="destructive">CANCELED</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Canceled on</span>
                      <span className="font-medium">
                        {formatDate(subscription.currentPeriodEnd)}
                      </span>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full">
                      <Link href={`/checkout/${subscription.tool.id}`}>
                        Resubscribe
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {subscriptions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
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
