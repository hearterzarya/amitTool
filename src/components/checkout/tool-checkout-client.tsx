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
  ShoppingBag,
  Send
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
  sharedPlanPrice1Month?: number | null;
  sharedPlanPrice3Months?: number | null;
  sharedPlanPrice6Months?: number | null;
  sharedPlanPrice1Year?: number | null;
  privatePlanPrice1Month?: number | null;
  privatePlanPrice3Months?: number | null;
  privatePlanPrice6Months?: number | null;
  privatePlanPrice1Year?: number | null;
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
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'submitted' | 'success' | 'failed'>('pending');

  // Manual Payment State
  const [transactionId, setTransactionId] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Plan selection
  const getDefaultPlan = (): 'shared' | 'private' => {
    if (initialPlan) return initialPlan;
    if (tool.sharedPlanEnabled) return 'shared';
    if (tool.privatePlanEnabled) return 'private';
    return 'shared';
  };
  const [selectedPlan, setSelectedPlan] = useState<'shared' | 'private'>(getDefaultPlan());

  const enabledDurations = getEnabledDurations(tool, selectedPlan);
  const defaultDuration = enabledDurations.length > 0
    ? (enabledDurations.includes(initialDuration as Duration) ? initialDuration as Duration : enabledDurations[0])
    : '1month';

  const [selectedDuration, setSelectedDuration] = useState<'1month' | '3months' | '6months' | '1year'>(
    defaultDuration
  );

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

  // Load initial coupon
  useEffect(() => {
    if (initialCouponId && !appliedCoupon) {
      const loadAndValidateCoupon = async () => {
        try {
          const couponRes = await fetch(`/api/admin/coupons/${initialCouponId}`);
          if (!couponRes.ok) return;

          const couponData = await couponRes.json();

          if (couponData.coupon) {
            const currentBasePrice = getBasePrice(tool, selectedPlan);
            const currentOneMonthPrice = getOneMonthPrice(tool, selectedPlan, currentBasePrice);
            const currentPrice = getPriceForDuration(tool, selectedPlan, selectedDuration, currentOneMonthPrice);
            const amountInPaise = Math.floor(currentPrice);

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
              if (validateData.valid) {
                setAppliedCoupon(validateData);
                setCouponCode(couponData.coupon.code);
                setCouponError('');
              }
            }
          }
        } catch (error) {
          console.error('Error loading coupon:', error);
        }
      };

      const timeoutId = setTimeout(loadAndValidateCoupon, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [initialCouponId]);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerFirstName, setCustomerFirstName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setCustomerName(session.user.name || '');
      setCustomerEmail(session.user.email || '');
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=/checkout/${tool.id}`);
    }
  }, [status, router, tool.id]);

  const [quantity, setQuantity] = useState(1);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const basePrice = getBasePrice(tool, selectedPlan);
  const oneMonthPrice = getOneMonthPrice(tool, selectedPlan, basePrice);
  const planPrice = getPriceForDuration(tool, selectedPlan, selectedDuration, oneMonthPrice);

  // Revalidate coupon on plan/duration change
  const prevPlanRef = useRef(selectedPlan);
  const prevDurationRef = useRef(selectedDuration);

  useEffect(() => {
    const planChanged = prevPlanRef.current !== selectedPlan;
    const durationChanged = prevDurationRef.current !== selectedDuration;

    if (appliedCoupon?.coupon?.code && planPrice > 0 && (planChanged || durationChanged)) {
      const revalidateCoupon = async () => {
        try {
          const amountInPaise = Math.floor(planPrice);
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
              setAppliedCoupon(data);
              setCouponError('');
            } else {
              setAppliedCoupon(null);
              setCouponCode('');
              setCouponError(data.error || 'Coupon is no longer valid for this purchase');
            }
          }
        } catch (error) {
          console.error('Error revalidating coupon:', error);
        }
      };

      const timeoutId = setTimeout(revalidateCoupon, 500);
      return () => clearTimeout(timeoutId);
    }

    prevPlanRef.current = selectedPlan;
    prevDurationRef.current = selectedDuration;
  }, [selectedPlan, selectedDuration, planPrice, appliedCoupon]);

  let finalPricePerUnit = planPrice;
  if (appliedCoupon && appliedCoupon.discountAmount && appliedCoupon.discountAmount > 0) {
    finalPricePerUnit = planPrice - appliedCoupon.discountAmount;
    if (finalPricePerUnit < 0) finalPricePerUnit = 0; // Can't be negative
  }

  const finalPrice = finalPricePerUnit * quantity;

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullName = (customerFirstName && customerLastName)
      ? `${customerFirstName} ${customerLastName}`.trim()
      : customerName || `${customerFirstName} ${customerLastName}`.trim();

    if (!customerEmail || !customerMobile || !fullName) {
      alert('Please fill in all required fields');
      return;
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(customerMobile.replace(/\D/g, ''))) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);

    try {
      const amount = finalPrice / 100; // Convert to rupees

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
          customerName: fullName,
          customerEmail,
          customerMobile: customerMobile.replace(/\D/g, ''),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentLinks(data.payment.paymentLinks);
        setMerchantReferenceId(data.payment.merchantReferenceId);
        setPaymentCreated(true);
        setPaymentStatus('pending');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(data.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert('Failed to create payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setVerificationError('Please enter the Transaction ID / UTR');
      return;
    }

    setSubmittingVerification(true);
    setVerificationError('');

    try {
      const response = await fetch('/api/payments/submit-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantReferenceId,
          transactionId: transactionId.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentStatus('submitted');
        setTransactionId('');
      } else {
        setVerificationError(data.error || 'Failed to submit transaction ID');
      }
    } catch (error: any) {
      setVerificationError(error.message || 'Error submitting verification');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleUPIPayment = (link: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-28 pb-20 md:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 overflow-visible">
        {/* Coupon Banner */}
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
          </div>
        )}

        {/* Coupon Input */}
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
                        const currentPrice = getPriceForDuration(tool, selectedPlan, selectedDuration, oneMonthPrice);
                        const amountInPaise = Math.floor(currentPrice);

                        const response = await fetch('/api/coupons/validate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            code: couponCode.toUpperCase(),
                            amount: amountInPaise
                          }),
                        });

                        const data = await response.json();
                        if (data.valid) {
                          setAppliedCoupon(data);
                          setCouponError('');
                          setShowCouponInput(false);
                        } else {
                          setCouponError(data.error || 'Invalid coupon code');
                        }
                      } catch (error) {
                        setCouponError('Failed to validate coupon');
                      } finally {
                        setValidatingCoupon(false);
                      }
                    }}
                    disabled={validatingCoupon || !couponCode.trim()}
                  >
                    {validatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowCouponInput(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {couponError && <p className="text-red-600 text-sm mt-2">{couponError}</p>}
              {appliedCoupon && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <p className="text-green-700 font-medium">✓ Coupon applied: {appliedCoupon.coupon.code}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Payment Section */}
            {paymentCreated && (
              <>
                {paymentStatus === 'submitted' ? (
                  <Card className="border-green-200 bg-green-50 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                      <h2 className="text-xl font-bold text-green-800 mb-2">Payment Submitted!</h2>
                      <p className="text-green-700 mb-4">
                        Your transaction details have been submitted for verification.
                        We will verify your payment and activate your subscription shortly.
                      </p>
                      <p className="text-sm text-green-600">
                        You will receive a confirmation email once approved.
                      </p>
                      <Button
                        className="mt-6"
                        onClick={() => router.push('/dashboard')}
                      >
                        Go to Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-200 pb-4">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-slate-900 text-lg font-bold">Scan QR to Pay</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center justify-center mb-6">
                        <div className="p-4 bg-white rounded-lg border-2 border-slate-200 mb-4">
                          {/* Use explicit QR code for the UPI manually if paymentLinks.upiIntent exists */}
                          {paymentLinks?.upiIntent && (
                            <QRCodeSVG
                              value={paymentLinks.upiIntent}
                              size={240}
                              level="H"
                              includeMargin={true}
                            />
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Scan with any UPI App</p>
                        <p className="text-xs text-slate-500 mb-4">Google Pay, PhonePe, Paytm, BHIM, etc.</p>
                        <div className="text-lg font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded">
                          Amount: {formatPrice(finalPrice)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {paymentLinks?.upiIntent && (
                          <Button
                            variant="outline"
                            onClick={() => handleUPIPayment(paymentLinks.upiIntent)}
                            className="w-full"
                          >
                            <Smartphone className="h-4 w-4 mr-2" />
                            Open App
                          </Button>
                        )}
                      </div>

                      <div className="border-t border-slate-200 pt-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Verify Payment</h3>
                        <form onSubmit={handleSubmitVerification} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="txnId">Transaction ID / UTR Number <span className="text-red-500">*</span></Label>
                            <Input
                              id="txnId"
                              placeholder="e.g. 403818392812"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              required
                            />
                            <p className="text-xs text-slate-500">
                              Enter the 12-digit UTR number from your payment app after successful transfer.
                            </p>
                          </div>

                          {verificationError && (
                            <p className="text-red-500 text-sm font-medium">{verificationError}</p>
                          )}

                          <Button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            disabled={submittingVerification || !transactionId}
                          >
                            {submittingVerification ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Submit Payment Details
                              </>
                            )}
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Plan Selection */}
            {!paymentCreated && (tool.sharedPlanEnabled || tool.privatePlanEnabled) && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">
                    {initialPlan ? 'Selected Plan' : 'Select Plan'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {initialPlan ? (
                    <div className={`p-4 border-2 rounded-lg ${selectedPlan === 'shared' ? 'border-blue-500 bg-blue-50' : 'border-purple-500 bg-purple-50'
                      }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={selectedPlan === 'shared' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'}>
                          {selectedPlan === 'shared' ? 'SHARED PLAN' : 'PRIVATE PLAN'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">
                        {selectedPlan === 'shared' ? 'Get immediate access after payment. Shared account (4-5 users).' : 'Dedicated account. Activation via Email/WhatsApp after payment.'}
                      </p>
                    </div>
                  ) : (
                    <div className={`grid gap-3 ${tool.sharedPlanEnabled && tool.privatePlanEnabled ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {tool.sharedPlanEnabled && (
                        <button
                          type="button"
                          onClick={() => setSelectedPlan('shared')}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${selectedPlan === 'shared' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'
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
                          className={`p-4 border-2 rounded-lg text-left transition-all ${selectedPlan === 'private' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-purple-300'
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

            {/* Duration Selection */}
            {!paymentCreated && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">Subscription Duration</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <Select value={selectedDuration} onValueChange={(value: any) => setSelectedDuration(value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue>
                        {selectedDuration === '1month' && `1 Month - ${formatPrice(getPriceForDuration(tool, selectedPlan, '1month', oneMonthPrice))}`}
                        {selectedDuration === '3months' && `3 Months - ${formatPrice(getPriceForDuration(tool, selectedPlan, '3months', oneMonthPrice))}`}
                        {selectedDuration === '6months' && `6 Months - ${formatPrice(getPriceForDuration(tool, selectedPlan, '6months', oneMonthPrice))}`}
                        {selectedDuration === '1year' && `1 Year - ${formatPrice(getPriceForDuration(tool, selectedPlan, '1year', oneMonthPrice))}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {enabledDurations.map(duration => (
                        <SelectItem key={duration} value={duration}>
                          {duration === '1month' ? '1 Month' : duration === '3months' ? '3 Months' : duration === '6months' ? '6 Months' : '1 Year'} - {formatPrice(getPriceForDuration(tool, selectedPlan, duration as Duration, oneMonthPrice))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Billing Details Form */}
            {!paymentCreated && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">Billing Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleCreatePayment} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 font-medium text-sm">Email address <span className="text-red-500">*</span></Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                        className="bg-white border-slate-300 h-11"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-slate-700 font-medium text-sm">First name <span className="text-red-500">*</span></Label>
                        <Input
                          id="firstName"
                          value={customerFirstName}
                          onChange={(e) => setCustomerFirstName(e.target.value)}
                          required
                          className="bg-white border-slate-300 h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-slate-700 font-medium text-sm">Last name <span className="text-red-500">*</span></Label>
                        <Input
                          id="lastName"
                          value={customerLastName}
                          onChange={(e) => setCustomerLastName(e.target.value)}
                          required
                          className="bg-white border-slate-300 h-11"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-slate-700 font-medium text-sm">Phone Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
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
                        <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        <><CreditCard className="h-5 w-5 mr-2" /> Proceed to Payment</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Order Notes */}
            {!paymentCreated && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-200">
                  <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="orderNotes" className="text-slate-700 font-medium text-sm">Order notes (optional)</Label>
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

          {/* Right Column - Order Summary */}
          <div className="space-y-6 pb-8 md:pb-12">
            <Card className="border-slate-200 shadow-sm sticky top-24">
              <CardHeader className="border-b border-slate-200">
                <CardTitle className="text-slate-900 text-lg font-bold uppercase tracking-wide">Your Order</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-purple-100 to-blue-100">
                      {tool.icon && (tool.icon.startsWith('/') || tool.icon.startsWith('http')) ? (
                        <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl">{tool.icon || "🛠️"}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm mb-1">
                        {tool.name} - {selectedDuration === '1month' ? '1 Month' : selectedDuration === '3months' ? '3 Months' : selectedDuration === '6months' ? '6 Months' : '1 Year'}
                      </h3>
                      <p className="text-xs text-slate-600 mb-3">{selectedPlan === 'shared' ? 'Shared Plan' : 'Private Plan'}</p>

                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-50 transition-colors" disabled={quantity <= 1}><Minus className="h-4 w-4 text-slate-600" /></button>
                        <span className="w-12 text-center font-medium text-slate-900">{quantity}</span>
                        <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center border border-slate-300 rounded hover:bg-slate-50 transition-colors"><Plus className="h-4 w-4 text-slate-600" /></button>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{formatPrice(planPrice * quantity)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-medium">Subtotal:</span>
                    <span className="text-blue-600 font-bold">{formatPrice(planPrice * quantity)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="text-sm">Coupon ({appliedCoupon.coupon.code}):</span>
                      <span className="text-sm font-medium">-{formatPrice(appliedCoupon.discountAmount * quantity)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t-2 border-slate-300">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-slate-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{formatPrice(finalPrice)}</span>
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
