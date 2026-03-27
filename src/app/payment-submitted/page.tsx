'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { buildWhatsAppLink } from '@/lib/payment-utils';

function PaymentSubmittedContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    const whatsappNumber = "918664024295"; // Hardcoded as per requirements
    const whatsappMessage = `Hello, I have paid ₹${amount} for Order ID: ${orderId}. Please verify and confirm my order.`;
    const whatsappLink = buildWhatsAppLink({ phone: whatsappNumber, message: whatsappMessage });

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-slate-200">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle2 className="h-12 w-12 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Payment Submitted</CardTitle>
                    <CardDescription className="text-slate-600 mt-2">
                        We have received your payment details. We will verify and confirm your order shortly.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Order ID:</span>
                            <span className="font-mono font-medium text-slate-900">{orderId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Amount Paid:</span>
                            <span className="font-medium text-slate-900">₹{amount}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button
                            asChild
                            className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white py-6"
                        >
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <MessageSquare className="h-5 w-5 mr-2" />
                                Send Confirmation on WhatsApp
                            </a>
                        </Button>

                        <Button asChild variant="outline" className="w-full py-6">
                            <Link href="/dashboard">
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>

                    <p className="text-xs text-center text-slate-500 italic">
                        Note: Orders are usually confirmed within 15-30 minutes during business hours.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PaymentSubmittedPage() {
    return (
        <Suspense fallback={null}>
            <PaymentSubmittedContent />
        </Suspense>
    );
}
