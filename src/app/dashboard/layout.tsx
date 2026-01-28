import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell>
      <div className="container-custom py-12 relative">
        <div className="absolute inset-0 gradient-surface-light -z-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
          <DashboardSidebar />
          <main className="md:col-span-3">
            <Card className="p-8 md:p-10">
              {children}
            </Card>
          </main>
        </div>
      </div>
    </AppShell>
  );
}
