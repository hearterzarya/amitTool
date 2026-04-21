import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Users,
  Zap,
  CheckCircle2,
  BadgeCheck,
  Lock,
  CalendarClock,
  Headphones,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { prisma } from "@/lib/prisma";
import { ToolNamesSlider } from "@/components/tools/tool-names-slider";
import { formatPrice, serializeBundle } from "@/lib/utils";
import { brand } from "@/lib/brand";
import { getContactInfo } from "@/lib/app-settings";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const contactInfo = await getContactInfo();
  // Fetch all bundles
  let allBundles: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string | null;
    priceMonthly: number;
    priceSixMonth: number | null;
    priceYearly: number | null;
    features: string | null;
    icon: string | null;
    imageUrl?: string | null;
  }> = [];

  // Fetch active tools
  let tools: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    shortDescription?: string | null;
  }> = [];
  let featuredTools: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    shortDescription: string | null;
  }> = [];
  let homeReviewScreenshots: Array<{
    id: string;
    imageUrl: string;
    caption: string | null;
  }> = [];

  try {
    // Try to fetch bundles (may not exist yet)
    try {
      if ('bundle' in prisma && typeof (prisma as any).bundle?.findMany === 'function') {
        allBundles = await (prisma as any).bundle.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          take: 5,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            shortDescription: true,
            priceMonthly: true,
            priceSixMonth: true,
            priceYearly: true,
            features: true,
            icon: true,
            imageUrl: true,
          },
        });
      }
    } catch (error) {
      console.warn('Bundles table may not exist yet:', error);
    }

    tools = await prisma.tool.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        shortDescription: true,
        description: true,
        sharedPlanFeatures: true,
        privatePlanFeatures: true,
      },
    });
    featuredTools = await prisma.tool.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { sortOrder: 'asc' },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        shortDescription: true,
      },
    });
    if ('reviewScreenshot' in prisma && typeof (prisma as any).reviewScreenshot?.findMany === 'function') {
      homeReviewScreenshots = await (prisma as any).reviewScreenshot.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        take: 3,
        select: {
          id: true,
          imageUrl: true,
          caption: true,
        },
      });
    }
  } catch (error: any) {
    console.error('Database error:', error?.message);
    tools = [];
  }

  return (
    <AppShell>
      {/* Hero — content aligned to marketing reference (no pricing cards) */}
      <section className="relative overflow-hidden pt-2 md:pt-3 pb-16 md:pb-20">
        <div className="absolute inset-0 gradient-surface-light"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_50%)]"></div>

        <div className="container-custom relative z-10">
          {/* Top trust bar */}
          <div className="mb-8 md:mb-10 border-y border-border/40 bg-background/30 py-3 px-2">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6 md:gap-x-8 text-xs sm:text-sm font-body text-foreground/80">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                12,000+ Happy Customers
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-500">
                <Zap className="h-4 w-4 shrink-0" aria-hidden />
                Delivery in under 2 minutes
              </span>
              <span className="inline-flex items-center gap-1.5 text-amber-600">
                <Lock className="h-4 w-4 shrink-0" aria-hidden />
                100% Secure Indian Payments
              </span>
              <span className="inline-flex items-center gap-1.5 text-sky-600">
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                7-Day Money Back Guarantee
              </span>
              <span className="inline-flex items-center gap-1.5 text-red-500">
                <Headphones className="h-4 w-4 shrink-0" aria-hidden />
                24/7 WhatsApp Support
              </span>
            </div>
          </div>

          <div className="text-center max-w-5xl mx-auto animate-fade-in-up">
            <Badge
              variant="outline"
              className="mb-6 md:mb-8 border-purple-300/60 bg-background/60 px-4 py-1.5 text-sm font-medium text-foreground shadow-sm"
            >
              🔥 India&apos;s Most Trusted Premium Tool Store
            </Badge>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 md:mb-8">
              <span className="block text-foreground">Premium AI & Work Tools</span>
              <span className="block text-gradient-accent mt-2 md:mt-3">Save Up to 90% vs Official</span>
              <span className="block text-foreground mt-2 md:mt-3">Price</span>
            </h1>

            <p className="mx-auto max-w-3xl text-base sm:text-lg md:text-xl text-foreground/75 mb-8 md:mb-10 leading-relaxed font-body px-2">
              Get instant access to ChatGPT, Gemini Pro, LinkedIn Premium, MS Office & 20+ tools — at prices made for
              India.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch sm:items-center mb-10 md:mb-12 max-w-xl mx-auto sm:max-w-none">
              <Button
                asChild
                size="lg"
                className="text-base sm:text-lg px-8 py-6 h-auto shadow-glow-primary gradient-surface-primary font-display"
              >
                <Link href="/tools" className="inline-flex items-center justify-center gap-2">
                  <span aria-hidden>🚀</span>
                  Explore All Tools
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="text-base sm:text-lg px-8 py-6 h-auto bg-emerald-600 hover:bg-emerald-700 text-white font-display shadow-md"
              >
                <a
                  href={`https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(brand.whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <span aria-hidden>💬</span>
                  WhatsApp Us
                </a>
              </Button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-4 pt-2 border-t border-border/40 max-w-4xl mx-auto">
              {[
                { value: "12,000+", label: "Happy Customers" },
                { value: "99%", label: "Satisfaction Rate" },
                { value: "<2 min", label: "Average Delivery" },
                { value: "20+", label: "Premium Tools" },
                { value: "7-Day", label: "Money Back" },
              ].map((row) => (
                <div key={row.label} className="text-center">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-sky-600 dark:text-sky-400 font-display">
                    {row.value}
                  </div>
                  <div className="mt-1 text-xs sm:text-sm text-foreground/70 font-body">{row.label}</div>
                </div>
              ))}
            </div>

            {tools.length > 0 && (
              <div className="mt-12 md:mt-14 -mx-4 sm:-mx-6 lg:-mx-8">
                <ToolNamesSlider tools={tools} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bundles Section */}
      <section className="section-padding relative py-12 md:py-16">
        <div className="absolute inset-0 gradient-surface-light"></div>
        <div className="container-custom relative z-10">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="text-h1 mb-3 text-gradient-primary">
              Smart AI Bundles
            </h2>
            <p className="text-lg text-foreground/70 max-w-3xl mx-auto mb-6 font-body">
              Built for Real Work in India — Affordable, Instant Access
            </p>
            <div className="w-24 h-0.5 gradient-surface-primary mx-auto rounded-full"></div>
          </div>

          {allBundles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {allBundles.map((bundle, index) => {
                const serializedBundle = serializeBundle(bundle);
                return (
                <Card 
                  key={serializedBundle.id}
                  className="group relative overflow-hidden h-full flex flex-col hover-lift p-0"
                >
                  {/* Full-width image / icon at top of card */}
                  <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                    {serializedBundle.imageUrl ? (
                      <img
                        src={serializedBundle.imageUrl}
                        alt=""
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl sm:text-7xl">
                        {serializedBundle.icon || "📦"}
                      </div>
                    )}
                    <Badge variant="accent" className="absolute top-3 right-3 shadow-soft">
                      Bundle
                    </Badge>
                  </div>
                  <CardHeader className="pb-3 pt-4">
                    <CardTitle className="text-xl mb-2 font-display">{serializedBundle.name}</CardTitle>
                    <CardDescription className="text-base font-body text-foreground/70">
                      {serializedBundle.shortDescription || serializedBundle.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col">
                    {serializedBundle.features && (
                      <div className="space-y-3 flex-1">
                        {serializedBundle.features.split(/\n|,/).slice(0, 3).map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 text-sm font-body text-foreground/80">
                            <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0" />
                            <span className="line-clamp-1">{feature.trim()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pt-6 border-t border-border/50 mt-auto">
                      <div className="text-3xl font-display font-semibold mb-4">
                        {formatPrice(serializedBundle.priceMonthly)}/month
                      </div>
                      <Button 
                        asChild 
                        className="w-full shadow-glow-primary font-display"
                      >
                        <Link href={`/checkout/bundle/${serializedBundle.id}`} className="flex items-center justify-center gap-2">
                          Buy Now
                          <ArrowRight className="h-5 w-5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-foreground/60 font-body">Bundles will be available soon. Check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* Best sellers (admin: Tool → Best seller / featured) — replaces home search + full grid */}
      <section className="bg-white py-12 md:py-16">
        <div className="container-custom">
          <div className="text-center mb-6 md:mb-8">
            <Badge className="mb-3 gradient-surface-primary text-white font-semibold shadow-soft-md">
              Best Sellers
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-slate-900">
              Buy Any Premium Tool Individually
            </h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto">
              Hand-picked best sellers you control in Admin. Open the full catalog anytime from the button below.
            </p>
          </div>

          {featuredTools.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 mb-8">
              {featuredTools.map((tool) => {
                const isImageUrl = tool.icon && (tool.icon.startsWith('/') || tool.icon.startsWith('http'));
                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="group rounded-xl border-2 border-slate-200 bg-white hover:border-purple-400 hover:shadow-lg transition-all duration-300 overflow-hidden"
                  >
                    <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-purple-100 to-blue-100">
                      {isImageUrl ? (
                        <img src={tool.icon!} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                          {tool.icon || '🛠️'}
                        </div>
                      )}
                    </div>
                    <div className="p-3 sm:p-4 text-center">
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {tool.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 mb-8 rounded-xl border border-amber-200 bg-amber-50/80 px-4">
              <p className="text-slate-800 font-medium mb-1">No best sellers selected yet</p>
              <p className="text-sm text-slate-600 mb-4">
                In Admin, edit any active tool and turn on <strong>Best seller (home page)</strong>.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/tools">Go to Admin Tools</Link>
              </Button>
            </div>
          )}

          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="px-10 py-7 h-auto text-lg font-display">
              <Link href="/tools" className="flex items-center gap-2 justify-center">
                View All Tools
                <ArrowRight className="w-6 h-6" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom max-w-5xl">
          <Card className="p-8 md:p-10 border-slate-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="rounded-full bg-purple-100 p-3">
                <BadgeCheck className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Amit - Founder</h2>
                <p className="text-slate-600">Tech Entrepreneur - Mumbai, India</p>
              </div>
            </div>
            <p className="text-slate-700 leading-relaxed text-base md:text-lg">
              I started Amit Techsolution in 2023 after realising how expensive premium tools are for Indian students,
              freelancers and small businesses. Our mission is simple: give every Indian access to the same tools that
              global companies use - at prices that make sense for India. We've now helped over 12,000 customers save
              crores in subscription costs.
            </p>
          </Card>
        </div>
      </section>

      {/* WhatsApp Support Section */}
      <section className="section-padding relative">
        <div className="absolute inset-0 gradient-surface-light"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.08),transparent_70%)]"></div>
        <div className="container-custom max-w-4xl mx-auto text-center relative z-10">
          <Card className="p-10 md:p-14 animate-scale-in">
            <WhatsAppIcon size={64} className="text-[#25D366] mx-auto mb-6" />
            <h2 className="text-h2 mb-4 text-gradient-primary">
              Chat with us on WhatsApp
            </h2>
            <p className="text-lg text-foreground/70 mb-8 font-body">
              Need help? Have questions? Our team is ready to assist you 24/7 via WhatsApp.
            </p>
            <Button
              asChild
              size="lg"
              className="gradient-surface-accent shadow-glow font-display"
            >
              <a
                href={`https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent(brand.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <WhatsAppIcon size={20} />
                Contact us on WhatsApp
              </a>
            </Button>
          </Card>
        </div>
      </section>

      {/* Join Community Section */}
      <section className="section-padding relative">
        <div className="absolute inset-0 gradient-surface-warm"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.08),transparent_70%)]"></div>
        <div className="container-custom max-w-4xl mx-auto text-center relative z-10 animate-fade-in-up">
          <Badge className="mb-6 gradient-surface-accent text-white shadow-soft-md">
            <Users className="h-4 w-4 mr-2" />
            Community
          </Badge>
          <h2 className="text-h1 mb-6 text-gradient-primary">
            Join Our Community
          </h2>
          <p className="text-xl text-foreground/70 mb-10 font-body">
            Get tool updates, exclusive offers, and connect with other users
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="gradient-surface-accent shadow-glow font-display"
            >
              <a
                href={`https://wa.me/${contactInfo.whatsappNumber}?text=${encodeURIComponent("Hi! I want to join the community for tool updates and offers.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2"
              >
                <WhatsAppIcon size={20} />
                Join WhatsApp Group
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="font-display"
            >
              <a
                href="https://t.me/your_telegram_group"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2"
              >
                <TelegramIcon size={20} />
                Join Telegram Channel
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Home Reviews Section */}
      <section className="section-padding bg-slate-50">
        <div className="container-custom">
          <div className="text-center mb-8">
            <Badge className="mb-3 gradient-surface-primary text-white font-semibold shadow-soft-md">
              Reviews
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-slate-900">
              Real Customer Trust
            </h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto">
              Verified feedback and proof screenshots from customers across India.
            </p>
          </div>

          {homeReviewScreenshots.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {homeReviewScreenshots.map((shot) => (
                <div key={shot.id} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <img src={shot.imageUrl} alt={shot.caption || 'Customer review screenshot'} className="w-full h-56 object-cover" />
                  <div className="p-3">
                    <p className="text-sm text-slate-700 line-clamp-2">{shot.caption || 'Customer proof screenshot'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                'Fast delivery, genuine access and smooth support experience.',
                'Saved thousands every month compared to direct subscriptions.',
                'Perfect for students, freelancers and agencies in India.',
              ].map((quote) => (
                <Card key={quote} className="border-slate-200">
                  <CardContent className="pt-6">
                    <p className="text-slate-700">"{quote}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link href="/reviews" className="inline-flex items-center gap-2">
                See All Reviews
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
