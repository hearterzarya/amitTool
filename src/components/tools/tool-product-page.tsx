'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/utils';
import { 
  toNumber, 
  getBasePrice, 
  getOneMonthPrice, 
  getPriceForDuration,
  getEnabledDurations,
  calculateDiscountPercent,
  type PlanType,
  type Duration
} from '@/lib/price-utils';
import { 
  ShoppingCart, 
  CheckCircle2, 
  Star, 
  Share2, 
  Facebook, 
  Twitter, 
  ArrowRight
} from 'lucide-react';
import { ToolIcon } from './tool-icon';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ToolProductPageProps {
  tool: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string | null;
    category: string;
    icon: string | null;
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
    sharedPlanPrice: number | null;
    privatePlanPrice: number | null;
    sharedPlanFeatures: string | null;
    privatePlanFeatures: string | null;
    sharedPlanEnabled: boolean;
    privatePlanEnabled: boolean;
    isOutOfStock: boolean;
    subscriptions: Array<{ id: string }>;
  };
  relatedTools: Array<{
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    icon: string | null;
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
    sharedPlanPrice: number | null;
    privatePlanPrice: number | null;
    sharedPlanEnabled: boolean;
    privatePlanEnabled: boolean;
  }>;
  /** Canonical URL for sharing (from server to avoid hydration mismatch) */
  shareUrl: string;
}

