import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateMerchantReferenceId } from '@/lib/paygic';
import { PlanType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      toolId,
      bundleId,
      planName,
      planType,
      duration,
      amount,
      couponId,
      discountAmount,
      customerName,
      customerEmail,
      customerMobile
    } = body;

    // Validate required fields
    if (!customerEmail || !customerMobile) {
      return NextResponse.json(
        { error: 'Customer email and mobile are required' },
        { status: 400 }
      );
    }

    // Validate mobile number format (Indian 10-digit)
    const mobileRegex = /^[6-9]\d{9}$/;
    const cleanMobile = customerMobile.replace(/\D/g, '');
    if (!mobileRegex.test(cleanMobile)) {
      return NextResponse.json(
        { error: 'Invalid mobile number. Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    // Validate that either toolId or bundleId is provided
    if (!toolId && !bundleId) {
      return NextResponse.json(
        { error: 'Either toolId or bundleId is required' },
        { status: 400 }
      );
    }

    // Validate toolId or bundleId if provided
    let tool = null;
    let bundle = null;
    let finalAmount = amount;

    if (toolId) {
      tool = await prisma.tool.findUnique({
        where: { id: toolId },
      });

      if (!tool) {
        return NextResponse.json(
          { error: 'Tool not found' },
          { status: 404 }
        );
      }

      // Use the provided amount (which is already in rupees from client)
      if (!amount || amount <= 0) {
        // Fallback: calculate from tool price if amount not provided
        const toolPrice = typeof tool.priceMonthly === 'bigint' ? Number(tool.priceMonthly) : (tool.priceMonthly || 0);
        finalAmount = toolPrice / 100; // Convert from paise to rupees
      } else {
        // Use the plan-specific amount provided by the client (already in rupees)
        finalAmount = amount;
      }
    } else if (bundleId) {
      try {
        // Check if bundle model exists in Prisma client
        if ('bundle' in prisma && typeof (prisma as any).bundle?.findUnique === 'function') {
          bundle = await (prisma as any).bundle.findUnique({
            where: { id: bundleId },
          });

          if (!bundle) {
            return NextResponse.json(
              { error: 'Bundle not found' },
              { status: 404 }
            );
          }

          // Use the provided amount
          if (!amount || amount <= 0) {
            // Fallback
            const bundlePrice = typeof bundle.priceMonthly === 'bigint' ? Number(bundle.priceMonthly) : (bundle.priceMonthly || 0);
            finalAmount = bundlePrice / 100;
          } else {
            finalAmount = amount;
          }

          // Validate final amount
          if (finalAmount <= 0) {
            return NextResponse.json(
              { error: 'Invalid bundle price. Please contact support.' },
              { status: 400 }
            );
          }
        } else {
          console.warn('Bundle model not available in Prisma client. Please run: npx prisma generate');
          return NextResponse.json(
            { error: 'Bundle feature not available yet. Please run database migration.' },
            { status: 400 }
          );
        }
      } catch (error: any) {
        console.warn('Error accessing bundle:', error);
        return NextResponse.json(
          { error: 'Bundle feature not available yet. Please run database migration.' },
          { status: 400 }
        );
      }
    }

    // Generate unique merchant reference ID
    const merchantReferenceId = generateMerchantReferenceId();

    // Prepare Manual UPI Payment Data
    // Static UPI ID from env
    const upiId = process.env.UPI_ID || 'paytmqr8100501011wdaqr1fuwnf@paytm';
    const payeeName = process.env.PAYEE_NAME || 'clickify store';
    const txnNote = `Order ${merchantReferenceId}`;
    const amountStr = finalAmount.toString();

    // Construct UPI Intent URL
    const upiIntent = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(txnNote)}`;

    // Save payment to database
    const paymentData: any = {
      userId: (session.user as any).id,
      toolId: toolId || null,
      planName: duration ? `${planName || 'Plan'} - ${duration === '1year' ? '1 Year' :
        duration === '6months' ? '6 Months' :
          duration === '3months' ? '3 Months' :
            '1 Month'
        }` : (planName || null),
      planType: planType || (toolId ? PlanType.SHARED : null), // Default to SHARED for tool purchases
      amount: Math.round(finalAmount * 100), // Store in paise
      discountAmount: discountAmount ? Math.round(discountAmount * 100) : 0, // Store discount in paise
      couponId: couponId || null,
      merchantReferenceId,
      paymentMethod: 'UPI_QR',
      upiIntent: upiIntent, // Store generated intent
      // Clear external gateway links
      phonePeLink: '',
      paytmLink: '',
      gpayLink: '',
      dynamicQR: '',
      customerName: customerName || session.user.name || null,
      customerEmail,
      customerMobile: customerMobile.replace(/\D/g, ''), // Clean mobile number
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours expiry for manual payment
      status: 'PENDING',
    };

    // Add bundleId if bundle model exists
    try {
      if (bundleId && 'bundle' in prisma && typeof (prisma as any).bundle?.findUnique === 'function') {
        paymentData.bundleId = bundleId;
      }
    } catch (error) {
      console.warn('BundleId field may not exist in Payment model yet');
    }

    const payment = await prisma.payment.create({
      data: paymentData,
    });

    return NextResponse.json({
      success: true,
      merchantReferenceId: payment.merchantReferenceId,
      payment: {
        id: payment.id,
        merchantReferenceId: payment.merchantReferenceId,
        amount: payment.amount,
        status: payment.status,
        paymentLinks: {
          upiIntent: upiIntent,
          // Could provide individual app links if desired, but general intent covers all
          phonePe: upiIntent,
          paytm: upiIntent,
          gpay: upiIntent,
          dynamicQR: upiIntent, // Using intent as content for QR
        },
        expiresAt: payment.expiresAt,
      },
      manualPayment: true,
      upiId: upiId,
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}

