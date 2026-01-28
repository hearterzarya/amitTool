import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const data = await req.json();
    const toolIds: string[] = Array.isArray(data.toolIds) ? data.toolIds : [];

    const updated = await prisma.$transaction(async (tx) => {
      const bundle = await tx.bundle.update({
        where: { id },
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription || null,
          icon: data.icon || null,
          priceMonthly: data.priceMonthly,
          priceSixMonth: data.priceSixMonth ?? null,
          priceYearly: data.priceYearly ?? null,
          features: data.features || null,
          targetAudience: data.targetAudience || null,
          isActive: data.isActive ?? true,
          isTrending: data.isTrending ?? false,
          sortOrder: data.sortOrder || 0,
        },
      });

      await tx.bundleTool.deleteMany({ where: { bundleId: id } });

      if (toolIds.length > 0) {
        await tx.bundleTool.createMany({
          data: toolIds.map((toolId, idx) => ({
            bundleId: id,
            toolId,
            sortOrder: idx,
          })),
          skipDuplicates: true,
        });
      }

      return bundle;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating bundle:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A bundle with this slug already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update bundle", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.bundle.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting bundle:", error);
    return NextResponse.json(
      { error: "Failed to delete bundle", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

