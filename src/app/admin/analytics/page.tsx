import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, serializeTool } from "@/lib/utils";
import { getMinimumStartingPrice } from "@/lib/price-utils";
import { TrendingUp, Users, Wrench, DollarSign } from "lucide-react";
import { ToolIcon } from "@/components/tools/tool-icon";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  let tools: any[] = [];
  let activeSubscriptions: any[] = [];

  try {
    [tools, activeSubscriptions] = await Promise.all([
      prisma.tool.findMany({
        include: {
          subscriptions: {
            where: { status: "ACTIVE" },
          },
        },
      }),
      prisma.toolSubscription.findMany({
        where: { status: "ACTIVE" },
        include: {
          tool: true,
        },
      }),
    ]);
  } catch (error: any) {
    console.error('Analytics page error:', error);
    // Return empty data on error
    tools = [];
    activeSubscriptions = [];
  }

  const totalRevenue = activeSubscriptions.reduce(
    (sum, sub) => sum + sub.tool.priceMonthly,
    0
  );

  const toolsByRevenue = tools
    .map((tool) => ({
      ...tool,
      revenue: tool.subscriptions.length * tool.priceMonthly,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const popularTools = tools
    .map((tool) => ({
      ...tool,
      subscriberCount: tool.subscriptions.length,
    }))
    .sort((a, b) => b.subscriberCount - a.subscriberCount)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Platform performance and insights
        </p>
      </div>

      {/* Revenue by Tool */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Tool</CardTitle>
          <CardDescription>Monthly recurring revenue per tool</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {toolsByRevenue.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ToolIcon icon={tool.icon} name={tool.name} size="sm" />
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tool.subscriptions.length} subscribers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatPrice(tool.revenue)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">/month</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Tools</CardTitle>
          <CardDescription>Top 5 tools by subscriber count</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularTools.map((tool, index) => (
              <div key={tool.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400">
                    #{index + 1}
                  </span>
                  <ToolIcon icon={tool.icon} name={tool.name} size="sm" />
                  <div>
                    <p className="font-medium">{tool.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tool.minimumPrice > 0 ? `${formatPrice(tool.minimumPrice)}/month` : 'Price not set'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-2xl">{tool.subscriberCount}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    subscribers
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
