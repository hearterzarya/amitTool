import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { User, Mail, Calendar, Shield, Bell, Key } from "lucide-react";
import { SettingsForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  const userId = (session.user as any).id;

  // Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        include: {
          tool: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const userRole = (user as any).role;
  const isTestUser = userRole === 'TEST_USER' || userRole === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            <CardTitle>Account Information</CardTitle>
          </div>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium">Email Address</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
              </div>
            </div>
            {user.emailVerified ? (
              <Badge className="bg-green-100 text-green-800 border-green-300">
                Verified
              </Badge>
            ) : (
              <Badge variant="outline">Unverified</Badge>
            )}
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium">Name</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {user.name || 'Not set'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium">Account Type</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {isTestUser ? 'Test User' : 'Regular User'}
                </div>
              </div>
            </div>
            <Badge variant={userRole === 'ADMIN' ? 'default' : 'secondary'}>
              {userRole}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <div className="font-medium">Member Since</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(user.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            <CardTitle>Subscription Summary</CardTitle>
          </div>
          <CardDescription>Overview of your active subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {user.subscriptions.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You have <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {user.subscriptions.length}
                </span> active {user.subscriptions.length === 1 ? 'subscription' : 'subscriptions'}
              </div>
              <div className="space-y-2">
                {user.subscriptions.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <span className="font-medium">{subscription.tool.name}</span>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No active subscriptions
              </p>
              <a
                href="/tools"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Browse Tools →
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            <CardTitle>Preferences</CardTitle>
          </div>
          <CardDescription>Manage your preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm user={user} />
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-red-500" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">Password</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Last changed: {formatDate(user.updatedAt)}
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Change Password
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Add an extra layer of security
              </div>
            </div>
            <Badge variant="outline">Not enabled</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
