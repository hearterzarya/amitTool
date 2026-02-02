'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ToolIcon } from './tool-icon';
import { Sparkles, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { getBasePrice, getOneMonthPrice, type PlanType } from '@/lib/price-utils';

interface FeaturedTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  category: string;
  icon?: string | null;
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
  sharedPlanFeatures?: string | null;
  privatePlanFeatures?: string | null;
  sharedPlanEnabled?: boolean;
  privatePlanEnabled?: boolean;
}

interface FeaturedSliderProps {
  tools: FeaturedTool[];
  categories: Array<{ value: string; label: string }>;
}

export function FeaturedSlider({ tools, categories }: FeaturedSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'shared' | 'private'>('shared');

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying || tools.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tools.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, tools.length]);

  // Reset plan selection when tool changes - default to first available plan
  useEffect(() => {
    const currentTool = tools[currentIndex];
    if (currentTool?.sharedPlanEnabled) {
      setSelectedPlan('shared');
    } else if (currentTool?.privatePlanEnabled) {
      setSelectedPlan('private');
    } else {
      setSelectedPlan('shared'); // fallback
    }
  }, [currentIndex, tools]);

  if (tools.length === 0) return null;

  const currentTool = tools[currentIndex];
  const categoryLabel = categories.find(c => c.value === currentTool.category)?.label || 'AI Assistant';
  
  // Get category-based color scheme with multi-color gradients
  const getCategoryColors = (category: string) => {
    const colorMap: Record<string, { bg: string; badge: string; button: string }> = {
      'AI_WRITING': { 
        bg: 'from-purple-600 via-pink-500 to-indigo-600', 
        badge: 'bg-purple-100/90 border-purple-300 text-purple-800',
        button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
      },
      'SEO_TOOLS': { 
        bg: 'from-blue-600 via-cyan-500 to-teal-600', 
        badge: 'bg-blue-100/90 border-blue-300 text-blue-800',
        button: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
      },
      'DESIGN': { 
        bg: 'from-pink-600 via-rose-500 to-orange-600', 
        badge: 'bg-pink-100/90 border-pink-300 text-pink-800',
        button: 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700'
      },
      'PRODUCTIVITY': { 
        bg: 'from-green-600 via-emerald-500 to-teal-600', 
        badge: 'bg-green-100/90 border-green-300 text-green-800',
        button: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
      },
      'CODE_DEV': { 
        bg: 'from-indigo-600 via-purple-500 to-blue-600', 
        badge: 'bg-indigo-100/90 border-indigo-300 text-indigo-800',
        button: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
      },
      'VIDEO_AUDIO': { 
        bg: 'from-red-600 via-orange-500 to-amber-600', 
        badge: 'bg-red-100/90 border-red-300 text-red-800',
        button: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700'
      },
      'LEARNING': { 
        bg: 'from-amber-600 via-yellow-500 to-lime-600', 
        badge: 'bg-amber-100/90 border-amber-300 text-amber-800',
        button: 'bg-gradient-to-r from-amber-600 to-lime-600 hover:from-amber-700 hover:to-lime-700'
      },
      'MS_OFFICE_WINDOWS_KEY': { 
        bg: 'from-sky-600 via-blue-500 to-indigo-600', 
        badge: 'bg-sky-100/90 border-sky-300 text-sky-800',
        button: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700'
      },
      'VPNS': { 
        bg: 'from-emerald-600 via-green-500 to-teal-600', 
        badge: 'bg-emerald-100/90 border-emerald-300 text-emerald-800',
        button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
      },
      'SOFTWARES': { 
        bg: 'from-violet-600 via-purple-500 to-fuchsia-600', 
        badge: 'bg-violet-100/90 border-violet-300 text-violet-800',
        button: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
      },
      'OTHER': { 
        bg: 'from-gray-600 via-slate-500 to-zinc-600', 
        badge: 'bg-gray-100/90 border-gray-300 text-gray-800',
        button: 'bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700'
      },
    };
    return colorMap[category] || colorMap['OTHER'];
  };

  const colors = getCategoryColors(currentTool.category);
  
  // Parse features from plan
  const parseFeatures = (features: string | null | undefined) => {
    if (!features) return [];
    return features.split(/\n|,/).map(f => f.trim()).filter(f => f.length > 0).slice(0, 6);
  };

  // Get features based on selected plan
  const getFeatures = () => {
    if (selectedPlan === 'shared') {
      const features = parseFeatures(currentTool.sharedPlanFeatures);
      return features.length > 0 ? features : ['Premium Access', 'All Features', 'Priority Support'];
    } else {
      const features = parseFeatures(currentTool.privatePlanFeatures);
      return features.length > 0 ? features : ['Dedicated Account', 'All Features', 'Priority Support'];
    }
  };


  // Get price based on selected plan
  // Use proper price calculation functions to get validated prices
  const getPrice = () => {
    const plan: PlanType = selectedPlan;
    const basePrice = getBasePrice(currentTool, plan);
    const oneMonthPrice = getOneMonthPrice(currentTool, plan, basePrice);
    return oneMonthPrice;
  };

  const features = getFeatures();
  const displayPrice = getPrice();

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + tools.length) % tools.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tools.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="mb-12 animate-fade-in-up relative overflow-hidden rounded-xl">
      {/* Dynamic background with grid pattern based on category */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      
      <div className="relative p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Content */}
          <div className="relative z-10">
            {/* Featured Badge */}
            <div className="flex items-center space-x-2 mb-6">
              <Badge className={`${colors.badge} text-sm font-medium px-3 py-1`}>
                <Sparkles className="h-3 w-3 mr-1.5 text-yellow-500 fill-yellow-500" />
                Featured • {categoryLabel}
              </Badge>
            </div>

            {/* Product Name - Dynamic Title */}
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{currentTool.name}</h2>
            
            {/* Description */}
            <p className="text-white/90 mb-6 text-lg">
              {currentTool.shortDescription || currentTool.description || "Premium AI tool access"}
            </p>

            {/* Plan Selection Toggle - Only show if at least one plan is enabled */}
            {((currentTool.sharedPlanEnabled && currentTool.privatePlanEnabled) || 
              (currentTool.sharedPlanEnabled && !currentTool.privatePlanEnabled) ||
              (!currentTool.sharedPlanEnabled && currentTool.privatePlanEnabled)) && (
              <div className="flex gap-2 mb-6 p-1 bg-white/10 rounded-lg">
                {currentTool.sharedPlanEnabled && (
                  <button
                    onClick={() => setSelectedPlan('shared')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedPlan === 'shared'
                        ? 'bg-white text-gray-900'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Shared Plan
                  </button>
                )}
                {currentTool.privatePlanEnabled && (
                  <button
                    onClick={() => setSelectedPlan('private')}
                    className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      selectedPlan === 'private'
                        ? 'bg-white text-gray-900'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Private Plan
                  </button>
                )}
              </div>
            )}

            {/* Dynamic Feature Badges from tool data */}
            <div className="flex flex-wrap gap-2 mb-8">
              {features.map((feature, idx) => (
                <Badge key={idx} className={`${colors.badge} text-sm font-medium px-3 py-1`}>
                  {feature}
                </Badge>
              ))}
            </div>

            {/* Dynamic Price based on selected plan - Professional Pricing */}
            <div className="mb-8">
              {displayPrice > 0 ? (
                <>
                  <div className="text-4xl font-bold text-white">
                    {formatPrice(displayPrice)}/month
                  </div>
                  {(currentTool.sharedPlanEnabled || currentTool.privatePlanEnabled) && (
                    <div className="text-sm text-white/70 mt-1">
                      {selectedPlan === 'shared' ? 'Shared' : 'Private'} plan pricing
                    </div>
                  )}
                </>
              ) : (
                <div className="text-2xl font-medium text-white/70">
                  Price not available
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Link
                href={`/tools/${currentTool.slug}`}
                className="px-6 py-3 rounded-lg bg-white border-2 border-black text-black font-medium transition-all duration-300 hover:bg-gray-100 hover:scale-105 flex items-center"
              >
                <span>View Details</span>
              </Link>
              <Link
                href={`/checkout/${currentTool.id}?plan=${selectedPlan}&duration=1month`}
                className={`px-6 py-3 rounded-lg ${colors.button} text-white font-semibold button-text-clear transition-all duration-300 hover:scale-105 shadow-lg flex items-center`}
              >
                <span className="mr-2">Add to Cart</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Side - Product Visual */}
          <div className="relative flex justify-center lg:justify-end items-center">
            {/* Decorative Stars */}
            <Star className="absolute top-0 right-0 h-16 w-16 text-yellow-400 fill-yellow-400 opacity-80" />
            <Star className="absolute bottom-0 left-0 h-16 w-16 text-yellow-400 fill-yellow-400 opacity-80" />
            
            {/* White Card with Icon */}
            <div className="relative bg-white rounded-xl p-4 sm:p-6 lg:p-8 shadow-2xl z-10">
              <div className="w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56 flex items-center justify-center">
                <ToolIcon icon={currentTool.icon} name={currentTool.name} size="2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Slider Controls */}
        {tools.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            {/* Previous Button */}
            <button
              onClick={goToPrevious}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {tools.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'w-8 bg-white'
                      : 'w-2 bg-white/50 hover:bg-white/75'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={goToNext}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
