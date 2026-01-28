'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  User, 
  Wrench, 
  Star, 
  FileText, 
  HelpCircle, 
  Menu, 
  X, 
  Home, 
  Shield,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/tools', label: 'Tools', icon: Wrench },
    { href: '/features', label: 'Features', icon: Star },
    { href: '/reviews', label: 'Reviews', icon: FileText },
    { href: '/faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled 
          ? "glass-strong border-b border-border shadow-soft-lg backdrop-blur-xl" 
          : "glass border-b border-border/50 backdrop-blur-md"
      )}
    >
      <div className="container-custom">
        <div className="flex h-20 md:h-24 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-3 group transition-transform duration-300 hover:scale-105"
            aria-label="Home"
          >
            <div className="relative">
              <div className="absolute inset-0 gradient-surface-primary rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <div className="relative p-2.5 gradient-surface-primary rounded-xl shadow-glow-primary">
                <Zap className="h-6 w-6 md:h-7 md:w-7 text-white" />
              </div>
            </div>
            <span className="text-xl md:text-2xl font-display font-semibold text-gradient-primary">
              {brand.name}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-lg font-display font-medium text-sm text-foreground/80 hover:text-foreground hover:glass transition-all duration-300"
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden lg:flex items-center space-x-3">
            {status === "loading" ? (
              <div className="h-11 w-28 glass animate-pulse rounded-lg" />
            ) : session ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <div className="relative">
                        {(session.user as any)?.role === 'ADMIN' ? (
                          <Shield className="h-4 w-4 text-primary" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        {(session.user as any)?.role === 'ADMIN' && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 bg-accent rounded-full border-2 border-background animate-pulse" />
                        )}
                      </div>
                      <span className="max-w-[120px] truncate font-display">
                        {session.user?.name || session.user?.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-strong border-border/50 shadow-soft-xl">
                    <DropdownMenuLabel className="font-display">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem asChild>
                      <Link 
                        href={(session.user as any)?.role === 'ADMIN' ? "/admin" : "/dashboard"}
                        className="flex items-center space-x-2 cursor-pointer font-body"
                      >
                        {(session.user as any)?.role === 'ADMIN' ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        <span>{(session.user as any)?.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem 
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-destructive focus:text-destructive cursor-pointer font-body"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {(session.user as any)?.role === 'ADMIN' && (
                  <Button 
                    asChild 
                    size="sm"
                    className="gradient-surface-primary shadow-glow-primary"
                  >
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-1.5" />
                      Admin
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  size="sm"
                  className="gradient-surface-primary shadow-glow-primary"
                >
                  <Link href="/register">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="lg:hidden p-2 rounded-lg glass hover:glass-strong transition-all"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] glass-strong border-l border-border/50">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-3 font-display">
                  <div className="p-2 gradient-surface-primary rounded-xl">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-gradient-primary">{brand.name}</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg font-display font-medium text-base glass hover:glass-strong transition-all"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                {session && (
                  <Link
                    href={(session.user as any)?.role === 'ADMIN' ? "/admin" : "/dashboard"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg font-display font-medium text-base glass hover:glass-strong transition-all mt-4"
                  >
                    <div className="relative">
                      {(session.user as any)?.role === 'ADMIN' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <span>{(session.user as any)?.role === 'ADMIN' ? 'Admin Panel' : 'Dashboard'}</span>
                  </Link>
                )}
                <div className="pt-4 mt-4 border-t border-border/50 space-y-2">
                  {status === "loading" ? (
                    <div className="h-12 w-full glass animate-pulse rounded-lg" />
                  ) : session ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="w-full justify-start font-display"
                    >
                      Sign Out
                    </Button>
                  ) : (
                    <>
                      <Button 
                        asChild 
                        variant="ghost" 
                        size="sm"
                        className="w-full justify-start font-display"
                      >
                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                          Sign In
                        </Link>
                      </Button>
                      <Button 
                        asChild 
                        size="sm"
                        className="w-full gradient-surface-primary shadow-glow-primary font-display"
                      >
                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                          Get Started
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
