import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createPaygicToken, checkPaygicStatus } from '@/lib/paygic';
import { createSubscriptionAfterPayment } from '@/lib/subscription-utils';
import { PlanType } from '@prisma/client';
import { sendOrderConfirmationEmail } from '@/lib/order-email';

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
    const { merchantReferenceId } = body;

    if (!merchantReferenceId) {
      return NextResponse.json(
        { error: 'Merchant reference ID is required' },
        { status: 400 }
      );
    }

    // Get payment from database
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
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Verify user owns this payment
    if (payment.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // If already successful, return cached status
    if (payment.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        payment: {
          id: payment.id,
          merchantReferenceId: payment.merchantReferenceId,
          status: payment.status,
          amount: payment.amount,
          successDate: payment.successDate,
        },
      });
    }

    // Check status with Paygic
    const token = payment.paygicToken || await createPaygicToken();
    const statusResponse = await checkPaygicStatus(token, merchantReferenceId);

    // Update payment status in database
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: statusResponse.txnStatus === 'SUCCESS' ? 'SUCCESS' : 
                statusResponse.txnStatus === 'FAILED' ? 'FAILED' : 
                statusResponse.txnStatus === 'EXPIRED' ? 'EXPIRED' : 'PENDING',
        txnStatus: statusResponse.txnStatus,
        paygicReferenceId: statusResponse.data?.paygicReferenceId || payment.paygicReferenceId,
        successDate: statusResponse.data?.successDate 
          ? new Date(statusResponse.data.successDate) 
          : payment.successDate,
      },
    });

    // If payment is successful, create subscription(s)
    if (statusResponse.txnStatus === 'SUCCESS' && updatedPayment.status === 'SUCCESS') {
      if (updatedPayment.toolId) {
        // Single tool payment
        const planType = ((updatedPayment as any).planType || PlanType.SHARED) as PlanType;
        
        try {
          await createSubscriptionAfterPayment(
            payment.userId,
            updatedPayment.toolId,
            planType,
            updatedPayment.id
          );
          
          // Send order confirmation email
          await sendOrderConfirmationEmail(updatedPayment.id);
        } catch (error: any) {
          console.error('Error creating subscription after payment:', error);
          // Continue to return payment status even if subscription creation fails
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
              const newSubscription = await prisma.toolSubscription.findFirst({
                where: {
                  userId: payment.userId,
                  toolId,
                },
                orderBy: { createdAt: 'desc' },
              });

              if (newSubscription) {
                await prisma.toolSubscription.update({
                  where: { id: newSubscription.id },
                  data: {
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                  },
                });
              }
            }
          }

          console.log(`Created subscriptions for bundle ${payment.bundleId} with ${payment.bundle.tools.length} tools`);
          
          // Send order confirmation email for bundle
          await sendOrderConfirmationEmail(updatedPayment.id);
        } catch (error: any) {
          console.error('Error creating bundle subscriptions after payment:', error);
          // Continue to return payment status even if subscription creation fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        merchantReferenceId: updatedPayment.merchantReferenceId,
        status: updatedPayment.status,
        txnStatus: updatedPayment.txnStatus,
        amount: updatedPayment.amount,
        successDate: updatedPayment.successDate,
        toolId: updatedPayment.toolId,
        bundleId: updatedPayment.bundleId,
      },
    });
  } catch (error: any) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    );
  }
}

