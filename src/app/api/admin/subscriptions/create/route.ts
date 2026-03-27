import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PlanType } from "@prisma/client";
import { ActivationStatus } from "@prisma/client";

// Helper to get or create shared credentials
async function getOrCreateSharedCredentials(toolId: string) {
    // Find an existing shared account with available slots ( < 5)
    // Logic copied/adapted from subscription-utils to ensure consistency
    // In a real app, we should export this from utils, but here we inline for safety/speed without refactoring utils yet
    const existingShared = await prisma.sharedCredentials.findFirst({
        where: {
            subscription: {
                toolId,
                planType: "SHARED",
                activationStatus: "ACTIVE",
            },
            currentUsers: { lt: 5 },
        },
        include: {
            subscription: true,
        },
        orderBy: {
            currentUsers: "asc",
        },
    });

    if (existingShared && existingShared.currentUsers < 5) {
        const updated = await prisma.sharedCredentials.update({
            where: { id: existingShared.id },
            data: {
                currentUsers: existingShared.currentUsers + 1,
            },
        });

        return {
            email: existingShared.email,
            password: existingShared.password,
            sharedAccountId: existingShared.sharedAccountId,
            currentUsers: updated.currentUsers,
            poolId: existingShared.id // keep track of which pool we used
        };
    }

    // Create new pool placeholder
    const sharedAccountId = `shared-${toolId}-${Date.now()}`;
    return {
        email: `shared-${toolId}@example.com`,
        password: 'PLACEHOLDER_PASSWORD',
        sharedAccountId,
        currentUsers: 0,
        poolId: null // New pool needed
    };
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || (session.user as any).role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { userId, toolId, bundleId, planType, expiryDate } = body;

        if (!userId || (!toolId && !bundleId) || !expiryDate) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date(expiryDate);

        const selectedPlanType = (planType as PlanType) || "SHARED";

        // Prepare list of tools to subscribe to
        let toolIdsToSubscribe: string[] = [];

        if (bundleId) {
            const bundleTools = await prisma.bundleTool.findMany({
                where: { bundleId },
                select: { toolId: true },
            });
            toolIdsToSubscribe = bundleTools.map((bt) => bt.toolId);
        } else if (toolId) {
            toolIdsToSubscribe = [toolId];
        }

        const itemsCreated = [];

        for (const tid of toolIdsToSubscribe) {
            // Check if subscription exists
            const existingSub = await prisma.toolSubscription.findUnique({
                where: {
                    userId_toolId: {
                        userId,
                        toolId: tid
                    }
                }
            });

            if (existingSub) {
                // Update existing
                const updated = await prisma.toolSubscription.update({
                    where: { id: existingSub.id },
                    data: {
                        planType: selectedPlanType,
                        status: "ACTIVE",
                        activationStatus: selectedPlanType === "SHARED" ? "ACTIVE" : "PENDING", // Private still needs manual creds input unless we add that to this flow
                        currentPeriodStart,
                        currentPeriodEnd,
                        canceledAt: null,
                    }
                });
                itemsCreated.push(updated);
            } else {
                // Create new
                const data: any = {
                    userId,
                    toolId: tid,
                    planType: selectedPlanType,
                    status: "ACTIVE",
                    activationStatus: selectedPlanType === "SHARED" ? "ACTIVE" : "PENDING",
                    currentPeriodStart,
                    currentPeriodEnd,
                };

                // If Shared, handle credentials
                if (selectedPlanType === "SHARED") {
                    const creds = await getOrCreateSharedCredentials(tid);

                    // If we're reusing an existing pool, we don't create a NEW SharedCredentials record linked primarily to this sub?
                    // Wait, Schema says: SharedCredentials `subscriptionId` @unique.
                    // This implies 1 SharedCredentials record PER Subscription.
                    // BUT it links to a `sharedAccountId`.
                    // Ah, looking at schema:
                    // model SharedCredentials { id, subscriptionId, email, password, sharedAccountId ... }
                    // So yes, every user gets their own SharedCredentials row, but `sharedAccountId` groups them?
                    // And `email/pass` are copied there.

                    data.sharedCredentials = {
                        create: {
                            email: creds.email,
                            password: creds.password,
                            sharedAccountId: creds.sharedAccountId,
                            maxUsers: 5,
                            currentUsers: creds.poolId ? creds.currentUsers : 1, // This logic in schema seems slightly flawed if 'currentUsers' is stored on the PER USER record. 
                            // Actually schema says: `SharedCredentials` has `currentUsers`.
                            // If `SharedCredentials` is 1:1 with Subscription, then `currentUsers` stored there is weird if it represents the POOL count.
                            // It seems the schema design stores the pool state on the individual record? Or finds the pool by `sharedAccountId`.
                            // Let's stick to the pattern: Create a SharedCredentials record for this user.
                        }
                    };
                }

                const created = await prisma.toolSubscription.create({
                    data
                });
                itemsCreated.push(created);
            }
        }

        // Update user status
        await prisma.user.update({
            where: { id: userId },
            data: { status: "ACTIVE" }
        });

        // Log action
        await prisma.adminLog.create({
            data: {
                adminId: (session.user as any).id,
                action: "GRANTED_ACCESS",
                details: `Granted ${selectedPlanType} access to user ${userId} for ${bundleId ? `Bundle ${bundleId}` : `Tool ${toolId}`}`,
            },
        });

        return NextResponse.json({ success: true, count: itemsCreated.length });

    } catch (error: any) {
        console.error("Error creating subscription:", error);
        return NextResponse.json(
            { error: "Failed to create subscription" },
            { status: 500 }
        );
    }
}
