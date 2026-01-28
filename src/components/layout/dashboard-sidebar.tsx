'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CreditCard, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const menuItems = [
  { href: "/dashboard", label: "My Tools", icon: Home },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64">
      <Card className="p-6 sticky top-32">
        <div className="mb-8">
          <h2 className="text-2xl font-display font-semibold mb-2">Dashboard</h2>
          <p className="text-sm text-foreground/60 font-body">Manage your account</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-5 py-3 rounded-lg font-display font-medium text-sm transition-all duration-300",
                  isActive
                    ? "gradient-surface-primary text-white shadow-soft-md shadow-glow-primary"
                    : "text-foreground/80 glass hover:glass-strong hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </Card>
    </aside>
  );
}
