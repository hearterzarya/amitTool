import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BundleForm } from "@/components/admin/bundle-form";
import { BundleDeleteButton } from "@/components/admin/bundle-delete-button";
import { Button } from "@/components/ui/button";
import { serializeBundle } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function EditBundlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [bundle, tools] = await Promise.all([
    prisma.bundle.findUnique({
      where: { id },
      include: { tools: true },
    }),
    prisma.tool.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!bundle) notFound();

  const initialToolIds = bundle.tools.sort((a, b) => a.sortOrder - b.sortOrder).map((bt) => bt.toolId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold">Edit Bundle</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Update bundle details and included tools</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/bundles">Back</Link>
          </Button>
          <BundleDeleteButton bundleId={bundle.id} bundleName={bundle.name} variant="destructive" showLabel />
        </div>
      </div>

      <BundleForm
        mode="edit"
        bundle={serializeBundle(bundle)}
        tools={tools}
        initialToolIds={initialToolIds}
      />
    </div>
  );
}

