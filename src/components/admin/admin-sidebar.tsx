'use client';

import { usePathname } from 'next/navigation';
import Link from "next/link";
import { LayoutDashboard, Wrench, Users, CreditCard, BarChart3, Receipt, Download, Star, Package, Settings, Shield, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const menuItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/tools", label: "Tools", icon: Wrench },
  { href: "/admin/bundles", label: "Bundles", icon: Package },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/payments", label: "Payments", icon: Receipt },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/extension", label: "Admin Extension", icon: Download },
  { href: "/admin/reviews", label: "Reviews & Proofs", icon: Star },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="lg:col-span-1">
      <Card className="p-6 sticky top-32">
        {/* Admin Badge */}
        <div className="mb-8 pb-6 border-b border-border/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 gradient-surface-primary rounded-lg shadow-glow-primary">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-display font-semibold">Admin Panel</span>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            
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
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </Card>
    </aside>
  );
}