export function ToolProductPageClient({ tool, relatedTools, shareUrl }: ToolProductPageProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedPlan, setSelectedPlan] = useState<'shared' | 'private'>(
    tool.sharedPlanEnabled ? 'shared' : 'private'
  );
  
  // Get enabled durations for the selected plan (recalculate when plan changes)
  const enabledDurations = getEnabledDurations(tool, selectedPlan);
  const defaultDuration = enabledDurations.length > 0 ? enabledDurations[0] : '1month';
  const [selectedDuration, setSelectedDuration] = useState<Duration>(defaultDuration);
  
  // Update selected duration when plan changes to ensure it's enabled
  useEffect(() => {
    const newEnabledDurations = getEnabledDurations(tool, selectedPlan);
    if (newEnabledDurations.length > 0 && !newEnabledDurations.includes(selectedDuration)) {
      setSelectedDuration(newEnabledDurations[0]);
    }
  }, [selectedPlan, tool, selectedDuration]);

  // Professional price calculation using validated utilities
  // Prices are stored in paise (e.g., 19900 = ₹199)
  // All prices are validated and filtered for corrupted data
  const basePrice = getBasePrice(tool, selectedPlan);
  const oneMonthPrice = getOneMonthPrice(tool, selectedPlan, basePrice);
  const finalPrice = getPriceForDuration(tool, selectedPlan, selectedDuration, oneMonthPrice);
  
  // Safety check: Ensure we have valid prices
  if (finalPrice <= 0 || oneMonthPrice <= 0) {
    console.error('Invalid prices detected for tool:', tool.name, {
      basePrice,
      oneMonthPrice,
      finalPrice,
      selectedPlan,
      selectedDuration,
    });
  }
  
  // Helper functions for component logic
  const getOneMonthPriceLocal = () => oneMonthPrice;
  const getPriceForDurationLocal = (duration: Duration) => 
    getPriceForDuration(tool, selectedPlan, duration, oneMonthPrice);

  const handleBuyNow = () => {
    if (!session) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/tools/${tool.slug}`)}`);
      return;
    }
    const params = new URLSearchParams({
      plan: selectedPlan,
      duration: selectedDuration,
    });
    router.push(`/checkout/${tool.id}?${params.toString()}`);
  };

  const shareText = `Check out ${tool.name} on Amit Techsolution`;

  const categoryLabels: Record<string, string> = {
    AI_WRITING: "AI Writing",
    SEO_TOOLS: "SEO & Marketing",
    DESIGN: "Design",
    PRODUCTIVITY: "Productivity",
    CODE_DEV: "Code & Dev",
    VIDEO_AUDIO: "Video & Audio",
    LEARNING: "Learning",
    MS_OFFICE_WINDOWS_KEY: "Ms Office & Windows Key",
    VPNS: "VPN's",
    SOFTWARES: "Softwares",
    OTHER: "Other",
  };

  const parseFeatures = (features: string | null) => {
    if (!features) return [];
    try {
      const parsed = JSON.parse(features);
      return Array.isArray(parsed) ? parsed : features.split(',').map((f: string) => f.trim());
    } catch {
      return features.split(',').map((f: string) => f.trim()).filter((f: string) => f.length > 0);
    }
  };

  const planFeatures = selectedPlan === 'shared' 
    ? parseFeatures(tool.sharedPlanFeatures)
    : parseFeatures(tool.privatePlanFeatures);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm">
          <Link href="/" className="text-purple-600 hover:text-purple-700">Home</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/tools" className="text-purple-600 hover:text-purple-700">Tools</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">{tool.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image/Icon - full width in container */}
          <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
            <div className="aspect-square w-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl mb-6 border border-purple-200 overflow-hidden">
              {tool.icon && (tool.icon.startsWith('/') || tool.icon.startsWith('http')) ? (
                <img
                  src={tool.icon}
                  alt={tool.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-8xl sm:text-9xl lg:text-[10rem] select-none">
                  {tool.icon || "🛠️"}
                </span>
              )}
            </div>
            {/* Social Share */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-200">
              <span className="text-sm text-slate-600 mr-2">Share:</span>
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share on Facebook"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                <a
                  href={`https://x.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share on Twitter"
                >
                  <Twitter className="h-4 w-4 text-slate-700" />
                </a>
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share on WhatsApp"
                >
                  <WhatsAppIcon size={16} className="text-[#25D366]" />
                </a>
              </Button>
            </div>
          </div>

          {/* Product Details & Purchase Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 sticky top-24 h-fit">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[tool.category] || tool.category}
                </Badge>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-4 w-4 fill-yellow-500" />
                  <span className="text-sm font-medium">4.9</span>
                </div>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3 leading-tight">{tool.name}</h1>
              {tool.shortDescription && (
                <p className="text-slate-600 text-base leading-relaxed mb-4">{tool.shortDescription}</p>
              )}
            </div>

            {/* Price Display - Professional */}
            <div className="mb-6 p-5 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
              <div className="flex items-baseline gap-3 mb-2">
                {finalPrice > 0 ? (
                  <span className="text-4xl font-bold text-purple-600">
                    {formatPrice(finalPrice)}
                  </span>
                ) : (
                  <span className="text-2xl font-bold text-red-600">
                    Price not available
                  </span>
                )}
                {selectedDuration !== '1month' && (() => {
                  const originalPrice = oneMonthPrice * (selectedDuration === '3months' ? 3 : selectedDuration === '6months' ? 6 : 12);
                  return (
                    <span className="text-lg text-slate-500 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-600">
                  {selectedDuration === '1month' ? 'per month' :
                   selectedDuration === '3months' ? 'for 3 months' :
                   selectedDuration === '6months' ? 'for 6 months' :
                   'for 1 year'}
                </span>
                {selectedDuration !== '1month' && (() => {
                  const originalPrice = oneMonthPrice * (selectedDuration === '3months' ? 3 : selectedDuration === '6months' ? 6 : 12);
                  const savings = originalPrice - finalPrice;
                  if (savings > 0) {
                    return (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Save {formatPrice(savings)}
                      </Badge>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            {/* Out of Stock Warning */}
            {tool.isOutOfStock && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 font-medium">⚠️ Currently Out of Stock</p>
                <p className="text-red-600 text-sm mt-1">This product is temporarily unavailable</p>
              </div>
            )}

            {/* Plan Selection */}
            {tool.sharedPlanEnabled && tool.privatePlanEnabled && (
              <div className="mb-6">
                <Label className="mb-3 block text-sm font-semibold text-slate-700">Select Plan</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedPlan('shared')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPlan === 'shared'
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-slate-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">Shared Plan</div>
                    <div className="text-xs text-slate-600">Instant Access</div>
                  </button>
                  <button
                    onClick={() => setSelectedPlan('private')}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPlan === 'private'
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-slate-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 mb-1">Private Plan</div>
                    <div className="text-xs text-slate-600">Dedicated Account</div>
                  </button>
                </div>
              </div>
            )}

            {/* Duration Selection */}
            <div className="mb-6">
              <Label className="mb-3 block text-sm font-semibold text-slate-700">Subscription Duration</Label>
              <Select
                value={selectedDuration}
                onValueChange={(value: '1month' | '3months' | '6months' | '1year') => {
                  setSelectedDuration(value);
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue>
                    {selectedDuration === '1month' && `1 Month - ${formatPrice(getPriceForDurationLocal('1month'))}`}
                    {selectedDuration === '3months' && `3 Months - ${formatPrice(getPriceForDurationLocal('3months'))}`}
                    {selectedDuration === '6months' && `6 Months - ${formatPrice(getPriceForDurationLocal('6months'))}`}
                    {selectedDuration === '1year' && `1 Year - ${formatPrice(getPriceForDurationLocal('1year'))}`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {enabledDurations.includes('1month') && (
                    <SelectItem value="1month">
                      <div className="flex items-center justify-between w-full">
                        <span>1 Month</span>
                        <span className="text-slate-600 ml-4">{formatPrice(getPriceForDurationLocal('1month'))}</span>
                      </div>
                    </SelectItem>
                  )}
                  {enabledDurations.includes('3months') && (
                    <SelectItem value="3months">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span>3 Months</span>
                          {(() => {
                            const threeMonthPrice = getPriceForDurationLocal('3months');
                            const originalPrice = oneMonthPrice * 3;
                            const savingsPercent = calculateDiscountPercent(originalPrice, threeMonthPrice);
                            if (savingsPercent > 0) {
                              return <Badge variant="outline" className="ml-2 text-xs">Save {savingsPercent}%</Badge>;
                            }
                            return null;
                          })()}
                        </div>
                        <span className="text-slate-600 ml-4">{formatPrice(getPriceForDurationLocal('3months'))}</span>
                      </div>
                    </SelectItem>
                  )}
                  {enabledDurations.includes('6months') && (
                    <SelectItem value="6months">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span>6 Months</span>
                          {(() => {
                            const sixMonthPrice = getPriceForDurationLocal('6months');
                            const originalPrice = oneMonthPrice * 6;
                            const savingsPercent = calculateDiscountPercent(originalPrice, sixMonthPrice);
                            if (savingsPercent > 0) {
                              return <Badge variant="outline" className="ml-2 text-xs">Save {savingsPercent}%</Badge>;
                            }
                            return null;
                          })()}
                        </div>
                        <span className="text-slate-600 ml-4">{formatPrice(getPriceForDurationLocal('6months'))}</span>
                      </div>
                    </SelectItem>
                  )}
                  {enabledDurations.includes('1year') && (
                    <SelectItem value="1year">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <span>1 Year</span>
                          {(() => {
                            const oneYearPrice = getPriceForDurationLocal('1year');
                            const originalPrice = oneMonthPrice * 12;
                            const savingsPercent = calculateDiscountPercent(originalPrice, oneYearPrice);
                            if (savingsPercent > 0) {
                              return <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-300">Save {savingsPercent}%</Badge>;
                            }
                            return null;
                          })()}
                        </div>
                        <span className="text-slate-600 ml-4">{formatPrice(getPriceForDurationLocal('1year'))}</span>
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>


            {/* Features */}
            {planFeatures.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-slate-900">What's Included:</h3>
                <ul className="space-y-2.5">
                  {planFeatures.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700 leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <Button
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white button-text-clear shadow-lg hover:shadow-xl transition-all"
                onClick={handleBuyNow}
                disabled={tool.isOutOfStock || finalPrice <= 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {finalPrice > 0 ? `Buy Now - ${formatPrice(finalPrice)}` : 'Price Not Available'}
              </Button>
              {!session && (
                <p className="text-sm text-center text-slate-600">
                  <Link href="/login" className="text-purple-600 hover:underline font-medium">
                    Sign in
                  </Link>
                  {' '}or{' '}
                  <Link href="/register" className="text-purple-600 hover:underline font-medium">
                    create an account
                  </Link>
                  {' '}to purchase
                </p>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Original access with latest features</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Secure payment & instant activation</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>24/7 customer support</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Works on PC/Mac (Desktop only)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Description Section */}
        {tool.description && (
          <Card className="mb-12 border-slate-200 shadow-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-slate-900">Product Details</h2>
              <div 
                className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: tool.description.replace(/\n/g, '<br />') }}
              />
            </CardContent>
          </Card>
        )}

        {/* Related Products */}
        {relatedTools.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedTools.map((relatedTool) => {
                const sharedBase = getBasePrice(relatedTool, 'shared');
                const privateBase = getBasePrice(relatedTool, 'private');
                const sharedOne = getOneMonthPrice(relatedTool, 'shared', sharedBase);
                const privateOne = getOneMonthPrice(relatedTool, 'private', privateBase);
                const hasPrice = sharedOne > 0 || privateOne > 0;
                return (
                  <Link
                    key={relatedTool.id}
                    href={`/tools/${relatedTool.slug}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-center h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-4">
                        <ToolIcon icon={relatedTool.icon} name={relatedTool.name} size="lg" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{relatedTool.name}</h3>
                      {relatedTool.shortDescription && (
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {relatedTool.shortDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        {hasPrice ? (
                          <div className="flex flex-wrap gap-1.5">
                            {sharedOne > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Shared: {formatPrice(sharedOne)}/mo
                              </Badge>
                            )}
                            {privateOne > 0 && (
                              <Badge variant="outline" className="text-xs">
                                Private: {formatPrice(privateOne)}/mo
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">Price not set</span>
                        )}
                        <Button size="sm" variant="outline">
                          View <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
