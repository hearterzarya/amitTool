'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, X, Tag } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { brand } from '@/lib/brand';
import { useContactInfo } from '@/components/providers/contact-info-provider';
import { ToolIcon } from '@/components/tools/tool-icon';

interface BundleTool {
  id: string;
  tool: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
}

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
  imageUrl?: string | null;
  tools: BundleTool[];
}

interface BundleCheckoutClientProps {
  bundle: Bundle;
}

interface PaymentLinks {
  upiIntent: string;
  phonePe: string;
  paytm: string;
  gpay: string;
  dynamicQR: string;
}

export function BundleCheckoutClient({ bundle }: BundleCheckoutClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const contactInfo = useContactInfo();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'sixMonth' | 'yearly'>('monthly');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinks | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [merchantReferenceId, setMerchantReferenceId] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const prevPlanRef = useRef<'monthly' | 'sixMonth' | 'yearly'>('monthly');

  useEffect(() => {
    if (session?.user) {
      setCustomerName(session.user.name || '');
      setCustomerEmail(session.user.email || '');
    }
  }, [session]);

  // Poll payment status
  useEffect(() => {
    if (!merchantReferenceId || paymentStatus !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        setCheckingStatus(true);
        const response = await fetch('/api/payments/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantReferenceId }),
        });

        const data = await response.json();
        
        if (data.success && data.payment.status === 'SUCCESS') {
          setPaymentStatus('success');
          clearInterval(interval);
          setTimeout(() => {
            router.push(`/payment/success?ref=${merchantReferenceId}`);
          }, 2000);
        } else if (data.success && data.payment.status === 'FAILED') {
          setPaymentStatus('failed');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setCheckingStatus(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [merchantReferenceId, paymentStatus, router]);

  // Revalidate coupon when plan changes (must be before any early return)
  useEffect(() => {
    const planChanged = prevPlanRef.current !== selectedPlan;
    prevPlanRef.current = selectedPlan;
    if (!appliedCoupon?.coupon?.code || planChanged === false) return;
    const basePriceForCoupon = (() => {
      const toNumber = (v: number | bigint | null | undefined): number =>
        !v ? 0 : typeof v === 'bigint' ? Number(v) : v;
      const priceMonthly = toNumber(bundle.priceMonthly);
      switch (selectedPlan) {
        case 'sixMonth': {
          const p = toNumber(bundle.priceSixMonth);
          return p > 0 ? p : priceMonthly * 6;
        }
        case 'yearly': {
          const p = toNumber(bundle.priceYearly);
          return p > 0 ? p : priceMonthly * 12;
        }
        default:
          return priceMonthly;
      }
    })();
    if (basePriceForCoupon <= 0) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: appliedCoupon.coupon.code,
            amount: Math.floor(basePriceForCoupon),
          }),
        });
        if (cancelled) return;
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setAppliedCoupon(data);
            setCouponError('');
          } else {
            setAppliedCoupon(null);
            setCouponCode('');
            setCouponError(data.error || 'Coupon is no longer valid for this purchase');
          }
        }
      } catch (error) {
        if (!cancelled) console.error('Error revalidating coupon:', error);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedPlan, appliedCoupon, bundle.priceMonthly, bundle.priceSixMonth, bundle.priceYearly]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push(`/login?redirect=/checkout/bundle/${bundle.id}`);
    return null;
  }

  // Professional price calculation with BigInt handling
  const getPrice = (): number => {
    // Helper to safely convert BigInt to number
    const toNumber = (value: number | bigint | null | undefined): number => {
      if (!value) return 0;
      return typeof value === 'bigint' ? Number(value) : value;
    };

    const priceMonthly = toNumber(bundle.priceMonthly);
    
    switch (selectedPlan) {
      case 'sixMonth': {
        const priceSixMonth = toNumber(bundle.priceSixMonth);
        return priceSixMonth > 0 ? priceSixMonth : priceMonthly * 6;
      }
      case 'yearly': {
        const priceYearly = toNumber(bundle.priceYearly);
        return priceYearly > 0 ? priceYearly : priceMonthly * 12;
      }
      default:
        return priceMonthly;
    }
  };

  // Get base price (before coupon discount)
  const basePrice = getPrice();
  
  // Apply coupon discount if available
  let finalPrice = basePrice;
  if (appliedCoupon && appliedCoupon.discountAmount && appliedCoupon.discountAmount > 0) {
    finalPrice = basePrice - appliedCoupon.discountAmount;
    if (finalPrice < 0) finalPrice = 0; // Can't be negative
  }

  // Handle coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');

    try {
      const amountInPaise = Math.floor(basePrice);
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          amount: amountInPaise,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setAppliedCoupon(data);
        setCouponError('');
        console.log('Coupon applied successfully:', data);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Failed to validate coupon. Please try again.');
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPaymentStatus('idle');

    // Validate required fields
    if (!customerName || !customerEmail || !customerMobile) {
      alert('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate mobile number (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    const cleanMobile = customerMobile.replace(/\D/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      alert('Please enter a valid 10-digit mobile number');
      setLoading(false);
      return;
    }

    try {
      // Get final price (after coupon discount) in paise
      const priceInPaise = finalPrice;
      
      // Validate price
      if (priceInPaise <= 0) {
        alert('Invalid price. Please contact support.');
        setLoading(false);
        return;
      }

      // Convert from paise to rupees for payment API
      const priceInRupees = priceInPaise / 100;

      // Validate minimum amount (₹1)
      if (priceInRupees < 1) {
        alert('Amount too small. Minimum payment is ₹1');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId: bundle.id,
          planName: `${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} Plan`,
          amount: priceInRupees, // Send in rupees, not paise
          couponId: appliedCoupon?.coupon?.id || null,
          discountAmount: appliedCoupon?.discountAmount ? appliedCoupon.discountAmount / 100 : 0, // Convert from paise to rupees
          customerName,
          customerEmail,
          customerMobile: cleanMobile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setPaymentLinks(data.payment.paymentLinks);
        setMerchantReferenceId(data.payment.merchantReferenceId);
        setPaymentStatus('pending');
        // Scroll to payment options
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setPaymentStatus('failed');
        alert(data.error || 'Failed to create payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating payment:', error);
      setPaymentStatus('failed');
      const errorMessage = error.message || 'An error occurred. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const parseFeatures = (features: string | null | undefined) => {
    if (!features) return [];
    return features.split(/\n|,/).map(f => f.trim()).filter(f => f.length > 0);
  };

  const features = parseFeatures(bundle.features);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Bundle Info */}
          <div className="lg:col-span-2">
            <Card className="mb-6 overflow-hidden p-0">
              {/* Full-width bundle image at top */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-purple-100 to-blue-100 overflow-hidden">
                {bundle.imageUrl ? (
                  <img
                    src={bundle.imageUrl}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl sm:text-8xl">
                    {bundle.icon || "📦"}
                  </div>
                )}
              </div>
              <CardHeader className="pt-5 pb-2">
                <CardTitle className="text-2xl sm:text-3xl">{bundle.name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {bundle.shortDescription || bundle.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                {features.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Bundle Features:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-700">
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bundle.tools.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Included Tools:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {bundle.tools.map((bundleTool) => (
                        <div
                          key={bundleTool.id}
                          className="flex flex-col items-center p-4 rounded-lg bg-slate-50 border border-slate-200"
                        >
                          <ToolIcon
                            icon={bundleTool.tool.icon}
                            name={bundleTool.tool.name}
                            size="lg"
                          />
                          <span className="text-sm font-medium text-slate-700 mt-2 text-center">
                            {bundleTool.tool.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Checkout Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                <CardDescription>Select your plan and complete payment</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Plan Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Select Plan
                  </label>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPlan('monthly')}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        selectedPlan === 'monthly'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="font-semibold">Monthly</div>
                      <div className="text-sm text-slate-600">
                        {formatPrice(bundle.priceMonthly)}/month
                      </div>
                    </button>
                    {bundle.priceSixMonth && (
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('sixMonth')}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          selectedPlan === 'sixMonth'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="font-semibold">6-Month</div>
                        <div className="text-sm text-slate-600">
                          {formatPrice(bundle.priceSixMonth)} (Save {Math.round((1 - (typeof bundle.priceSixMonth === 'bigint' ? Number(bundle.priceSixMonth) : bundle.priceSixMonth || 0) / ((typeof bundle.priceMonthly === 'bigint' ? Number(bundle.priceMonthly) : bundle.priceMonthly) * 6)) * 100)}%)
                        </div>
                      </button>
                    )}
                    {bundle.priceYearly && (
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('yearly')}
                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                          selectedPlan === 'yearly'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="font-semibold">Yearly</div>
                        <div className="text-sm text-slate-600">
                          {formatPrice(bundle.priceYearly)} (Save {Math.round((1 - (typeof bundle.priceYearly === 'bigint' ? Number(bundle.priceYearly) : bundle.priceYearly || 0) / ((typeof bundle.priceMonthly === 'bigint' ? Number(bundle.priceMonthly) : bundle.priceMonthly) * 12)) * 100)}%)
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Details Form */}
                {paymentStatus === 'idle' && (
                  <form onSubmit={handleCreatePayment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={contactInfo.supportPhone}
                      />
                    </div>

                    {/* Coupon Code Section */}
                    <div className="pt-4 border-t border-slate-200">
                      {!showCouponInput && !appliedCoupon && (
                        <button
                          type="button"
                          onClick={() => setShowCouponInput(true)}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium mb-4"
                        >
                          Have a coupon code? Click here
                        </button>
                      )}
                      
                      {showCouponInput && !appliedCoupon && (
                        <div className="mb-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="Enter coupon code"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                              disabled={validatingCoupon}
                            />
                            <Button
                              type="button"
                              onClick={handleApplyCoupon}
                              disabled={validatingCoupon || !couponCode.trim()}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {validatingCoupon ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Apply'
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowCouponInput(false);
                                setCouponCode('');
                                setCouponError('');
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {couponError && (
                            <p className="text-red-600 text-xs mt-2">{couponError}</p>
                          )}
                        </div>
                      )}
                      
                      {appliedCoupon && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                Coupon: {appliedCoupon.coupon.code}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveCoupon}
                              className="h-6 w-6 p-0 text-green-700 hover:text-green-900"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            Discount: {formatPrice(appliedCoupon.discountAmount)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-700">Subtotal:</span>
                          <span className="text-slate-900 font-medium">
                            {formatPrice(basePrice)}
                          </span>
                        </div>
                        {appliedCoupon && appliedCoupon.discountAmount > 0 && (
                          <div className="flex justify-between items-center text-sm text-green-600">
                            <span>Coupon Discount ({appliedCoupon.coupon.code}):</span>
                            <span className="font-medium">
                              -{formatPrice(appliedCoupon.discountAmount)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="text-lg font-semibold text-slate-900">Total</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {formatPrice(finalPrice)}
                        </span>
                      </div>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold button-text-clear"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Proceed to Payment
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Payment Links */}
                {paymentStatus === 'pending' && paymentLinks && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-4">
                        Choose your preferred payment method:
                      </p>
                      <div className="space-y-2">
                        {paymentLinks.upiIntent && (
                          <a
                            href={paymentLinks.upiIntent}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center font-medium transition-colors"
                          >
                            Pay via UPI
                          </a>
                        )}
                        {paymentLinks.phonePe && (
                          <a
                            href={paymentLinks.phonePe}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-center font-medium transition-colors"
                          >
                            Pay via PhonePe
                          </a>
                        )}
                        {paymentLinks.paytm && (
                          <a
                            href={paymentLinks.paytm}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-center font-medium transition-colors"
                          >
                            Pay via Paytm
                          </a>
                        )}
                        {paymentLinks.gpay && (
                          <a
                            href={paymentLinks.gpay}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-center font-medium transition-colors"
                          >
                            Pay via Google Pay
                          </a>
                        )}
                        {paymentLinks.dynamicQR && (
                          <div className="mt-4">
                            <p className="text-sm text-slate-600 mb-2">Or scan QR code:</p>
                            <img
                              src={paymentLinks.dynamicQR}
                              alt="Payment QR Code"
                              className="w-full rounded-lg border border-slate-200"
                            />
                          </div>
                        )}
                      </div>
                      {checkingStatus && (
                        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-600">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Checking payment status...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {paymentStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-800 font-medium">Payment Successful!</p>
                    <p className="text-sm text-green-600 mt-1">Redirecting...</p>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-red-800 font-medium">Payment Failed</p>
                    <p className="text-sm text-red-600 mt-1">Please try again.</p>
                    <Button
                      onClick={() => {
                        setPaymentStatus('idle');
                        setPaymentLinks(null);
                      }}
                      className="mt-4 w-full"
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
