import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Card } from "@/components/ui/card";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is admin
  if (!session || !session.user) {
    redirect("/login");
  }

  if ((session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Ensure user data is available
  const userName = session.user?.name || null;
  const userEmail = session.user?.email || null;

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 gradient-surface-light"></div>
      {/* Admin Header */}
      <AdminHeader user={{ name: userName, email: userEmail }} />
      
      <div className="container-custom py-6 md:py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Content */}
          <main className="lg:col-span-4">
            <Card className="p-5 lg:p-6">
              {children}
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
