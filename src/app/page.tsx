import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Zap, CheckCircle2, Rocket } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { prisma } from "@/lib/prisma";
import { ToolIcon } from "@/components/tools/tool-icon";
import { ToolNamesSlider } from "@/components/tools/tool-names-slider";
import { IndividualToolsSearch } from "@/components/tools/individual-tools-search";
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
        description: true,
        sharedPlanFeatures: true,
        privatePlanFeatures: true,
      },
    });
  } catch (error: any) {
    console.error('Database error:', error?.message);
    tools = [];
  }

  return (
    <AppShell>
      {/* Hero Section - Glassmorphism Premium Light */}
      <section className="relative overflow-hidden section-padding">
        <div className="absolute inset-0 gradient-surface-light"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(96,165,250,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_50%)]"></div>
        
        <div className="container-custom relative z-10">
          <div className="text-center max-w-6xl mx-auto animate-fade-in-up">
            <Badge className="mb-8 gradient-surface-primary text-white shadow-soft-md animate-float">
              <Rocket className="h-4 w-4 mr-2" />
              Premium Tools for India
            </Badge>
            
            <h1 className="text-display mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="block text-gradient-primary">Premium AI & Work Tools</span>
              <span className="block text-gradient-accent mt-4">
                Now Affordable for India
              </span>
            </h1>
            
            <p className="mx-auto max-w-4xl text-xl md:text-2xl text-foreground/80 mb-6 leading-relaxed font-body animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Smart bundles for content, SEO, video, business & study — without expensive subscriptions.
            </p>
            <p className="text-lg text-foreground/60 mb-12 font-body animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Monthly • 6-Month • Yearly plans • Instant access • Indian payments supported
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Button 
                asChild 
                size="lg" 
                className="text-lg px-10 py-7 h-auto shadow-glow-primary"
              >
                <Link href="/tools" className="flex items-center gap-2 font-display">
                  Explore Tools
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </Button>
            </div>

            {/* Tool Names Slider */}
            {tools.length > 0 && (
              <div className="mt-12 -mx-4 sm:-mx-6 lg:-mx-8">
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
                        className="object-cover w-full h-full"
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

      {/* Individual Tools Section */}
      <section className="section-padding bg-white py-10 md:py-12">
        <div className="container-width">
          <div className="text-center mb-6 md:mb-8">
            <Badge className="mb-3 gradient-surface-primary text-white font-semibold shadow-soft-md">
              Individual Tools
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-slate-900">
              Buy Any Premium Tool Individually
            </h2>
            <p className="text-base text-slate-600 max-w-3xl mx-auto">
              No bundle required — Explore and purchase individual tools instantly, with simple pricing and secure access.
            </p>
          </div>

          <IndividualToolsSearch tools={tools} />

          <div className="text-center mt-8">
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="px-10 py-7 h-auto text-lg font-display"
            >
              <Link href="/tools" className="flex items-center gap-2">
                View All Tools
                <ArrowRight className="w-6 h-6" />
              </Link>
            </Button>
          </div>
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
    </AppShell>
  );
}
