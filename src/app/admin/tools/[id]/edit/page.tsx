import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ToolForm } from "@/components/admin/tool-form";
import { CookieManager } from "@/components/admin/cookie-manager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { serializeTool } from "@/lib/utils";

export default async function EditToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tool = await prisma.tool.findUnique({
    where: { id },
  });

  if (!tool) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Edit Tool</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>Tool ID:</span>
            <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-xs">
              {tool.id}
            </code>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Update tool details and manage cookies
        </p>
      </div>

      <ToolForm mode="edit" tool={serializeTool(tool)} />

      <Card>
        <CardHeader>
          <CardTitle>Cookie Management</CardTitle>
          <CardDescription>
            Manage authentication cookies for this tool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CookieManager tool={tool} />
        </CardContent>
      </Card>
    </div>
  );
}
