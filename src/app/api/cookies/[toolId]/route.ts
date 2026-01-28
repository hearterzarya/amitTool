import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptCookies } from "@/lib/encryption";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolId } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // TEST_USER and ADMIN can bypass subscription check
    const isTestUser = userRole === 'TEST_USER' || userRole === 'ADMIN';

    let subscription = null;
    let tool = null;

    if (isTestUser) {
      // For test users, fetch tool directly without subscription check
      tool = await prisma.tool.findUnique({
        where: { id: toolId },
      });

      if (!tool) {
        return NextResponse.json(
          { error: "Tool not found" },
          { status: 404 }
        );
      }
    } else {
      // For regular users, check if they have active subscription
      subscription = await prisma.toolSubscription.findFirst({
        where: {
          userId: userId,
          toolId: toolId,
          status: "ACTIVE",
        },
        include: {
          tool: true,
        },
      });

      if (!subscription) {
        return NextResponse.json(
          { error: "No active subscription found for this tool" },
          { status: 403 }
        );
      }

      tool = subscription.tool;
    }

    // Check if tool has cookies configured
    if (!tool.cookiesEncrypted) {
      return NextResponse.json(
        { error: "Cookies not configured for this tool" },
        { status: 404 }
      );
    }

    // Decrypt cookies
    const cookies = decryptCookies(tool.cookiesEncrypted);

    // Base64 encode cookies for extension (extension expects base64 encoded JSON)
    const cookiesJson = JSON.stringify(cookies);
    const cookiesBase64 = Buffer.from(cookiesJson).toString('base64');

    return NextResponse.json({
      cookies: cookiesBase64,
      url: tool.toolUrl,
    });
  } catch (error) {
    console.error("Error fetching cookies:", error);
    return NextResponse.json(
      { error: "Failed to fetch cookies" },
      { status: 500 }
    );
  }
}
