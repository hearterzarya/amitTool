'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Bundle {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  priceMonthly: number;
  priceSixMonth?: number | null;
  priceYearly?: number | null;
  features?: string | null;
  icon?: string | null;
}

interface TrendingBundlesSliderProps {
  bundles: Bundle[];
}

export function TrendingBundlesSlider({ bundles }: TrendingBundlesSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play slider
  useEffect(() => {
    if (!isAutoPlaying || bundles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bundles.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, bundles.length]);

  if (bundles.length === 0) return null;

  const currentBundle = bundles[currentIndex];
  
  // Parse features
  const parseFeatures = (features: string | null | undefined) => {
    if (!features) return [];
    return features.split(/\n|,/).map(f => f.trim()).filter(f => f.length > 0).slice(0, 4);
  };

  const features = parseFeatures(currentBundle.features);
  const displayPrice = currentBundle.priceMonthly;

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + bundles.length) % bundles.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bundles.length);
    setIsAutoPlaying(false);
  };

  // Color schemes for different bundles
  const colorSchemes = [
    { bg: 'from-purple-600 via-pink-500 to-indigo-600', badge: 'bg-white/20 backdrop-blur-sm border-white/30 text-white font-semibold', button: 'bg-gradient-to-r from-purple-600 to-pink-600' },
    { bg: 'from-blue-600 via-cyan-500 to-teal-600', badge: 'bg-white/20 backdrop-blur-sm border-white/30 text-white font-semibold', button: 'bg-gradient-to-r from-blue-600 to-cyan-600' },
    { bg: 'from-pink-600 via-rose-500 to-orange-600', badge: 'bg-white/20 backdrop-blur-sm border-white/30 text-white font-semibold', button: 'bg-gradient-to-r from-pink-600 to-rose-600' },
    { bg: 'from-green-600 via-emerald-500 to-teal-600', badge: 'bg-white/20 backdrop-blur-sm border-white/30 text-white font-semibold', button: 'bg-gradient-to-r from-green-600 to-emerald-600' },
    { bg: 'from-indigo-600 via-purple-500 to-blue-600', badge: 'bg-white/20 backdrop-blur-sm border-white/30 text-white font-semibold', button: 'bg-gradient-to-r from-indigo-600 to-purple-600' },
  ];

  const colors = colorSchemes[currentIndex % colorSchemes.length];

  return (
    <div className="mb-12 animate-fade-in-up relative overflow-hidden rounded-xl">
      {/* Dynamic background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      
      <div className="relative p-8 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Content */}
          <div className="relative z-10">
            {/* Trending Badge */}
            <div className="flex items-center space-x-2 mb-6">
              <Badge className={`${colors.badge} text-sm font-medium px-3 py-1`}>
                <Sparkles className="h-3 w-3 mr-1.5 text-yellow-500 fill-yellow-500" />
                Trending Bundle
              </Badge>
            </div>

            {/* Bundle Name */}
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">{currentBundle.name}</h2>
            
            {/* Description */}
            <p className="text-white/90 mb-6 text-lg">
              {currentBundle.shortDescription || currentBundle.description || "Premium bundle access"}
            </p>

            {/* Features */}
            {features.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {features.map((feature, idx) => (
                  <Badge key={idx} className={`${colors.badge} text-sm font-medium px-3 py-1`}>
                    {feature}
                  </Badge>
                ))}
              </div>
            )}

            {/* Price */}
            <div className="mb-8">
              <div className="text-4xl font-bold text-white">
                {formatPrice(displayPrice)}/month
              </div>
              {(currentBundle.priceSixMonth || currentBundle.priceYearly) && (
                <div className="text-sm text-white/70 mt-1">
                  {currentBundle.priceSixMonth && `6-Month: ${formatPrice(currentBundle.priceSixMonth)} • `}
                  {currentBundle.priceYearly && `Yearly: ${formatPrice(currentBundle.priceYearly)}`}
                </div>
              )}
            </div>

            {/* Buy Now Button */}
            <Link
              href={`/checkout/bundle/${currentBundle.id}`}
              className={`inline-block px-8 py-4 rounded-lg ${colors.button} hover:opacity-90 text-white font-bold button-text-clear transition-all duration-300 hover:scale-105 shadow-lg`}
            >
              Buy Now
            </Link>
          </div>

          {/* Right Side - Icon/Visual */}
          <div className="relative flex justify-center lg:justify-end items-center">
            <div className="relative bg-white rounded-xl p-8 shadow-2xl z-10">
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="text-7xl">
                  {currentBundle.icon || "📦"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slider Controls */}
        {bundles.length > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={goToPrevious}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {bundles.map((_, index) => (
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
