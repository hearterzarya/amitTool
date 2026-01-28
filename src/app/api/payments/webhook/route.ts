import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSubscriptionAfterPayment } from '@/lib/subscription-utils';
import { PlanType } from '@prisma/client';
import { sendOrderConfirmationEmail } from '@/lib/order-email';

/**
 * Paygic Webhook Handler
 * This endpoint receives payment status updates from Paygic
 * Documentation: https://docs.paygic.in/status-and-callback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Paygic webhook payload structure
    const {
      merchantReferenceId,
      paygicReferenceId,
      txnStatus,
      amount,
      successDate,
    } = body;

    if (!merchantReferenceId) {
      return NextResponse.json(
        { error: 'Missing merchantReferenceId' },
        { status: 400 }
      );
    }

    // Find payment in database
    const payment = await prisma.payment.findUnique({
      where: { merchantReferenceId },
      include: { 
        user: true, 
        tool: true,
        bundle: {
          include: {
            tools: {
              include: {
                tool: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      console.error(`Payment not found for merchantReferenceId: ${merchantReferenceId}`);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: txnStatus === 'SUCCESS' ? 'SUCCESS' : 
                txnStatus === 'FAILED' ? 'FAILED' : 
                txnStatus === 'EXPIRED' ? 'EXPIRED' : 'PENDING',
        txnStatus,
        paygicReferenceId: paygicReferenceId || payment.paygicReferenceId,
        successDate: successDate ? new Date(successDate) : payment.successDate,
      },
    });

    // If payment is successful, increment coupon usage count
    if (txnStatus === 'SUCCESS' && updatedPayment.status === 'SUCCESS' && updatedPayment.couponId) {
      try {
        await prisma.coupon.update({
          where: { id: updatedPayment.couponId },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      } catch (error) {
        console.error('Error updating coupon usage count:', error);
        // Don't fail webhook, just log error
      }
    }

    // If payment is successful, create or update subscription(s) and send email
    if (txnStatus === 'SUCCESS' && updatedPayment.status === 'SUCCESS') {
      if (updatedPayment.toolId) {
        // Single tool payment
        const planType = ((updatedPayment as any).planType || PlanType.SHARED) as PlanType;
        
        // Determine duration from payment planName or duration field
        // Check planName for duration indicators
        const planName = updatedPayment.planName?.toLowerCase() || '';
        let duration = 30; // Default to 1 month
        
        if (planName.includes('1 year') || planName.includes('year') || (updatedPayment as any).duration === '1year') {
          duration = 365;
        } else if (planName.includes('6 months') || planName.includes('6month') || (updatedPayment as any).duration === '6months') {
          duration = 180;
        } else if (planName.includes('3 months') || planName.includes('3month') || (updatedPayment as any).duration === '3months') {
          duration = 90;
        } else if (planName.includes('1 month') || planName.includes('1month') || (updatedPayment as any).duration === '1month') {
          duration = 30;
        }
        
        try {
          await createSubscriptionAfterPayment(
            payment.userId,
            updatedPayment.toolId,
            planType,
            updatedPayment.id,
            duration
          );
          
          // Send order confirmation email
          await sendOrderConfirmationEmail(updatedPayment.id);
        } catch (error: any) {
          console.error('Error creating subscription after payment:', error);
          // Don't fail webhook, log error for manual review
        }
      } else if (updatedPayment.bundleId && payment.bundle) {
        // Bundle payment - create subscriptions for all tools in bundle
        try {
          const planName = updatedPayment.planName || 'Monthly Plan';
          // Determine subscription period based on plan name
          let subscriptionDays = 30; // Default monthly
          if (planName.toLowerCase().includes('6-month') || planName.toLowerCase().includes('six')) {
            subscriptionDays = 180;
          } else if (planName.toLowerCase().includes('yearly') || planName.toLowerCase().includes('year')) {
            subscriptionDays = 365;
          }

          const now = new Date();
          const periodEnd = new Date(now);
          periodEnd.setDate(periodEnd.getDate() + subscriptionDays);

          // Create subscriptions for each tool in the bundle
          for (const bundleTool of payment.bundle.tools) {
            const toolId = bundleTool.toolId;
            
            // Check if subscription already exists
            const existingSubscription = await prisma.toolSubscription.findUnique({
              where: {
                userId_toolId: {
                  userId: payment.userId,
                  toolId,
                },
              },
            });

            if (existingSubscription) {
              // Update existing subscription
              await prisma.toolSubscription.update({
                where: { id: existingSubscription.id },
                data: {
                  planType: PlanType.SHARED,
                  status: 'ACTIVE',
                  activationStatus: 'ACTIVE',
                  currentPeriodStart: now,
                  currentPeriodEnd: periodEnd,
                  canceledAt: null,
                  cancelAtPeriodEnd: false,
                },
              });
            } else {
              // Create new subscription with SHARED plan (bundles use shared accounts)
              await createSubscriptionAfterPayment(
                payment.userId,
                toolId,
                PlanType.SHARED,
                updatedPayment.id
              );

              // Update subscription period if needed
              await prisma.toolSubscription.updateMany({
                where: {
                  userId: payment.userId,
                  toolId,
                  id: (await prisma.toolSubscription.findFirst({
                    where: {
                      userId: payment.userId,
                      toolId,
                    },
                    orderBy: { createdAt: 'desc' },
                  }))?.id || '',
                },
                data: {
                  currentPeriodStart: now,
                  currentPeriodEnd: periodEnd,
                },
              });
            }
          }

          console.log(`Created subscriptions for bundle ${payment.bundleId} with ${payment.bundle.tools.length} tools`);
          
          // Send order confirmation email for bundle
          await sendOrderConfirmationEmail(updatedPayment.id);
        } catch (error: any) {
          console.error('Error creating bundle subscriptions after payment:', error);
          // Don't fail webhook, log error for manual review
        }
      }
    }

    // Return success response to Paygic
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error: any) {
    console.error('Error processing Paygic webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Allow GET for webhook verification (if Paygic requires it)
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Paygic webhook endpoint is active',
  });
}

