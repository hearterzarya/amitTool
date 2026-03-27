import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSubscriptionAfterPayment } from "@/lib/subscription-utils";
import { sendOrderConfirmationEmail } from "@/lib/order-email";
import { PlanType } from "@prisma/client";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = (session.user as any).role;
        if (userRole !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden - Admin access required" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { paymentId, action } = body;

        if (!paymentId || !action) {
            return NextResponse.json(
                { error: "Payment ID and action are required" },
                { status: 400 }
            );
        }

        if (action === "approve") {
            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
                include: {
                    user: true,
                    bundle: {
                        include: {
                            tools: {
                                include: { tool: true }
                            }
                        }
                    }
                }
            });

            if (!payment) {
                return NextResponse.json(
                    { error: "Payment not found" },
                    { status: 404 }
                );
            }

            if (payment.status === "SUCCESS") {
                return NextResponse.json(
                    { error: "Payment is already successful" },
                    { status: 400 }
                );
            }

            // Update payment status
            const updatedPayment = await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: "SUCCESS",
                    successDate: new Date(),
                    txnStatus: "SUCCESS", // Adding redundancy for compatibility
                },
            });

            // Activate Subscription
            // If payment is successful, create or update subscription(s) and send email
            if (updatedPayment.status === "SUCCESS") {
                if (updatedPayment.toolId) {
                    // Single tool payment
                    const planType = ((updatedPayment as any).planType || PlanType.SHARED) as PlanType;

                    // Determine duration from payment planName or duration field
                    const planName = updatedPayment.planName?.toLowerCase() || '';
                    let duration = 30; // Default to 1 month

                    // Try to infer duration from plan name logic similar to webhook
                    if (planName.includes('1 year') || planName.includes('year')) {
                        duration = 365;
                    } else if (planName.includes('6 months') || planName.includes('6month')) {
                        duration = 180;
                    } else if (planName.includes('3 months') || planName.includes('3month')) {
                        duration = 90;
                    } else if (planName.includes('1 month') || planName.includes('1month')) {
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
                        console.error('Error creating subscription after payment approval:', error);
                        // Log error but success response returned
                    }
                } else if (updatedPayment.bundleId && payment.bundle) {
                    // Bundle payment logic
                    try {
                        const planName = updatedPayment.planName || 'Monthly Plan';
                        let subscriptionDays = 30;
                        if (planName.toLowerCase().includes('6-month') || planName.toLowerCase().includes('six')) {
                            subscriptionDays = 180;
                        } else if (planName.toLowerCase().includes('yearly') || planName.toLowerCase().includes('year')) {
                            subscriptionDays = 365;
                        }

                        const now = new Date();
                        const periodEnd = new Date(now);
                        periodEnd.setDate(periodEnd.getDate() + subscriptionDays);

                        for (const bundleTool of payment.bundle.tools) {
                            const toolId = bundleTool.toolId;

                            const existingSubscription = await prisma.toolSubscription.findUnique({
                                where: {
                                    userId_toolId: {
                                        userId: payment.userId,
                                        toolId,
                                    },
                                },
                            });

                            if (existingSubscription) {
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
                                await createSubscriptionAfterPayment(
                                    payment.userId,
                                    toolId,
                                    PlanType.SHARED,
                                    updatedPayment.id
                                );

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
                        await sendOrderConfirmationEmail(updatedPayment.id);
                    } catch (error: any) {
                        console.error('Error creating bundle subscriptions after approval:', error);
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: "Payment approved and subscription activated",
            });
        }

        if (action === "reject") {
            // Just mark as FAILED
            const updatedPayment = await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    status: "FAILED",
                    txnStatus: "REJECTED_BY_ADMIN",
                },
            });
            return NextResponse.json({
                success: true,
                message: "Payment rejected",
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: any) {
        console.error("Admin payment approval error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
