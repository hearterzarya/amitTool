import { prisma } from "@/lib/prisma";
import { BundleForm } from "@/components/admin/bundle-form";

export const dynamic = "force-dynamic";

export default async function NewBundlePage() {
  const tools = await prisma.tool.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add New Bundle</h2>
        <p className="text-gray-600 dark:text-gray-400">Create a new bundle offer</p>
      </div>

      <BundleForm mode="create" tools={tools} initialToolIds={[]} />
    </div>
  );
}

