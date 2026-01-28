import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  createPaygicToken,
  createPaygicPayment,
  generateMerchantReferenceId,
} from '@/lib/paygic';
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
      // Client sends amount in rupees, so we use it directly
      if (!amount || amount <= 0) {
        // Fallback: calculate from tool price if amount not provided
        const toolPrice = typeof tool.priceMonthly === 'bigint' ? Number(tool.priceMonthly) : (tool.priceMonthly || 0);
        finalAmount = toolPrice / 100; // Convert from paise to rupees
        console.log('Using tool default price (no plan specified):', {
          toolId: tool.id,
          toolName: tool.name,
          priceMonthly: tool.priceMonthly,
          priceInRupees: finalAmount,
        });
      } else {
        // Use the plan-specific amount provided by the client (already in rupees)
        finalAmount = amount;
        console.log('Using plan-specific price from client:', {
          toolId: tool.id,
          toolName: tool.name,
          planName: planName,
          planType: planType,
          duration: duration,
          amountInRupees: finalAmount,
          discountAmount: discountAmount || 0,
        });
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
          
          // Use the provided amount (which includes plan-specific pricing)
          // Amount is already in rupees from client
          if (!amount || amount <= 0) {
            // Fallback: calculate from bundle priceMonthly if amount not provided
            const bundlePrice = typeof bundle.priceMonthly === 'bigint' ? Number(bundle.priceMonthly) : (bundle.priceMonthly || 0);
            finalAmount = bundlePrice / 100; // Convert from paise to rupees
            console.log('Using bundle default price (fallback):', {
              bundleId: bundle.id,
              bundleName: bundle.name,
              priceMonthly: bundlePrice,
              priceInRupees: finalAmount,
            });
          } else {
            // Use the amount provided by the client (already in rupees)
            finalAmount = amount;
            console.log('Using plan-specific bundle price from client:', {
              bundleId: bundle.id,
              bundleName: bundle.name,
              planName: planName,
              planPriceInRupees: finalAmount,
            });
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

    // Create Paygic token
    const token = await createPaygicToken();

    // Paygic expects amount in rupees (as a string)
    // finalAmount is already in rupees from client
    // Round to 2 decimal places for Paygic
    const amountInRupees = Math.round(finalAmount * 100) / 100;
    const amountForPaygic = amountInRupees.toString();
    
    console.log('Payment creation:', {
      amountInRupees: finalAmount,
      amountForPaygic,
      toolId,
      bundleId,
      planType,
      duration,
      discountAmount: discountAmount || 0,
      originalProvidedAmount: amount,
    });
    
    // Validate minimum amount for Paygic (minimum ₹1)
    if (amountInRupees < 1) {
      return NextResponse.json(
        { error: 'Amount too small. Minimum payment is ₹1' },
        { status: 400 }
      );
    }

    // Create payment request with Paygic
    const paygicResponse = await createPaygicPayment(token, {
      mid: process.env.PAYGIC_MERCHANT_ID!,
      amount: amountForPaygic,
      merchantReferenceId,
      customer_name: customerName || session.user.name || 'Customer',
      customer_email: customerEmail,
      customer_mobile: customerMobile.replace(/\D/g, ''), // Clean mobile number
    });

    // Save payment to database
    const paymentData: any = {
      userId: (session.user as any).id,
      toolId: toolId || null,
      planName: duration ? `${planName || 'Plan'} - ${
        duration === '1year' ? '1 Year' :
        duration === '6months' ? '6 Months' :
        duration === '3months' ? '3 Months' :
        '1 Month'
      }` : (planName || null),
      planType: planType || (toolId ? PlanType.SHARED : null), // Default to SHARED for tool purchases
      amount: Math.round(finalAmount * 100), // Store in paise (original amount before discount)
      discountAmount: discountAmount ? Math.round(discountAmount * 100) : 0, // Store discount in paise
      couponId: couponId || null,
      merchantReferenceId,
      paygicToken: token,
      upiIntent: paygicResponse.data.intent,
      phonePeLink: paygicResponse.data.phonePe,
      paytmLink: paygicResponse.data.paytm,
      gpayLink: paygicResponse.data.gpay,
      dynamicQR: paygicResponse.data.dynamicQR,
      customerName: customerName || session.user.name || null,
      customerEmail,
      customerMobile: customerMobile.replace(/\D/g, ''), // Clean mobile number
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes expiry
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
          upiIntent: paygicResponse.data.intent,
          phonePe: paygicResponse.data.phonePe,
          paytm: paygicResponse.data.paytm,
          gpay: paygicResponse.data.gpay,
          dynamicQR: paygicResponse.data.dynamicQR,
        },
        expiresAt: payment.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}

