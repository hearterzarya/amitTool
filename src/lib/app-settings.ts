import { prisma } from "@/lib/prisma";

export type AppSettingKey = "meta_pixel_id" | "meta_pixel_enabled";

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

