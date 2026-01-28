import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice, serializeTool } from "@/lib/utils";
import { getMinimumStartingPrice } from "@/lib/price-utils";
import { ToolIcon } from "@/components/tools/tool-icon";

export default async function SubscriptionsManagementPage() {
  const subscriptions = await prisma.toolSubscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      tool: {
        select: {
          id: true,
          name: true,
          icon: true,
          priceMonthly: true,
          sharedPlanPrice1Month: true,
          privatePlanPrice1Month: true,
          sharedPlanPrice: true,
          privatePlanPrice: true,
          sharedPlanEnabled: true,
          privatePlanEnabled: true,
        },
      },
    },
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "ACTIVE").length,
    canceled: subscriptions.filter((s) => s.status === "CANCELED").length,
    revenue: subscriptions
      .filter((s) => s.status === "ACTIVE")
      .reduce((sum, s) => {
        const serializedTool = serializeTool(s.tool);
        const minPrice = getMinimumStartingPrice(serializedTool);
        return sum + minPrice;
      }, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Subscriptions</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor all tool subscriptions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Subscriptions</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Canceled</CardDescription>
            <CardTitle className="text-3xl text-gray-600">{stats.canceled}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Monthly Revenue</CardDescription>
            <CardTitle className="text-3xl">{formatPrice(stats.revenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Complete list of tool subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subscriptions.map((subscription) => {
              const serializedTool = serializeTool(subscription.tool);
              const minimumPrice = getMinimumStartingPrice(serializedTool);
              
              return (
                <div
                  key={subscription.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <ToolIcon icon={subscription.tool.icon} name={subscription.tool.name} size="md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">{subscription.tool.name}</h3>
                        <Badge
                          variant={
                            subscription.status === "ACTIVE"
                              ? "default"
                              : subscription.status === "CANCELED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {subscription.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {subscription.user.name || subscription.user.email}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Started: {formatDate(subscription.currentPeriodStart)}</span>
                        <span>•</span>
                        <span>Next billing: {formatDate(subscription.currentPeriodEnd)}</span>
                        <span>•</span>
                        <span>{minimumPrice > 0 ? `${formatPrice(minimumPrice)}/month` : 'Price not set'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {subscriptions.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No subscriptions yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
