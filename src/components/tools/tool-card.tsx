'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getMinimumStartingPrice, getBasePrice, getOneMonthPrice, type PlanType } from "@/lib/price-utils";
import { ArrowRight, Star, ShoppingCart, Eye } from "lucide-react";
import { ToolIcon } from "./tool-icon";

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
    OTHER: "Other",
  };

  // Get minimum starting price (validates and filters corrupted prices)
  const displayPrice = getMinimumStartingPrice(tool);
  
  // Calculate discount if we have both shared and private prices (only if both are valid)
  let originalPrice: number | null = null;
  let discountPercent: number | null = null;
  
  if (tool.sharedPlanEnabled && tool.privatePlanEnabled && tool.sharedPlanPrice && tool.privatePlanPrice) {
    const sharedPriceNum = typeof tool.sharedPlanPrice === 'bigint' ? Number(tool.sharedPlanPrice) : (tool.sharedPlanPrice || 0);
    const privatePriceNum = typeof tool.privatePlanPrice === 'bigint' ? Number(tool.privatePlanPrice) : (tool.privatePlanPrice || 0);
    
    // Only show discount if both prices are valid (not corrupted)
    const MAX_VALID_PRICE = 1000000000; // ₹10M in paise
    if (sharedPriceNum > 0 && sharedPriceNum <= MAX_VALID_PRICE && 
        privatePriceNum > 0 && privatePriceNum <= MAX_VALID_PRICE) {
      const higherPrice = Math.max(sharedPriceNum, privatePriceNum);
      const lowerPrice = Math.min(sharedPriceNum, privatePriceNum);
      if (higherPrice > lowerPrice && lowerPrice === displayPrice) {
        originalPrice = higherPrice;
        discountPercent = Math.round(((higherPrice - lowerPrice) / higherPrice) * 100);
      }
    }
  }

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

  return (
    <Card 
      className="group relative overflow-hidden glass border border-slate-200 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:shadow-purple-500/20 h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-all duration-300 pointer-events-none" />
      
      <CardHeader className="flex-1 pb-4">
        {/* Tool Icon/Logo */}
        <div className="flex items-center justify-between mb-3">
          <div className="group-hover:scale-110 transition-transform duration-300">
            <ToolIcon icon={tool.icon} name={tool.name} size="lg" />
          </div>
          <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-medium">
            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
            <span>4.9</span>
          </div>
        </div>

        {/* Category Badge */}
        <Badge 
          className="glass border-slate-200 text-slate-700 text-xs font-medium mb-3 w-fit"
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
        {/* Pricing */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2 flex-wrap">
            {displayPrice > 0 ? (
              <div className="text-2xl font-bold gradient-text">
                {formatPrice(displayPrice)}
              </div>
            ) : (
              <div className="text-lg font-medium text-gray-400 italic">
                Price not set
              </div>
            )}
            {originalPrice && discountPercent && (
              <>
                <div className="text-sm text-slate-500 line-through">
                  {formatPrice(originalPrice)}
                </div>
                <Badge className="bg-red-100 text-red-700 border-red-300 text-xs">
                  {discountPercent}% OFF
                </Badge>
              </>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {tool.sharedPlanEnabled && tool.privatePlanEnabled 
              ? 'Starting from' 
              : tool.sharedPlanEnabled 
                ? 'Shared plan' 
                : tool.privatePlanEnabled 
                  ? 'Private plan' 
                  : ''} per month
          </div>
          {tool.sharedPlanEnabled && tool.privatePlanEnabled && (() => {
            // Use proper price calculation functions to get validated 1-month prices
            const sharedBasePrice = getBasePrice(tool, 'shared');
            const sharedOneMonthPrice = getOneMonthPrice(tool, 'shared', sharedBasePrice);
            const privateBasePrice = getBasePrice(tool, 'private');
            const privateOneMonthPrice = getOneMonthPrice(tool, 'private', privateBasePrice);
            
            // Only show if we have valid prices
            if (sharedOneMonthPrice > 0 || privateOneMonthPrice > 0) {
              return (
                <div className="flex gap-2 text-xs">
                  {sharedOneMonthPrice > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Shared: {formatPrice(sharedOneMonthPrice)}
                    </Badge>
                  )}
                  {privateOneMonthPrice > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Private: {formatPrice(privateOneMonthPrice)}
                    </Badge>
                  )}
                </div>
              );
            }
            return null;
          })()}
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
