'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Smartphone,
  QrCode,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiLink, copyToClipboard, buildWhatsAppLink } from '@/lib/payment-utils';

interface PaymentLinks {
  upiIntent: string;
  phonePe: string;
  paytm: string;
  gpay: string;
  dynamicQR: string;
}

function CheckoutContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toolId = searchParams.get('toolId');
  const planName = searchParams.get('plan');
  const amount = searchParams.get('amount');

  const [loading, setLoading] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLinks | null>(null);
  const [merchantReferenceId, setMerchantReferenceId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      setCustomerName(session.user.name || '');
      setCustomerEmail(session.user.email || '');
    }
  }, [session]);

  // Poll payment status
  // Manual confirmation flow: status polling removed

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login?redirect=/checkout');
    return null;
  }

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerEmail || !customerMobile) {
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
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: toolId || null,
          planName: planName || null,
          amount: amount ? parseFloat(amount) : null,
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

  const handleUPIPayment = (link: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  const handleCopyUpiId = async () => {
    const upiId = 'paytmqr8100501011wdaqr1fuwnf@paytm';
    const success = await copyToClipboard(upiId);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmitVerification = async () => {
    if (!transactionId) {
      alert('Please enter your Transaction ID / UTR');
      return;
    }

    setSubmittingVerification(true);
    try {
      const response = await fetch('/api/payments/submit-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantReferenceId,
          transactionId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push(`/payment-submitted?orderId=${merchantReferenceId}&amount=${amount}`);
      } else {
        alert(data.error || 'Failed to submit verification');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Failed to submit verification. Please try again.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const displayAmount = amount ? `₹${parseFloat(amount).toLocaleString('en-IN')}` : 'N/A';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tools"
            className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            Complete Your Purchase
          </h1>
          <p className="text-slate-600">
            Secure payment via UPI, PhonePe, Paytm, or Google Pay
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form / Options */}
          <div className="lg:col-span-2 space-y-6">
            {!paymentCreated ? (
              <Card className="glass border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">Payment Details</CardTitle>
                  <CardDescription>
                    Enter your details to proceed with payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePayment} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-700">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                        className="bg-white border-slate-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className="bg-white border-slate-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-slate-700">Mobile Number</Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
                        placeholder="10-digit mobile number"
                        required
                        maxLength={10}
                        className="bg-white border-slate-300"
                      />
                      <p className="text-xs text-slate-500">
                        Enter your 10-digit mobile number (without +91)
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Payment...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="glass border-slate-200">
                <CardHeader>
                  <CardTitle className="text-slate-900">UPI QR Payment</CardTitle>
                  <CardDescription>
                    Scan the QR code below or use the UPI ID to complete your payment
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* QR Code Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                      {paymentLinks?.upiIntent ? (
                        <>
                          {/* Prefer dynamic QR for deep linking support, but allow static image fallback */}
                          <QRCodeSVG
                            value={paymentLinks.upiIntent}
                            size={240}
                            level="H"
                            includeMargin={true}
                          />
                          {/* Static overlay or alternate view if requested specifically by user */}
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <img
                              src="/assets/upi-qr.png"
                              alt="UPI QR Fallback"
                              className="w-[240px] h-[240px] object-contain"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="w-[240px] h-[240px] flex items-center justify-center text-slate-400">
                          <img
                            src="/assets/upi-qr.png"
                            alt="QR Code"
                            className="w-full h-full object-contain"
                            fallback-text="QR Code Loading..."
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-700">Scan to Pay: ₹{amount}</p>
                  </div>

                  {/* UPI ID Section */}
                  <div className="space-y-3">
                    <Label className="text-slate-700">UPI ID</Label>
                    <div className="flex space-x-2">
                      <Input
                        readOnly
                        value="paytmqr8100501011wdaqr1fuwnf@paytm"
                        className="bg-slate-50 border-slate-200 font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCopyUpiId}
                        className="flex-shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Deep Link for Mobile */}
                  <div className="block md:hidden pt-2">
                    <Button
                      onClick={() => handleUPIPayment(paymentLinks?.upiIntent || '')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 h-auto"
                    >
                      <Smartphone className="h-5 w-5 mr-2" />
                      Pay via UPI App
                    </Button>
                    <p className="text-[10px] text-center text-slate-500 mt-2">
                      Clicking this will open your preferred UPI app
                    </p>
                  </div>

                  <div className="hidden md:block bg-blue-50 p-3 rounded-md border border-blue-100 text-center">
                    <p className="text-xs text-blue-700">
                      Use your mobile to scan the QR code above or copy the UPI ID
                    </p>
                  </div>

                  {/* Verification Section */}
                  <div className="pt-6 border-t border-slate-200 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="txnId" className="text-slate-700 font-semibold text-base">
                        Step 2: Enter Transaction ID / UTR
                      </Label>
                      <Input
                        id="txnId"
                        placeholder="12-digit UPI Ref/UTR Number"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="bg-white border-slate-300 h-12"
                      />
                      <p className="text-xs text-slate-500">
                        Please enter the 12-digit transaction ID or UTR number from your payment app.
                      </p>
                    </div>

                    <Button
                      onClick={handleSubmitVerification}
                      disabled={submittingVerification || !transactionId}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-6 h-auto text-lg font-bold"
                    >
                      {submittingVerification ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "I have paid"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="glass border-slate-200 sticky top-24">
              <CardHeader>
                <CardTitle className="text-slate-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">
                      {planName ? `${planName} Bundle` : toolId ? 'Tool Subscription' : 'Purchase'}
                    </span>
                  </div>
                  {planName && (
                    <p className="text-sm text-slate-500">
                      Monthly subscription
                    </p>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">Amount</span>
                    <span className="text-2xl font-bold text-slate-900">{displayAmount}</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-2">
                  <div className="flex items-center text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    Secure Payment
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    Instant Activation
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    24/7 Support
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

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}

