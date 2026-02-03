'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  CreditCard, 
  Smartphone, 
  QrCode, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  ArrowLeft,
  ExternalLink,
  Star,
  Tag,
  RefreshCw,
  X,
  Plus,
  Minus,
  ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import { ToolCategory } from '@prisma/client';
import { QRCodeSVG } from 'qrcode.react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentLinks {
  upiIntent: string;
  phonePe: string;
  paytm: string;
  gpay: string;
  dynamicQR: string;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  category: ToolCategory;
  icon?: string | null;
  toolUrl: string;
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
  isActive: boolean;
}

interface ToolCheckoutClientProps {
  tool: Tool;
  initialPlan?: 'shared' | 'private';
  initialDuration?: '1month' | '3months' | '6months' | '1year';
  initialCouponId?: string;
}

const categoryLabels: Record<ToolCategory, string> = {
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

export function ToolCheckoutClient({ 
  tool, 
  initialPlan,
  initialDuration,
  initialCouponId 
}: ToolCheckoutClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinks | null>(null);
  const [merchantReferenceId, setMerchantReferenceId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Plan selection
  const getDefaultPlan = (): 'shared' | 'private' => {
    if (initialPlan) return initialPlan;
    if (tool.sharedPlanEnabled) return 'shared';
    if (tool.privatePlanEnabled) return 'private';
    return 'shared';
  };
  const [selectedPlan, setSelectedPlan] = useState<'shared' | 'private'>(getDefaultPlan());
  
  // Prevent plan change if plan is provided in URL
  const isPlanLocked = !!initialPlan;
  
  // Get enabled durations for the selected plan
  const enabledDurations = getEnabledDurations(tool, selectedPlan);
  const defaultDuration = enabledDurations.length > 0 
    ? (enabledDurations.includes(initialDuration as Duration) ? initialDuration as Duration : enabledDurations[0])
    : '1month';
  
  // Duration selection
  const [selectedDuration, setSelectedDuration] = useState<'1month' | '3months' | '6months' | '1year'>(
    defaultDuration
  );
  
  // Update selected duration when plan changes to ensure it's enabled
  useEffect(() => {
    const newEnabledDurations = getEnabledDurations(tool, selectedPlan);
    if (newEnabledDurations.length > 0 && !newEnabledDurations.includes(selectedDuration)) {
      setSelectedDuration(newEnabledDurations[0]);
    }
  }, [selectedPlan, tool, selectedDuration]);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Load and validate initial coupon if provided from product page (runs once on mount)
  useEffect(() => {
    if (initialCouponId && !appliedCoupon) {
      // Fetch coupon details and validate it
      const loadAndValidateCoupon = async () => {
        try {
          console.log('Loading coupon from product page:', initialCouponId);
          
          // First, get coupon details
          const couponRes = await fetch(`/api/admin/coupons/${initialCouponId}`);
          if (!couponRes.ok) {
            console.error('Failed to fetch coupon:', couponRes.status);
            return;
          }
          
          const couponData = await couponRes.json();
          
          if (couponData.coupon) {
            console.log('Coupon found:', couponData.coupon.code);
            
            // Calculate current price based on selected plan and duration (use duration-specific prices if available)
            const currentBasePrice = getBasePrice(tool, selectedPlan);
            const currentOneMonthPrice = getOneMonthPrice(tool, selectedPlan, currentBasePrice);
            const currentPrice = getPriceForDuration(tool, selectedPlan, selectedDuration, currentOneMonthPrice);
            const amountInPaise = Math.floor(currentPrice);
            
            console.log('Validating coupon with amount:', amountInPaise, 'paise');
            
            // Validate coupon with current price
            const validateRes = await fetch('/api/coupons/validate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                code: couponData.coupon.code,
                amount: amountInPaise,
              }),
            });
            
            if (validateRes.ok) {
              const validateData = await validateRes.json();
              console.log('Coupon validation result:', validateData);
              
              if (validateData.valid) {
                console.log('✅ Coupon applied successfully:', {
                  code: validateData.coupon.code,
                  discountAmount: validateData.discountAmount,
                  originalAmount: validateData.originalAmount,
                  finalAmount: validateData.finalAmount
                });
                setAppliedCoupon(validateData);
                setCouponCode(couponData.coupon.code);
                setCouponError('');
              } else {
                console.error('❌ Coupon validation failed:', validateData.error);
                setCouponError(validateData.error || 'Coupon is not valid for this purchase');
              }
            } else {
              const errorData = await validateRes.json().catch(() => ({ error: 'Failed to validate coupon' }));
              console.error('❌ Coupon validation error:', errorData);
              setCouponError(errorData.error || 'Failed to validate coupon');
            }
          } else {
            console.error('Coupon data not found in response');
          }
        } catch (error) {
          console.error('Error loading coupon:', error);
          setCouponError('Failed to load coupon. Please try again.');
        }
      };
      
      // Small delay to ensure component is fully mounted
      const timeoutId = setTimeout(loadAndValidateCoupon, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [initialCouponId]); // Only run when initialCouponId changes, not on plan/duration changes
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  // Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      setCustomerName(session.user.name || '');
      setCustomerEmail(session.user.email || '');
    }
  }, [session]);

  // Handle unauthenticated state with useEffect to avoid setState during render
  // This must be called before any early returns to maintain hook order
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=/checkout/${tool.id}`);
    }
  }, [status, router, tool.id]);

  // Poll payment status - Improved with better error handling and UI updates
  useEffect(() => {
    if (!merchantReferenceId || !paymentCreated) return;
    
    // Don't poll if already successful or failed
    if (paymentStatus === 'success' || paymentStatus === 'failed') {
      return;
    }

    let pollCount = 0;
    const maxPolls = 100; // Maximum 5 minutes (100 * 3 seconds)

    const interval = setInterval(async () => {
      pollCount++;
      
      // Stop polling after max attempts
      if (pollCount > maxPolls) {
        clearInterval(interval);
        setCheckingStatus(false);
        return;
      }

      try {
        setCheckingStatus(true);
        const response = await fetch('/api/payments/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantReferenceId }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.payment) {
          const status = data.payment.status || data.payment.txnStatus;
          
          if (status === 'SUCCESS') {
          setPaymentStatus('success');
            setCheckingStatus(false);
          clearInterval(interval);
            
            // Show success message and redirect after 3 seconds
          setTimeout(() => {
            router.push(`/payment/success?ref=${merchantReferenceId}`);
            }, 3000);
          } else if (status === 'FAILED' || status === 'EXPIRED') {
          setPaymentStatus('failed');
            setCheckingStatus(false);
          clearInterval(interval);
          }
          // If still PENDING, continue polling
        } else {
          console.error('Payment status check failed:', data.error);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Continue polling on error (might be temporary network issue)
        setCheckingStatus(false);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [merchantReferenceId, paymentCreated, paymentStatus, router]);

  // Quantity state (for display purposes, subscriptions are typically 1)
  // Must be declared before early returns to maintain hook order
  const [quantity, setQuantity] = useState(1);

  // Redirect if not authenticated - early returns after all hooks
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Professional price calculation using validated utilities
  // Prices are stored in paise (e.g., 19900 = ₹199)
  // All prices are validated and filtered for corrupted data
  const basePrice = getBasePrice(tool, selectedPlan);
  const oneMonthPrice = getOneMonthPrice(tool, selectedPlan, basePrice);
  const planPrice = getPriceForDuration(tool, selectedPlan, selectedDuration, oneMonthPrice);
  
  // Safety check: Ensure we have valid prices before proceeding
  if (planPrice <= 0 || oneMonthPrice <= 0) {
    console.error('Invalid prices detected for tool:', tool.name, {
      basePrice,
      oneMonthPrice,
      planPrice,
      selectedPlan,
      selectedDuration,
    });
  }
  
  // Helper functions for component logic
  const getOneMonthPriceLocal = () => oneMonthPrice;
  const getPriceForDurationLocal = (duration: Duration) => 
    getPriceForDuration(tool, selectedPlan, duration, oneMonthPrice);

  // Revalidate coupon when plan or duration changes (if coupon is already applied)
  // This runs separately from initial coupon loading
  const prevPlanRef = useRef(selectedPlan);
  const prevDurationRef = useRef(selectedDuration);
  
  useEffect(() => {
    // Only revalidate if plan or duration actually changed (not on initial mount)
    const planChanged = prevPlanRef.current !== selectedPlan;
    const durationChanged = prevDurationRef.current !== selectedDuration;
    
    if (appliedCoupon?.coupon?.code && planPrice > 0 && (planChanged || durationChanged)) {
      console.log('Plan or duration changed, revalidating coupon...');
      
      const revalidateCoupon = async () => {
        try {
          const amountInPaise = Math.floor(planPrice);
          console.log('Revalidating coupon with new amount:', amountInPaise);
          
          const response = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: appliedCoupon.coupon.code,
              amount: amountInPaise,
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.valid) {
              console.log('Coupon revalidated successfully, new discount:', data.discountAmount);
              setAppliedCoupon(data);
              setCouponError('');
            } else {
              console.log('Coupon no longer valid:', data.error);
              // Coupon no longer valid, remove it
              setAppliedCoupon(null);
              setCouponCode('');
              setCouponError(data.error || 'Coupon is no longer valid for this purchase');
            }
          }
        } catch (error) {
          console.error('Error revalidating coupon:', error);
        }
      };
      
      // Small delay to avoid too many requests
      const timeoutId = setTimeout(revalidateCoupon, 500);
      return () => clearTimeout(timeoutId);
    }
    
    // Update refs
    prevPlanRef.current = selectedPlan;
    prevDurationRef.current = selectedDuration;
  }, [selectedPlan, selectedDuration, planPrice, appliedCoupon]);

  // Apply coupon discount if available (per unit)
  let finalPricePerUnit = planPrice;
  if (appliedCoupon && appliedCoupon.discountAmount && appliedCoupon.discountAmount > 0) {
    finalPricePerUnit = planPrice - appliedCoupon.discountAmount;
    if (finalPricePerUnit < 0) finalPricePerUnit = 0; // Can't be negative
  }
  
  // Final price with quantity (for display and payment)
  const finalPrice = finalPricePerUnit * quantity;

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use first name + last name if available, otherwise use full name
    const fullName = (customerFirstName && customerLastName) 
      ? `${customerFirstName} ${customerLastName}`.trim()
      : customerName || `${customerFirstName} ${customerLastName}`.trim();
    
    if (!customerEmail || !customerMobile || !fullName) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate mobile number (Indian format)
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(customerMobile.replace(/\D/g, ''))) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      // Calculate amount (finalPrice already includes quantity)
      const amount = finalPrice / 100; // Convert from paise to rupees
      
      console.log('Creating payment:', {
        toolId: tool.id,
        plan: selectedPlan,
        duration: selectedDuration,
        quantity: quantity,
        basePrice,
        planPrice,
        discountAmount: appliedCoupon?.discountAmount || 0,
        finalPricePerUnit: finalPricePerUnit,
        finalPrice: finalPrice,
        amountInRupees: amount,
        couponId: appliedCoupon?.coupon?.id,
      });
      
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          planName: selectedPlan === 'shared' ? 'Shared Plan' : 'Private Plan',
          planType: selectedPlan === 'shared' ? 'SHARED' : 'PRIVATE',
          duration: selectedDuration,
          amount,
          couponId: appliedCoupon?.coupon?.id,
          discountAmount: appliedCoupon ? appliedCoupon.discountAmount / 100 : 0,
          customerName,
          customerEmail,
          customerMobile: customerMobile.replace(/\D/g, ''),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentLinks(data.payment.paymentLinks);
        setMerchantReferenceId(data.payment.merchantReferenceId);
        setPaymentCreated(true);
        setPaymentStatus('pending'); // Ensure status is set to pending for polling
        // Scroll to payment options
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || 'Failed to create payment');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUPIPayment = (link: string) => {
    if (link) {
      window.open(link, '_blank');
      // Reset checking status to show polling immediately
      setCheckingStatus(true);
    }
  };

  // Manual refresh payment status
  const handleRefreshStatus = async () => {
    if (!merchantReferenceId) return;
    
    setCheckingStatus(true);
    try {
      const response = await fetch('/api/payments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantReferenceId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.payment) {
        const status = data.payment.status || data.payment.txnStatus;
        
        if (status === 'SUCCESS') {
          setPaymentStatus('success');
          setTimeout(() => {
            router.push(`/payment/success?ref=${merchantReferenceId}`);
          }, 2000);
        } else if (status === 'FAILED' || status === 'EXPIRED') {
          setPaymentStatus('failed');
        }
      }
    } catch (error) {
      console.error('Error refreshing payment status:', error);
      alert('Failed to check payment status. Please try again.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const selectedPlanFeatures = selectedPlan === 'shared'
    ? (tool.sharedPlanFeatures || '')
    : (tool.privatePlanFeatures || '');
  
  // Calculate pricing with discount for display
  const originalPrice = selectedDuration !== '1month' 
    ? oneMonthPrice * (selectedDuration === '3months' ? 3 : selectedDuration === '6months' ? 6 : 12) * quantity
    : finalPrice;
  const actualDiscount = originalPrice - finalPrice;
  const discountPercent = calculateDiscountPercent(originalPrice, finalPrice);
  const displayAmount = formatPrice(finalPrice);
  const displayOriginalAmount = formatPrice(originalPrice);
  
  // Parse features (split by newline or comma)
  const parseFeatures = (features: string) => {
    if (!features) return [];
    return features.split(/\n|,/).map(f => f.trim()).filter(f => f.length > 0);
  };
  
  const sharedFeatures = parseFeatures(tool.sharedPlanFeatures || '');
  const privateFeatures = parseFeatures(tool.privatePlanFeatures || '');

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-28 pb-20 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Coupon Banner - Only show before payment is created */}
        {!paymentCreated && !showCouponInput && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-lg p-4 mt-1">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>Have a coupon?</span>
              <button
                onClick={() => setShowCouponInput(true)}
                className="text-blue-600 hover:text-blue-700 font-medium underline"
              >
                Click here to enter your code
              </button>
            </div>
          <Link 
              href="/admin/coupons"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
              <Tag className="h-4 w-4" />
              <span>View Available Coupons</span>
          </Link>
          </div>
        )}

        {/* Coupon Input Section - Only show before payment is created */}
        {!paymentCreated && showCouponInput && (
          <Card className="mb-6 border-slate-200 overflow-visible">
            <CardContent className="p-4 pb-5">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={!!appliedCoupon || validatingCoupon}
                  className="flex-1"
                />
                {appliedCoupon ? (
                  <Button 
                    variant="outline" 
                    onClick={() => { 
                      setAppliedCoupon(null); 
                      setCouponCode(''); 
                      setCouponError('');
                      setShowCouponInput(false);
                    }}
                  >
                    Remove
                  </Button>
                ) : (
                  <Button 
                    onClick={async () => {
                      if (!couponCode.trim()) {
                        setCouponError('Please enter a coupon code');
                        return;
                      }
                      setValidatingCoupon(true);
                      setCouponError('');
                      try {
                        // Calculate current price based on selected plan and duration (use duration-specific prices if available)
                        const currentBasePrice = toNumber(
                          selectedPlan === 'shared' 
                            ? (tool.sharedPlanPrice && tool.sharedPlanPrice > 0 ? tool.sharedPlanPrice : tool.priceMonthly)
                            : (tool.privatePlanPrice && tool.privatePlanPrice > 0 ? tool.privatePlanPrice : tool.priceMonthly)
                        );
                        
                        // Use the calculated price for the selected duration (uses duration-specific prices if set)
                        const currentPrice = getPriceForDurationLocal(selectedDuration);
                        const amountInPaise = Math.floor(currentPrice);
                        
                        console.log('Applying coupon with:', {
                          code: couponCode.toUpperCase(),
                          plan: selectedPlan,
                          duration: selectedDuration,
                          basePrice: currentBasePrice,
                          priceWithDuration: currentPrice,
                          amountInPaise
                        });
                        
                        const response = await fetch('/api/coupons/validate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            code: couponCode.toUpperCase(), 
                            amount: amountInPaise
                          }),
                        });
                        
                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({ error: 'Failed to validate coupon' }));
                          console.error('Coupon validation failed:', errorData);
                          setCouponError(errorData.error || 'Invalid coupon code');
                          setAppliedCoupon(null);
                          return;
                        }
                        
                        const data = await response.json();
                        console.log('Coupon validation response:', data);
                        
                        if (data.valid) {
                          console.log('✅ Coupon applied successfully:', {
                            code: data.coupon.code,
                            discountAmount: data.discountAmount,
                            originalAmount: data.originalAmount,
                            finalAmount: data.finalAmount
                          });
                          setAppliedCoupon(data);
                          setCouponError('');
                          setShowCouponInput(false); // Hide input after successful application
                        } else {
                          console.error('❌ Coupon validation returned invalid:', data);
                          setCouponError(data.error || 'Invalid coupon code');
                          setAppliedCoupon(null);
                        }
                      } catch (error) {
                        setCouponError('Failed to validate coupon');
                        setAppliedCoupon(null);
                      } finally {
                        setValidatingCoupon(false);
                      }
                    }}
                    disabled={validatingCoupon || !couponCode.trim()}
                  >
                    {validatingCoupon ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCouponInput(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {couponError && (
                <p className="text-red-600 text-sm mt-2">{couponError}</p>
              )}
              {appliedCoupon && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="text-green-700 font-medium">
                    ✓ Coupon applied: {appliedCoupon.coupon.code}
          </p>
        </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Billing Details or QR Code */}
          <div className="space-y-6">
            {/* QR Code Section - Show when payment is created */}
            {paymentCreated && (
              <>
                <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-slate-900 text-lg font-bold">
                      Pay with UPI QR Code
                      </CardTitle>
                        </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 mb-6">
                    It uses UPI apps like BHIM, Paytm, Google Pay, PhonePe or any Banking UPI app to make payment.
                  </p>
                  
                  {/* QR Code */}
                  {paymentLinks?.upiIntent && (
                    <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-slate-200">
                      <QRCodeSVG
                        value={paymentLinks.upiIntent}
                        size={300}
                        level="H"
                        includeMargin={true}
                        className="rounded-lg"
                      />
                      </div>
                  )}

                  {/* Payment Status - Show in QR section */}
                  {checkingStatus && paymentStatus === 'pending' && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                      <Loader2 className="h-6 w-6 text-blue-600 animate-spin mx-auto mb-2" />
                      <p className="text-blue-800 font-medium text-sm">Checking payment status...</p>
                    </div>
                  )}

                  {paymentStatus === 'success' && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                      <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <p className="text-green-800 font-bold">Payment Successful! 🎉</p>
                      <p className="text-green-700 text-sm mt-1">Redirecting...</p>
                  </div>
                  )}

                  {paymentStatus === 'failed' && (
                    <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                      <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                      <p className="text-red-800 font-bold">Payment Failed</p>
                      <Button
                        onClick={() => {
                          setPaymentStatus('pending');
                          setPaymentCreated(false);
                          setPaymentLinks(null);
                        }}
                        variant="outline"
                        className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Try Again
                      </Button>
                </div>
                  )}

                  {paymentStatus === 'pending' && !checkingStatus && paymentCreated && (
                    <div className="mt-6 text-center">
                      <Button
                        onClick={handleRefreshStatus}
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Check Payment Status
                      </Button>
                    </div>
                  )}
                </CardContent>
            </Card>

                {/* Payment Options - Below QR Code */}
                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="border-b border-slate-200">
                    <CardTitle className="text-slate-900 text-lg font-bold">
                      Payment Options
                    </CardTitle>
                </CardHeader>
                  <CardContent className="p-6">
                    {paymentLinks && (
                      <div className="space-y-4">
                        {paymentLinks.upiIntent && (
                          <Button
                            onClick={() => handleUPIPayment(paymentLinks.upiIntent!)}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white button-text-clear h-14 text-base font-semibold"
                          >
                            <Smartphone className="h-5 w-5 mr-2" />
                            Pay with UPI
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                          {paymentLinks.phonePe && (
                            <Button
                              onClick={() => handleUPIPayment(paymentLinks.phonePe!)}
                              variant="outline"
                              className="w-full border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 h-14 text-base font-medium"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span>PhonePe</span>
                                <ExternalLink className="h-4 w-4" />
                          </div>
                            </Button>
                          )}
                          {paymentLinks.paytm && (
                            <Button
                              onClick={() => handleUPIPayment(paymentLinks.paytm!)}
                              variant="outline"
                              className="w-full border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 h-14 text-base font-medium"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span>Paytm</span>
                                <ExternalLink className="h-4 w-4" />
                        </div>
                            </Button>
                          )}
                          {paymentLinks.gpay && (
                            <Button
                              onClick={() => handleUPIPayment(paymentLinks.gpay!)}
                              variant="outline"
                              className="w-full border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 h-14 text-base font-medium"
                            >
                              <div className="flex items-center justify-center gap-2">
                                <span>Google Pay</span>
                                <ExternalLink className="h-4 w-4" />
                        </div>
                            </Button>
                          )}
                        </div>

                        <div className="pt-4 mt-4 border-t border-slate-200">
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-xs text-amber-800 text-center font-medium">
                              ⏰ Payment link expires in 5 minutes
                            </p>
                            <p className="text-xs text-amber-700 text-center mt-1">
                              Please complete the payment before it expires
                            </p>
                              </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Plan Selection - Show before payment is created */}
            {!paymentCreated && (tool.sharedPlanEnabled || tool.privatePlanEnabled) && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">
                    {initialPlan ? 'Selected Plan' : 'Select Plan'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {initialPlan ? (
                    <div className={`p-4 border-2 rounded-lg ${
                      selectedPlan === 'shared'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-purple-500 bg-purple-50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={selectedPlan === 'shared' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}>
                          {selectedPlan === 'shared' ? 'SHARED PLAN' : 'PRIVATE PLAN'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {selectedPlan === 'shared' 
                          ? 'Get immediate access after payment. Shared account (4-5 users).'
                          : 'Dedicated account. Activation via Email/WhatsApp after payment.'}
                      </p>
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${tool.sharedPlanEnabled && tool.privatePlanEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {tool.sharedPlanEnabled && (
                        <button
                          type="button"
                          onClick={() => setSelectedPlan('shared')}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                            selectedPlan === 'shared'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="font-semibold text-slate-900 mb-1">Shared Plan</div>
                          <div className="text-xs text-slate-600">Instant Access</div>
                        </button>
                      )}
                    {tool.privatePlanEnabled && (
                        <button
                          type="button"
                        onClick={() => setSelectedPlan('private')}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedPlan === 'private'
                            ? 'border-purple-500 bg-purple-50'
                              : 'border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="font-semibold text-slate-900 mb-1">Private Plan</div>
                          <div className="text-xs text-slate-600">Manual Activation</div>
                        </button>
                            )}
                          </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Duration Selection - Show before payment is created */}
            {!paymentCreated && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">
                    Subscription Duration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Select
                    value={selectedDuration}
                    onValueChange={(value: '1month' | '3months' | '6months' | '1year') => {
                      setSelectedDuration(value);
                    }}
                  >
                    <SelectTrigger className="h-11">
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
                          1 Month - {formatPrice(getPriceForDurationLocal('1month'))}
                        </SelectItem>
                      )}
                      {enabledDurations.includes('3months') && (
                        <SelectItem value="3months">
                          3 Months - {formatPrice(getPriceForDurationLocal('3months'))} {(() => {
                            const threeMonthPrice = getPriceForDurationLocal('3months');
                            const originalPrice = oneMonthPrice * 3;
                            const savingsPercent = calculateDiscountPercent(originalPrice, threeMonthPrice);
                            return savingsPercent > 0 ? `(Save ${savingsPercent}%)` : '';
                          })()}
                        </SelectItem>
                      )}
                      {enabledDurations.includes('6months') && (
                        <SelectItem value="6months">
                          6 Months - {formatPrice(getPriceForDurationLocal('6months'))} {(() => {
                            const sixMonthPrice = getPriceForDurationLocal('6months');
                            const originalPrice = oneMonthPrice * 6;
                            const savingsPercent = calculateDiscountPercent(originalPrice, sixMonthPrice);
                            return savingsPercent > 0 ? `(Save ${savingsPercent}%)` : '';
                          })()}
                        </SelectItem>
                      )}
                      {enabledDurations.includes('1year') && (
                        <SelectItem value="1year">
                          1 Year - {formatPrice(getPriceForDurationLocal('1year'))} {(() => {
                            const oneYearPrice = getPriceForDurationLocal('1year');
                            const originalPrice = oneMonthPrice * 12;
                            const savingsPercent = calculateDiscountPercent(originalPrice, oneYearPrice);
                            return savingsPercent > 0 ? `(Save ${savingsPercent}%)` : '';
                          })()}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* BILLING DETAILS */}
            {!paymentCreated ? (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">
                    Billing Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleCreatePayment} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                        Email address <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="bg-white border-slate-300 h-11"
                      />
                    </div>

                    {/* First Name / Last Name */}
                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-slate-700 font-medium text-sm">
                          First name <span className="text-red-500">*</span>
                        </Label>
                      <Input
                          id="firstName"
                          type="text"
                          value={customerFirstName}
                          onChange={(e) => setCustomerFirstName(e.target.value)}
                          placeholder="John"
                        required
                          className="bg-white border-slate-300 h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-slate-700 font-medium text-sm">
                          Last name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={customerLastName}
                          onChange={(e) => setCustomerLastName(e.target.value)}
                          placeholder="Doe"
                          required
                          className="bg-white border-slate-300 h-11"
                        />
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-slate-700 font-medium text-sm">
                        Phone Number <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
                        placeholder="9876543210"
                        required
                        maxLength={10}
                        className="bg-white border-slate-300 h-11"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || planPrice <= 0 || finalPrice <= 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white button-text-clear h-12 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : null}

            {/* ADDITIONAL INFORMATION */}
            {!paymentCreated && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderNotes" className="text-slate-700 font-medium text-sm">
                      Order notes (optional)
                    </Label>
                    <Textarea
                      id="orderNotes"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Notes about your order, e.g. special notes for delivery."
                      rows={4}
                      className="bg-white border-slate-300 resize-none"
                    />
                      </div>
                </CardContent>
              </Card>
            )}
                      </div>

          {/* Right Column - Your Order and Payment Options */}
          <div className="space-y-6 pb-8 md:pb-12">
            {/* YOUR ORDER */}
            <Card className="border-slate-200 shadow-sm sticky top-24">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">
                  Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {/* Product Header */}
                <div className="grid grid-cols-2 gap-4 mb-4 pb-3 border-b border-slate-200">
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Product</div>
                  <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">Subtotal</div>
                      </div>

                {/* Product Item */}
                <div className="mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    {/* Remove button (hidden for subscriptions) */}
                    <div className="w-6"></div>
                    
                    {/* Product Thumbnail - larger image */}
                    <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-purple-100 to-blue-100">
                      {tool.icon && (tool.icon.startsWith('/') || tool.icon.startsWith('http')) ? (
                        <img
                          src={tool.icon}
                          alt={tool.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl">
                          {tool.icon || "🛠️"}
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 text-sm mb-1">
                            {tool.name} - {
                              selectedDuration === '1month' ? '1 Month' :
                              selectedDuration === '3months' ? '3 Months' :
                              selectedDuration === '6months' ? '6 Months' :
                              '1 Year'
                            }
                          </h3>
                          <p className="text-xs text-slate-600 mb-3">
                            {selectedPlan === 'shared' ? 'Shared Plan' : 'Private Plan'}
                          </p>
                          
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-4 w-4 text-slate-600" />
                            </button>
                            <span className="w-12 text-center font-medium text-slate-900">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                            >
                              <Plus className="h-4 w-4 text-slate-600" />
                            </button>
                    </div>
                    </div>

                        {/* Product Subtotal */}
                        <div className="text-right">
                          {planPrice > 0 ? (
                            <div className="font-semibold text-slate-900">
                              {formatPrice(planPrice * quantity)}
                  </div>
                          ) : (
                            <div className="text-sm text-red-600 italic">
                              Price not available
                            </div>
            )}
          </div>
                  </div>
                  </div>
                  </div>
                </div>

                {/* Order Totals */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Subtotal:</span>
                    {planPrice > 0 ? (
                      <span className="text-blue-600 font-bold">
                        {formatPrice(planPrice * quantity)}
                      </span>
                    ) : (
                      <span className="text-sm text-red-600 italic">
                        Price not available
                      </span>
                    )}
                    </div>
                  
                  {selectedDuration !== '1month' && (() => {
                    const originalPrice = oneMonthPrice * (selectedDuration === '3months' ? 3 : selectedDuration === '6months' ? 6 : 12);
                    const discount = (originalPrice - planPrice) * quantity;
                    const discountPercent = calculateDiscountPercent(originalPrice, planPrice);
                    if (discount > 0) {
                      return (
                        <div className="flex justify-between items-center text-green-600">
                          <span className="text-sm">
                            {selectedDuration === '3months' ? `3 Months Discount (${discountPercent}%)` :
                             selectedDuration === '6months' ? `6 Months Discount (${discountPercent}%)` :
                             `Yearly Discount (${discountPercent}%)`}:
                          </span>
                          <span className="text-sm font-medium">
                            -{formatPrice(discount)}
                          </span>
                  </div>
                      );
                    }
                    return null;
                  })()}
                  
                  {!paymentCreated && appliedCoupon && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm">Coupon ({appliedCoupon.coupon.code}):</span>
                      <span className="text-sm font-medium">
                        -{formatPrice(appliedCoupon.discountAmount * quantity)}
                      </span>
                  </div>
                  )}
                  </div>

                {/* Total */}
                <div className="pt-4 mt-4 border-t-2 border-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total:</span>
                    {finalPrice > 0 ? (
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(finalPrice)}
                      </span>
                    ) : (
                      <span className="text-lg font-medium text-red-600">
                        Price not available
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

