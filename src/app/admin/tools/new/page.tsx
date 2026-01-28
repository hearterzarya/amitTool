import { ToolForm } from "@/components/admin/tool-form";

export default function NewToolPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Add New Tool</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create a new tool for users to subscribe to
        </p>
      </div>

      <ToolForm mode="create" />
    </div>
  );
}
