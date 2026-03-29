import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { PlanType, ActivationStatus } from "@prisma/client";
import { getOrCreateSharedCredentials } from "@/lib/subscription-utils";

/** Parse YYYY-MM-DD as end-of-day in local server time (avoids UTC-only date bugs). */
function parseExpiryDate(expiryDate: string): Date {
  const parts = expiryDate.trim().split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date(expiryDate);
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      userId,
      toolId,
      bundleId,
      planType,
      expiryDate,
      privateEmail,
      privatePassword,
    } = body;

    if (!userId || (!toolId && !bundleId) || !expiryDate) {
      return NextResponse.json(
        { error: "Missing required fields: user, tool or bundle, and expiry date" },
        { status: 400 }
      );
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = parseExpiryDate(expiryDate);

    if (currentPeriodEnd.getTime() < currentPeriodStart.getTime()) {
      return NextResponse.json(
        { error: "Expiry date must be today or in the future" },
        { status: 400 }
      );
    }

    const selectedPlanType = ((planType as PlanType) || "SHARED") as PlanType;
    const privateProvided =
      typeof privateEmail === "string" &&
      typeof privatePassword === "string" &&
      privateEmail.trim().length > 0 &&
      privatePassword.length > 0;

    if (selectedPlanType === "PRIVATE" && !privateProvided) {
      return NextResponse.json(
        {
          error:
            "Private plan requires account email and password so access can be activated immediately. Fill both fields or choose Shared plan.",
        },
        { status: 400 }
      );
    }

    let toolIdsToSubscribe: string[] = [];

    if (bundleId) {
      const bundleTools = await prisma.bundleTool.findMany({
        where: { bundleId },
        select: { toolId: true },
      });
      toolIdsToSubscribe = bundleTools.map((bt) => bt.toolId);
      if (toolIdsToSubscribe.length === 0) {
        return NextResponse.json(
          { error: "This bundle has no tools linked" },
          { status: 400 }
        );
      }
    } else if (toolId) {
      toolIdsToSubscribe = [toolId];
    }

    const itemsCreated = [];
    const adminId = (session.user as any).id;

    for (const tid of toolIdsToSubscribe) {
      const existingSub = await prisma.toolSubscription.findUnique({
        where: {
          userId_toolId: {
            userId,
            toolId: tid,
          },
        },
        include: {
          sharedCredentials: true,
          privateCredentials: true,
        },
      });

      if (existingSub) {
        if (selectedPlanType === "SHARED") {
          const updateData: Parameters<
            typeof prisma.toolSubscription.update
          >[0]["data"] = {
            planType: PlanType.SHARED,
            status: "ACTIVE",
            activationStatus: ActivationStatus.ACTIVE,
            currentPeriodStart,
            currentPeriodEnd,
            canceledAt: null,
          };

          if (existingSub.privateCredentials) {
            updateData.privateCredentials = { delete: true };
          }

          if (!existingSub.sharedCredentials) {
            const shared = await getOrCreateSharedCredentials(tid);
            updateData.sharedCredentials = {
              create: {
                email: shared.email,
                password: shared.password,
                sharedAccountId: shared.sharedAccountId,
                maxUsers: 5,
                currentUsers: shared.currentUsers + 1,
              },
            };
          }

          const updated = await prisma.toolSubscription.update({
            where: { id: existingSub.id },
            data: updateData,
          });
          itemsCreated.push(updated);
        } else {
          const updated = await prisma.toolSubscription.update({
            where: { id: existingSub.id },
            data: {
              planType: PlanType.PRIVATE,
              status: "ACTIVE",
              activationStatus: ActivationStatus.ACTIVE,
              currentPeriodStart,
              currentPeriodEnd,
              canceledAt: null,
              activatedAt: new Date(),
              activatedBy: adminId,
              sharedCredentials: existingSub.sharedCredentials
                ? { delete: true }
                : undefined,
              privateCredentials: existingSub.privateCredentials
                ? {
                    update: {
                      email: privateEmail.trim(),
                      password: privatePassword,
                    },
                  }
                : {
                    create: {
                      email: privateEmail.trim(),
                      password: privatePassword,
                    },
                  },
            },
          });
          itemsCreated.push(updated);
        }
      } else {
        if (selectedPlanType === "SHARED") {
          const shared = await getOrCreateSharedCredentials(tid);
          const created = await prisma.toolSubscription.create({
            data: {
              userId,
              toolId: tid,
              planType: PlanType.SHARED,
              status: "ACTIVE",
              activationStatus: ActivationStatus.ACTIVE,
              currentPeriodStart,
              currentPeriodEnd,
              sharedCredentials: {
                create: {
                  email: shared.email,
                  password: shared.password,
                  sharedAccountId: shared.sharedAccountId,
                  maxUsers: 5,
                  currentUsers: shared.currentUsers + 1,
                },
              },
            },
          });
          itemsCreated.push(created);
        } else {
          const created = await prisma.toolSubscription.create({
            data: {
              userId,
              toolId: tid,
              planType: PlanType.PRIVATE,
              status: "ACTIVE",
              activationStatus: ActivationStatus.ACTIVE,
              currentPeriodStart,
              currentPeriodEnd,
              activatedAt: new Date(),
              activatedBy: adminId,
              privateCredentials: {
                create: {
                  email: privateEmail.trim(),
                  password: privatePassword,
                },
              },
            },
          });
          itemsCreated.push(created);
        }
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    await prisma.adminLog.create({
      data: {
        adminId,
        action: "GRANTED_ACCESS",
        details: `Granted ${selectedPlanType} access to user ${userId} for ${
          bundleId ? `Bundle ${bundleId}` : `Tool ${toolId}`
        }`,
      },
    });

    return NextResponse.json({
      success: true,
      count: itemsCreated.length,
    });
  } catch (error: unknown) {
    console.error("Error creating subscription:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
