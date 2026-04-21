import { prisma } from "@/lib/prisma";
import { brand } from "@/lib/brand";

export type AppSettingKey =
  | "meta_pixel_id"
  | "meta_pixel_enabled"
  | "whatsapp_number"
  | "product_popup_enabled"
  | "product_popup_tool_slug"
  | "product_popup_page_target"
  | "product_popup_title"
  | "product_popup_description";

// Cache table existence check to avoid repeated queries
let tableExistsCache: boolean | null = null;

async function checkTableExists(): Promise<boolean> {
  if (tableExistsCache !== null) return tableExistsCache;
  
  try {
    // Use raw SQL to check if table exists without triggering Prisma errors
    const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_settings'
      ) as exists`
    );
    tableExistsCache = result[0]?.exists ?? false;
    return tableExistsCache;
  } catch {
    tableExistsCache = false;
    return false;
  }
}

export async function getAppSettingValue(key: AppSettingKey): Promise<string | null> {
  try {
    // Check if table exists first to avoid Prisma error logs
    const tableExists = await checkTableExists();
    if (!tableExists) {
      return null;
    }
    
    const row = await prisma.appSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch (e: any) {
    // Fallback: If the table doesn't exist yet (fresh DB / not migrated), don't crash the whole app.
    if (e?.code === "P2021" || String(e?.message || "").includes("app_settings")) {
      tableExistsCache = false; // Cache the fact that table doesn't exist
      return null;
    }
    throw e;
  }
}

export async function getBooleanAppSetting(key: AppSettingKey): Promise<boolean> {
  const v = await getAppSettingValue(key);
  return v === "true" || v === "1" || v === "yes";
}

export async function getMetaPixelConfig(): Promise<{ enabled: boolean; pixelId: string | null }> {
  try {
    const [enabled, pixelId] = await Promise.all([
      getBooleanAppSetting("meta_pixel_enabled"),
      getAppSettingValue("meta_pixel_id"),
    ]);
    return { enabled, pixelId };
  } catch (e: any) {
    if (e?.code === "P2021" || String(e?.message || "").includes("app_settings")) {
      return { enabled: false, pixelId: null };
    }
    throw e;
  }
}

/** Contact info (WhatsApp / support) from admin settings or brand fallback */
export type ContactInfo = { whatsappNumber: string; supportPhone: string };

export async function getContactInfo(): Promise<ContactInfo> {
  try {
    const raw = await getAppSettingValue("whatsapp_number");
    const digits = raw?.replace(/\D/g, "") ?? "";
    if (digits.length >= 10) {
      const whatsappNumber = digits.startsWith("91") ? digits : `91${digits}`;
      const supportPhone =
        whatsappNumber.length === 12 && whatsappNumber.startsWith("91")
          ? `+91 ${whatsappNumber.slice(2, 7)} ${whatsappNumber.slice(7)}`
          : `+${whatsappNumber}`;
      return { whatsappNumber, supportPhone };
    }
  } catch {
    // fallback to brand
  }
  return {
    whatsappNumber: brand.whatsappNumber,
    supportPhone: brand.supportPhone,
  };
}

export type ProductPopupConfig = {
  enabled: boolean;
  pageTarget: "home" | "product" | "both";
  title: string;
  description: string;
  tool: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    icon: string | null;
  } | null;
};

export async function getProductPopupConfig(): Promise<ProductPopupConfig> {
  const fallback: ProductPopupConfig = {
    enabled: false,
    pageTarget: "home",
    title: "Featured Product",
    description: "Check this recommended product.",
    tool: null,
  };
  try {
    const [enabledRaw, toolSlugRaw, pageTargetRaw, titleRaw, descriptionRaw] = await Promise.all([
      getAppSettingValue("product_popup_enabled"),
      getAppSettingValue("product_popup_tool_slug"),
      getAppSettingValue("product_popup_page_target"),
      getAppSettingValue("product_popup_title"),
      getAppSettingValue("product_popup_description"),
    ]);

    const enabled = enabledRaw === "true";
    const toolSlug = String(toolSlugRaw || "").trim();
    const pageTarget = pageTargetRaw === "product" || pageTargetRaw === "both" ? pageTargetRaw : "home";
    if (!enabled || !toolSlug) {
      return {
        ...fallback,
        enabled,
        pageTarget,
        title: titleRaw?.trim() || fallback.title,
        description: descriptionRaw?.trim() || fallback.description,
      };
    }

    const tool = await prisma.tool.findUnique({
      where: { slug: toolSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        icon: true,
      },
    });

    return {
      enabled: !!tool,
      pageTarget,
      title: titleRaw?.trim() || `Try ${tool?.name || "this product"}`,
      description: descriptionRaw?.trim() || tool?.shortDescription || fallback.description,
      tool: tool || null,
    };
  } catch {
    return fallback;
  }
}

