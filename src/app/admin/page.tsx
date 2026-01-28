import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { Users, Wrench, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  // Fetch statistics with error handling
  let totalUsers = 0;
  let totalTools = 0;
  let activeSubscriptions = 0;
  let totalRevenue = 0;
  let recentUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
  }> = [];
  let toolsNeedingCookies = 0;
  let dbError: string | null = null;

  try {
    const results = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.tool.count().catch(() => 0),
      prisma.toolSubscription.count({ where: { status: "ACTIVE" } }).catch(() => 0),
      prisma.toolSubscription.findMany({
        where: { status: "ACTIVE" },
        include: { tool: true },
      }).then((subs) =>
        subs.reduce((sum, sub) => sum + Number(sub.tool.priceMonthly || 0), 0)
      ).catch(() => 0),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      }).catch(() => []),
      prisma.tool.count({
        where: {
          OR: [
            { cookiesEncrypted: null },
            { cookiesExpiryDate: { lte: new Date() } },
          ],
        },
      }).catch(() => 0),
    ]);

    totalUsers = results[0] as number;
    totalTools = results[1] as number;
    activeSubscriptions = results[2] as number;
    totalRevenue = results[3] as number;
    recentUsers = results[4] as Array<{
      id: string;
      email: string;
      name: string | null;
      createdAt: Date;
    }>;
    toolsNeedingCookies = results[5] as number;
  } catch (error: any) {
    console.error('Database connection error:', error);
    dbError = error.message || 'Failed to connect to database';
    
    // Check if it's a connection error
    if (error.message?.includes('Can\'t reach database server') || 
        error.message?.includes('P1001') ||
        error.code === 'P1001') {
      dbError = 'Database connection failed. Please check your DATABASE_URL and ensure the database server is running.';
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Monitor your platform performance and manage your tools
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Link href="/admin/tools/new">Add New Tool</Link>
        </Button>
      </div>

      {/* Database Error Alert */}
      {dbError && (
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
            <div className="space-y-2 text-sm text-red-800 dark:text-red-200">
              <p><strong>To fix this issue:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check your <code className="bg-red-100 px-1 rounded">DATABASE_URL</code> in <code className="bg-red-100 px-1 rounded">.env</code> file</li>
                <li>Ensure your Neon PostgreSQL database is running</li>
                <li>Verify network connectivity to the database server</li>
                <li>Check if your database credentials are correct and not expired</li>
                <li>Try restarting your database connection pool</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Alert */}
      {toolsNeedingCookies > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900 dark:text-orange-100">
                Action Required
              </CardTitle>
            </div>
            <CardDescription className="text-orange-700 dark:text-orange-300">
              {toolsNeedingCookies} tool{toolsNeedingCookies > 1 ? "s" : ""} need cookie updates or have expired cookies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/tools">Review Tools</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Users</CardDescription>
              <Users className="h-4 w-4 text-gray-400" />
            </div>
            <CardTitle className="text-3xl">{totalUsers}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/users" className="text-sm text-primary hover:underline">
              View all users →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Total Tools</CardDescription>
              <Wrench className="h-4 w-4 text-gray-400" />
            </div>
            <CardTitle className="text-3xl">{totalTools}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/tools" className="text-sm text-primary hover:underline">
              Manage tools →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Active Subscriptions</CardDescription>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </div>
            <CardTitle className="text-3xl">{activeSubscriptions}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/subscriptions" className="text-sm text-primary hover:underline">
              View subscriptions →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Monthly Revenue</CardDescription>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </div>
            <CardTitle className="text-3xl">{formatPrice(totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/admin/analytics" className="text-sm text-primary hover:underline">
              View analytics →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>Latest registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{user.name || "No name"}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
          {recentUsers.length === 0 && (
            <p className="text-center text-gray-500 py-8">No users yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
