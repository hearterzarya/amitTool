import { prisma } from "@/lib/prisma";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  let metaPixelId: { value: string | null } | null = null;
  let metaPixelEnabled: { value: string | null } | null = null;
  let tableMissing = false;

  try {
    [metaPixelId, metaPixelEnabled] = await Promise.all([
      prisma.appSetting.findUnique({ where: { key: "meta_pixel_id" } }),
      prisma.appSetting.findUnique({ where: { key: "meta_pixel_enabled" } }),
    ]);
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
      />
    </div>
  );
}

