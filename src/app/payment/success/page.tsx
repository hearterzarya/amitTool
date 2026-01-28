'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, Loader2, MessageCircle } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get('ref');
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    if (!ref) {
      router.push('/');
      return;
    }

    // Fetch payment details
    const fetchPayment = async () => {
      try {
        const response = await fetch('/api/payments/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantReferenceId: ref }),
        });

        const data = await response.json();
        if (data.success) {
          setPaymentData(data.payment);
          
          // Fetch subscription details if payment is successful
          if (data.payment.status === 'SUCCESS' && data.payment.toolId) {
            try {
              const subResponse = await fetch(`/api/subscriptions/check?toolId=${data.payment.toolId}`);
              const subData = await subResponse.json();
              if (subData.success) {
                setSubscriptionData(subData.subscription);
              }
            } catch (error) {
              console.error('Error fetching subscription:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching payment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayment();
  }, [ref, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 pt-16 pb-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Card className="glass border-slate-200 text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-slate-900 mb-2">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-lg text-slate-600">
              Your payment has been processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {paymentData && (
              <div className="bg-slate-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Transaction ID:</span>
                  <span className="font-mono text-sm text-slate-900">
                    {paymentData.merchantReferenceId}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Amount:</span>
                  <span className="font-semibold text-slate-900">
                    ₹{(paymentData.amount / 100).toLocaleString('en-IN')}
                  </span>
                </div>
                {paymentData.successDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Date:</span>
                    <span className="text-slate-900">
                      {new Date(paymentData.successDate).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              {subscriptionData?.planType === 'PRIVATE' && subscriptionData?.activationStatus === 'PENDING' ? (
                // PRIVATE PLAN - PENDING ACTIVATION
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
                    <h3 className="text-lg font-semibold text-amber-900">Activation Pending</h3>
                  </div>
                  <p className="text-slate-700 font-medium">
                    Your Private Plan purchase is confirmed! Your subscription will be activated via Email or WhatsApp Support.
                  </p>
                  <div className="bg-white rounded-lg p-4 space-y-2">
                    <p className="text-sm text-slate-600">
                      <strong>What happens next?</strong>
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                      <li>Our team will review your purchase</li>
                      <li>You'll receive activation confirmation via Email or WhatsApp</li>
                      <li>Private credentials will be assigned to your account</li>
                      <li>You'll get instant access once activated</li>
                    </ul>
                  </div>
                  <a
                    href="https://wa.me/919155313223?text=Hi! I just purchased a Private Plan. Payment Reference: {paymentData?.merchantReferenceId}"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Contact Support on WhatsApp
                  </a>
                </div>
              ) : subscriptionData?.planType === 'SHARED' && subscriptionData?.activationStatus === 'ACTIVE' ? (
                // SHARED PLAN - INSTANT ACCESS
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Access Activated!</h3>
                  </div>
                  <p className="text-slate-700 font-medium">
                    Your Shared Plan is now active! You have instant access to your tool.
                  </p>
                  {subscriptionData?.sharedCredentials && (
                    <div className="bg-white rounded-lg p-4 space-y-2">
                      <p className="text-sm font-semibold text-slate-900 mb-2">Shared Account Credentials:</p>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-slate-500">Email:</span>
                          <p className="text-sm font-mono text-slate-900">{subscriptionData.sharedCredentials.email}</p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-500">Password:</span>
                          <p className="text-sm font-mono text-slate-900">{subscriptionData.sharedCredentials.password}</p>
                        </div>
                        <p className="text-xs text-amber-600 mt-2">
                          ⚠️ This is a shared account (4-5 users). Keep credentials secure.
                        </p>
                      </div>
                    </div>
                  )}
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ) : (
                // FALLBACK - Generic message
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageCircle className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Next Steps</h3>
                  </div>
                  <p className="text-slate-700 font-medium">
                    Please send your payment confirmation and your login credentials on WhatsApp to get your subscription activated.
                  </p>
                  <a
                    href="https://wa.me/919155313223?text=Hi! I just made a payment. Here are my details:"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Contact us on WhatsApp
                  </a>
                  <p className="text-sm text-slate-600 mt-2">
                    WhatsApp Number: <span className="font-semibold">+91 91553 13223</span>
                  </p>
                </div>
              )}
              <p className="text-sm text-slate-600">
                A confirmation email has been sent to your registered email address.
              </p>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
              >
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Link href="/tools">Browse Tools</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

