'use client';

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, User, MessageCircle } from "lucide-react";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { useContactInfo } from "@/components/providers/contact-info-provider";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const contactInfo = useContactInfo();
  return (
    <header className="sticky top-0 z-50 bg-background/98 backdrop-blur-xl border-b-4 border-foreground shadow-brutal-md">
      <div className="container-custom">
        <div className="flex h-20 md:h-24 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary rounded-lg blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                <div className="relative p-2 gradient-primary rounded-lg shadow-brutal-sm group-hover:shadow-brutal-md transition-all duration-300">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">Admin Panel</h1>
                <p className="text-xs text-foreground/60 font-body">Management Dashboard</p>
              </div>
            </Link>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-3 px-5 py-3 glass rounded-lg shadow-soft">
              <div className="p-2 gradient-surface-primary rounded-full">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-display font-semibold text-foreground">
                  {user.name || 'Admin'}
                </p>
                <p className="text-xs text-foreground/60 font-body">
                  {user.email}
                </p>
              </div>
            </div>

            {/* WhatsApp Button */}
            <Button
              asChild
              size="sm"
              className="gradient-surface-accent shadow-glow font-display"
            >
              <a
                href={`https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent('Hello! I need admin support.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center space-x-2 font-display"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
