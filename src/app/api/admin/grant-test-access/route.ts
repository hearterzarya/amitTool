import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Grant test access to a user
 * This allows the user to access all tools without payment
 * Only admins can grant test access
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, email } = await req.json();

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Either userId or email is required" },
        { status: 400 }
      );
    }

    // Find user by userId or email
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user role to TEST_USER
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "TEST_USER" as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test access granted to ${updatedUser.email}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    console.error("Error granting test access:", error);
    return NextResponse.json(
      { error: "Failed to grant test access" },
      { status: 500 }
    );
  }
}

/**
 * Revoke test access from a user
 */
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, email } = await req.json();

    if (!userId && !email) {
      return NextResponse.json(
        { error: "Either userId or email is required" },
        { status: 400 }
      );
    }

    // Find user by userId or email
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user role back to USER
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: "USER" as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Test access revoked from ${updatedUser.email}`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    console.error("Error revoking test access:", error);
    return NextResponse.json(
      { error: "Failed to revoke test access" },
      { status: 500 }
    );
  }
}

