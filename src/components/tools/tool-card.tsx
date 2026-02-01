'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getBasePrice, getOneMonthPrice, type PlanType } from "@/lib/price-utils";
import { ArrowRight, Star, ShoppingCart, Eye } from "lucide-react";

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    category: string;
    icon?: string;
    priceMonthly: number;
    // Duration-specific prices
    sharedPlanPrice1Month?: number | null;
    sharedPlanPrice3Months?: number | null;
    sharedPlanPrice6Months?: number | null;
    sharedPlanPrice1Year?: number | null;
    privatePlanPrice1Month?: number | null;
    privatePlanPrice3Months?: number | null;
    privatePlanPrice6Months?: number | null;
    privatePlanPrice1Year?: number | null;
    // Legacy fields
    sharedPlanPrice?: number | null;
    privatePlanPrice?: number | null;
    sharedPlanEnabled?: boolean;
    privatePlanEnabled?: boolean;
    isActive: boolean;
  };
  showSubscribeButton?: boolean;
}

export function ToolCard({ tool, showSubscribeButton = true }: ToolCardProps) {
  const router = useRouter();
  const categoryLabels: Record<string, string> = {
    AI_WRITING: "AI Writing",
    SEO_TOOLS: "SEO & Marketing",
    DESIGN: "Design",
    PRODUCTIVITY: "Productivity",
    CODE_DEV: "Code & Dev",
    VIDEO_AUDIO: "Video & Audio",
    LEARNING: "Learning",
    OTHER: "Other",
  };

  // Plan prices for display (no single "starting" price)
  const sharedBase = getBasePrice(tool, 'shared');
  const privateBase = getBasePrice(tool, 'private');
  const sharedOneMonth = getOneMonthPrice(tool, 'shared', sharedBase);
  const privateOneMonth = getOneMonthPrice(tool, 'private', privateBase);

  // Generate features from description
  const getFeatures = () => {
    const desc = tool.shortDescription || tool.description || "";
    const features = desc.split(/[.,;]/).filter(f => f.trim().length > 10).slice(0, 3);
    return features.length > 0 ? features : ['Premium features', 'Full access', 'Monthly updates'];
  };

  const features = getFeatures();

  const handleCardClick = () => {
    router.push(`/tools/${tool.slug}`);
  };

  const isImageUrl = tool.icon && (tool.icon.startsWith('/') || tool.icon.startsWith('http'));

  return (
    <Card 
      className="group relative overflow-hidden glass border border-slate-200 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 h-full flex flex-col cursor-pointer p-0"
      onClick={handleCardClick}
    >
      {/* Full-width image at top of card */}
      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
        {isImageUrl ? (
          <img
            src={tool.icon!}
            alt=""
            className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl sm:text-7xl group-hover:scale-105 transition-transform duration-300">
            {tool.icon || "🛠️"}
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-medium shadow-sm">
          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
          <span>4.9</span>
        </div>
      </div>

      <CardHeader className="flex-1 pb-4 pt-4">
        {/* Category Badge */}
        <Badge 
          className="glass border-slate-200 text-slate-700 text-xs font-medium mb-2 w-fit"
          variant="secondary"
        >
          {categoryLabels[tool.category] || tool.category}
        </Badge>

        {/* Tool Name */}
        <CardTitle className="text-lg font-bold mb-2 text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1">
          {tool.name}
        </CardTitle>

        {/* Description */}
        <CardDescription className="text-sm text-slate-600 group-hover:text-slate-700 transition-colors line-clamp-2 mb-4">
          {tool.shortDescription || tool.description || "Premium AI tool access"}
        </CardDescription>

        {/* Features List */}
        <div className="space-y-1 mb-4">
          {features.slice(0, 3).map((feature, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-xs text-slate-600">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span className="line-clamp-1">{feature.trim()}</span>
            </div>
          ))}
          {features.length > 3 && (
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span>+{features.length - 3} more</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Pricing — plan prices only, no "starting" price */}
        <div className="space-y-2">
          {sharedOneMonth > 0 || privateOneMonth > 0 ? (
            <>
              <div className="flex flex-wrap gap-2 text-sm">
                {sharedOneMonth > 0 && (
                  <Badge variant="outline" className="text-xs font-semibold">
                    Shared: {formatPrice(sharedOneMonth)}/mo
                  </Badge>
                )}
                {privateOneMonth > 0 && (
                  <Badge variant="outline" className="text-xs font-semibold">
                    Private: {formatPrice(privateOneMonth)}/mo
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-500">per month</div>
            </>
          ) : (
            <div className="text-sm text-gray-400 italic">Price not set</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          {showSubscribeButton && tool.isActive ? (
            <>
              <Button 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/tools/${tool.slug}`);
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold button-text-clear border-0 shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 text-xs"
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Add to Cart
              </Button>
              <Button 
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/tools/${tool.slug}`);
                }}
                className="glass border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all text-xs"
              >
                <Eye className="h-3 w-3" />
              </Button>
            </>
          ) : !tool.isActive ? (
            <Badge variant="destructive" className="w-full glass border-red-300 bg-red-100 text-red-700 justify-center">
              Unavailable
            </Badge>
          ) : null}
        </div>
      </CardContent>

      {/* Shine effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
    </Card>
  );
}
