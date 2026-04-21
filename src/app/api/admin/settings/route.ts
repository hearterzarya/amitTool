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
  let whatsappNumber: { value: string | null } | null = null;
  let popupEnabled: { value: string | null } | null = null;
  let popupToolSlug: { value: string | null } | null = null;
  let popupPageTarget: { value: string | null } | null = null;
  let popupTitle: { value: string | null } | null = null;
  let popupDescription: { value: string | null } | null = null;
  try {
    [metaPixelId, metaPixelEnabled, whatsappNumber, popupEnabled, popupToolSlug, popupPageTarget, popupTitle, popupDescription] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: "meta_pixel_id" } }),
      prisma.appSetting.findUnique({ where: { key: "meta_pixel_enabled" } }),
      prisma.appSetting.findUnique({ where: { key: "whatsapp_number" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_enabled" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_tool_slug" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_page_target" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_title" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_description" } }),
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
    whatsappNumber: whatsappNumber?.value ?? "",
    productPopupEnabled: (popupEnabled?.value ?? "") === "true",
    productPopupToolSlug: popupToolSlug?.value ?? "",
    productPopupPageTarget: popupPageTarget?.value || "home",
    productPopupTitle: popupTitle?.value ?? "",
    productPopupDescription: popupDescription?.value ?? "",
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
  const whatsappNumber = String(data.whatsappNumber ?? "").trim();
  const productPopupEnabled = !!data.productPopupEnabled;
  const productPopupToolSlug = String(data.productPopupToolSlug ?? "").trim();
  const productPopupPageTarget =
    data.productPopupPageTarget === "product" || data.productPopupPageTarget === "both"
      ? data.productPopupPageTarget
      : "home";
  const productPopupTitle = String(data.productPopupTitle ?? "").trim();
  const productPopupDescription = String(data.productPopupDescription ?? "").trim();

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
      prisma.appSetting.upsert({
        where: { key: "whatsapp_number" },
        create: { key: "whatsapp_number", value: whatsappNumber || null },
        update: { value: whatsappNumber || null },
      }),
      prisma.appSetting.upsert({
        where: { key: "product_popup_enabled" },
        create: { key: "product_popup_enabled", value: productPopupEnabled ? "true" : "false" },
        update: { value: productPopupEnabled ? "true" : "false" },
      }),
      prisma.appSetting.upsert({
        where: { key: "product_popup_tool_slug" },
        create: { key: "product_popup_tool_slug", value: productPopupToolSlug || null },
        update: { value: productPopupToolSlug || null },
      }),
      prisma.appSetting.upsert({
        where: { key: "product_popup_page_target" },
        create: { key: "product_popup_page_target", value: productPopupPageTarget },
        update: { value: productPopupPageTarget },
      }),
      prisma.appSetting.upsert({
        where: { key: "product_popup_title" },
        create: { key: "product_popup_title", value: productPopupTitle || null },
        update: { value: productPopupTitle || null },
      }),
      prisma.appSetting.upsert({
        where: { key: "product_popup_description" },
        create: { key: "product_popup_description", value: productPopupDescription || null },
        update: { value: productPopupDescription || null },
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

