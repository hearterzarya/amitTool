import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatPrice } from "@/lib/utils";
import { ToolIcon } from "@/components/tools/tool-icon";
import { CreditCard, DollarSign, TrendingUp, Clock } from "lucide-react";

export default async function PaymentsManagementPage() {
  const payments = await prisma.payment.findMany({
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
        },
      },
    },
    take: 100, // Limit to recent 100 payments
  });

  const stats = {
    total: payments.length,
    success: payments.filter((p) => p.status === "SUCCESS").length,
    pending: payments.filter((p) => p.status === "PENDING").length,
    revenue: payments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Payments Management</h2>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all payment transactions
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Payments</CardDescription>
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Successful</CardDescription>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <CardTitle className="text-3xl">{stats.success}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Pending</CardDescription>
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
            <CardTitle className="text-3xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Revenue</CardDescription>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
            <CardTitle className="text-3xl">{formatPrice(stats.revenue)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <CardDescription>Complete list of payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                <div className="flex items-start gap-4 flex-1">
                  {payment.tool && (
                    <ToolIcon icon={payment.tool.icon} name={payment.tool.name} size="md" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        {payment.tool ? payment.tool.name : 'Bundle Purchase'}
                      </h3>
                      <Badge
                        variant={
                          payment.status === "SUCCESS"
                            ? "default"
                            : payment.status === "PENDING"
                            ? "secondary"
                            : payment.status === "FAILED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {payment.status}
                      </Badge>
                      {payment.planName && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          {payment.planName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {payment.user.name || payment.user.email}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>Amount: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(payment.amount)}</span></span>
                      <span>•</span>
                      <span>Date: {formatDate(payment.createdAt)}</span>
                      {payment.successDate && (
                        <>
                          <span>•</span>
                          <span>Completed: {formatDate(payment.successDate)}</span>
                        </>
                      )}
                      {payment.merchantReferenceId && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-xs">Ref: {payment.merchantReferenceId.slice(0, 8)}...</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatPrice(payment.amount)}
                  </div>
                  {payment.planName && (
                    <div className="text-xs text-gray-500 mt-1">
                      {payment.planName}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {payments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No payments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
