import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function requireAdmin(session: any) {
  return !!session && (session.user as any)?.role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let metaPixelId: { value: string | null } | null = null;
  let metaPixelEnabled: { value: string | null } | null = null;
  try {
    [metaPixelId, metaPixelEnabled] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: "meta_pixel_id" } }),
      prisma.appSetting.findUnique({ where: { key: "meta_pixel_enabled" } }),
    ]);
  } catch (e: any) {
    if (e?.code === "P2021" || String(e?.message || "").includes("app_settings")) {
      // Not migrated yet
      return NextResponse.json(
        { error: "Settings table missing. Run: npx prisma db push", code: "SETTINGS_TABLE_MISSING" },
        { status: 503 }
      );
    }
    throw e;
  }

  return NextResponse.json({
    metaPixelId: metaPixelId?.value ?? "",
    metaPixelEnabled: (metaPixelEnabled?.value ?? "") === "true",
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const metaPixelId = String(data.metaPixelId ?? "").trim();
  const metaPixelEnabled = !!data.metaPixelEnabled;

  try {
    await prisma.$transaction([
      prisma.appSetting.upsert({
        where: { key: "meta_pixel_id" },
        create: { key: "meta_pixel_id", value: metaPixelId || null },
        update: { value: metaPixelId || null },
      }),
      prisma.appSetting.upsert({
        where: { key: "meta_pixel_enabled" },
        create: { key: "meta_pixel_enabled", value: metaPixelEnabled ? "true" : "false" },
        update: { value: metaPixelEnabled ? "true" : "false" },
      }),
    ]);
  } catch (e: any) {
    if (e?.code === "P2021" || String(e?.message || "").includes("app_settings")) {
      return NextResponse.json(
        { error: "Settings table missing. Run: npx prisma db push", code: "SETTINGS_TABLE_MISSING" },
        { status: 503 }
      );
    }
    throw e;
  }

  return NextResponse.json({ success: true });
}

