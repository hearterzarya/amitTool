import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    const toolIds: string[] = Array.isArray(data.toolIds) ? data.toolIds : [];

    const bundle = await prisma.$transaction(async (tx) => {
      const created = await tx.bundle.create({
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

      if (toolIds.length > 0) {
        await tx.bundleTool.createMany({
          data: toolIds.map((toolId, idx) => ({
            bundleId: created.id,
            toolId,
            sortOrder: idx,
          })),
          skipDuplicates: true,
        });
      }

      return created;
    });

    return NextResponse.json(bundle, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bundle:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A bundle with this slug already exists" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to create bundle", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

