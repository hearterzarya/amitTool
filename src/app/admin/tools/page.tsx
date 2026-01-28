import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatPrice, formatDate, serializeTool } from "@/lib/utils";
import { getMinimumStartingPrice } from "@/lib/price-utils";
import { Pencil, Plus, AlertCircle, CheckCircle, Wrench, Trash2 } from "lucide-react";
import { ToolIcon } from "@/components/tools/tool-icon";
import { DeleteToolButton } from "@/components/admin/delete-tool-button";

export default async function ToolsManagementPage() {
  const tools = await prisma.tool.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
        select: {
          id: true,
          userId: true,
          toolId: true,
          planType: true,
          status: true,
          activationStatus: true,
          activatedAt: true,
          activatedBy: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          canceledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tools Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your AI tools and their configurations
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/tools/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Tool
          </Link>
        </Button>
      </div>

      {/* Tools List */}
      <div className="grid grid-cols-1 gap-4">
        {tools.map((tool) => {
          const hasCookies = !!tool.cookiesEncrypted;
          const cookiesExpired = tool.cookiesExpiryDate
            ? new Date(tool.cookiesExpiryDate) < new Date()
            : false;
          const needsAttention = !hasCookies || cookiesExpired;
          
          // Serialize tool to convert BigInt to number
          // Note: serializeTool already filters corrupted prices via safeConvertPrice
          const serializedTool = serializeTool(tool);
          
          // Get minimum starting price from all available plans
          // This function checks: 1-month prices > base plan prices > priceMonthly
          const minimumPrice = getMinimumStartingPrice(serializedTool);
          
          // Debug: Log if price seems wrong (only in dev)
          if (process.env.NODE_ENV === 'development' && minimumPrice === 0 && tool.priceMonthly) {
            console.log('No valid price found for tool:', tool.name, {
              priceMonthly: tool.priceMonthly,
              sharedPlanPrice1Month: tool.sharedPlanPrice1Month,
              privatePlanPrice1Month: tool.privatePlanPrice1Month,
              sharedPlanPrice: tool.sharedPlanPrice,
              privatePlanPrice: tool.privatePlanPrice,
            });
          }

          return (
            <Card key={tool.id} className={needsAttention ? "border-orange-200" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <ToolIcon icon={tool.icon} name={tool.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        {tool.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {tool.shortDescription || tool.description}
                      </CardDescription>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>ID:</span>
                        <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                          {tool.id}
                        </code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/tools/${tool.id}/edit`}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <DeleteToolButton
                      toolId={tool.id}
                      toolName={tool.name}
                      hasActiveSubscriptions={tool.subscriptions.length > 0}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Category</p>
                    <p className="font-medium">{tool.category.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {tool.sharedPlanEnabled && tool.privatePlanEnabled ? "Starting from" : "Price"}
                    </p>
                    <p className="font-medium">
                      {minimumPrice > 0 ? (
                        <span className="text-green-600 font-semibold">{formatPrice(minimumPrice)}/mo</span>
                      ) : (
                        <span className="text-gray-400 italic">Not set</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Active Subscriptions</p>
                    <p className="font-medium">{tool.subscriptions.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Cookie Status</p>
                    <div className="flex items-center gap-2">
                      {hasCookies && !cookiesExpired ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-600">Configured</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-600">
                            {!hasCookies ? "Not configured" : "Expired"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {tool.cookiesUpdatedAt && (
                  <div className="mt-4 pt-4 border-t text-sm text-gray-600 dark:text-gray-400">
                    Last updated: {formatDate(tool.cookiesUpdatedAt)}
                    {tool.cookiesExpiryDate && (
                      <span className="ml-4">
                        Expires: {formatDate(tool.cookiesExpiryDate)}
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {tools.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Wrench className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tools yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add your first tool to get started
              </p>
              <Button asChild>
                <Link href="/admin/tools/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
