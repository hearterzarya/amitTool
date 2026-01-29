'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface BundleDeleteButtonProps {
  bundleId: string;
  bundleName: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function BundleDeleteButton({
  bundleId,
  bundleName,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: BundleDeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/bundles/${bundleId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete bundle");
      }
      setConfirmOpen(false);
      router.push("/admin/bundles");
      router.refresh();
    } catch (e: any) {
      alert(e.message || "Failed to delete bundle");
    } finally {
      setDeleting(false);
    }
  };

  if (!confirmOpen) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirmOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-1.5" />
        {showLabel && "Delete"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-foreground/80">Delete &quot;{bundleName}&quot;?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={deleting}
        onClick={handleDelete}
      >
        {deleting ? "Deleting..." : "Yes, delete"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={deleting}
        onClick={() => setConfirmOpen(false)}
      >
        Cancel
      </Button>
    </div>
  );
}
