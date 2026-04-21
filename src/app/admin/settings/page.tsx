import { prisma } from "@/lib/prisma";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  let metaPixelId: { value: string | null } | null = null;
  let metaPixelEnabled: { value: string | null } | null = null;
  let whatsappNumber: { value: string | null } | null = null;
  let productPopupEnabled: { value: string | null } | null = null;
  let productPopupToolSlug: { value: string | null } | null = null;
  let productPopupPageTarget: { value: string | null } | null = null;
  let productPopupTitle: { value: string | null } | null = null;
  let productPopupDescription: { value: string | null } | null = null;
  let activeTools: Array<{ id: string; name: string; slug: string }> = [];
  let tableMissing = false;

  try {
    [metaPixelId, metaPixelEnabled, whatsappNumber, productPopupEnabled, productPopupToolSlug, productPopupPageTarget, productPopupTitle, productPopupDescription] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: "meta_pixel_id" } }),
      prisma.appSetting.findUnique({ where: { key: "meta_pixel_enabled" } }),
      prisma.appSetting.findUnique({ where: { key: "whatsapp_number" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_enabled" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_tool_slug" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_page_target" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_title" } }),
      prisma.appSetting.findUnique({ where: { key: "product_popup_description" } }),
    ]);
    activeTools = await prisma.tool.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
      take: 200,
    });
  } catch (e: any) {
    if (e?.code === "P2021" || String(e?.message || "").includes("app_settings")) {
      tableMissing = true;
    } else {
      throw e;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400">Site-wide configuration</p>
      </div>

      {tableMissing && (
        <div className="border border-orange-200 bg-orange-50 text-orange-800 text-sm p-3 rounded-md">
          Settings storage isn’t created in this database yet. Run <code className="px-1 bg-orange-100 rounded">npx prisma db push</code> on the production database, then refresh.
        </div>
      )}

      <AdminSettingsForm
        initialMetaPixelId={metaPixelId?.value ?? ""}
        initialMetaPixelEnabled={(metaPixelEnabled?.value ?? "") === "true"}
        initialWhatsappNumber={whatsappNumber?.value ?? ""}
        initialProductPopupEnabled={(productPopupEnabled?.value ?? "") === "true"}
        initialProductPopupToolSlug={productPopupToolSlug?.value ?? ""}
        initialProductPopupPageTarget={(productPopupPageTarget?.value as "home" | "product" | "both") || "home"}
        initialProductPopupTitle={productPopupTitle?.value ?? ""}
        initialProductPopupDescription={productPopupDescription?.value ?? ""}
        activeTools={activeTools}
      />
    </div>
  );
}

