import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptCookies } from "@/lib/encryption";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { cookies, expiryDate } = await req.json();

    // Encrypt cookies
    const encrypted = encryptCookies(cookies);

    // Update tool with encrypted cookies
    const tool = await prisma.tool.update({
      where: { id },
      data: {
        cookiesEncrypted: encrypted,
        cookiesUpdatedAt: new Date(),
        cookiesExpiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        adminId: (session.user as any).id,
        action: "UPDATED_COOKIES",
        toolId: id,
        details: `Updated cookies for ${tool.name}`,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Cookies updated successfully'
    });
  } catch (error) {
    console.error("Error updating cookies:", error);
    return NextResponse.json(
      { error: "Failed to update cookies" },
      { status: 500 }
    );
  }
}
