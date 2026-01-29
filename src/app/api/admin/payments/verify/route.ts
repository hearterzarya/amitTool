import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Admin endpoint to verify payment status.
 * Used for manual verification or status checks.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { merchantReferenceId } = body;

    if (!merchantReferenceId) {
      return NextResponse.json(
        { error: "Merchant reference ID is required" },
        { status: 400 }
      );
    }

    // Import here to avoid circular deps; verify is optional
    const { prisma } = await import("@/lib/prisma");
    const payment = await prisma.payment.findUnique({
      where: { merchantReferenceId },
      include: { user: true, tool: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        merchantReferenceId: payment.merchantReferenceId,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    console.error("Admin payment verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with merchantReferenceId." },
    { status: 405 }
  );
}
