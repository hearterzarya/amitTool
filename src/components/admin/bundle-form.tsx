'use client';

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ToolPick = { id: string; name: string; slug: string };

export function BundleForm(props: {
  mode: "create" | "edit";
  bundle?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string | null;
    icon: string | null;
    priceMonthly: number;
    priceSixMonth: number | null;
    priceYearly: number | null;
    features: string | null;
    targetAudience: string | null;
    isActive: boolean;
    isTrending: boolean;
    sortOrder: number;
  };
  tools: ToolPick[];
  initialToolIds: string[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toolQuery, setToolQuery] = useState("");
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>(props.initialToolIds || []);

  const [form, setForm] = useState({
    name: props.bundle?.name ?? "",
    slug: props.bundle?.slug ?? "",
    description: props.bundle?.description ?? "",
    shortDescription: props.bundle?.shortDescription ?? "",
    icon: props.bundle?.icon ?? "",
    priceMonthly: props.bundle ? (typeof props.bundle.priceMonthly === 'bigint' ? Number(props.bundle.priceMonthly) : props.bundle.priceMonthly) / 100 : 0,
    priceSixMonth: props.bundle?.priceSixMonth ? (typeof props.bundle.priceSixMonth === 'bigint' ? Number(props.bundle.priceSixMonth) : props.bundle.priceSixMonth) / 100 : 0,
    priceYearly: props.bundle?.priceYearly ? (typeof props.bundle.priceYearly === 'bigint' ? Number(props.bundle.priceYearly) : props.bundle.priceYearly) / 100 : 0,
    features: props.bundle?.features ?? "",
    targetAudience: props.bundle?.targetAudience ?? "",
    isActive: props.bundle?.isActive ?? true,
    isTrending: props.bundle?.isTrending ?? false,
    sortOrder: props.bundle?.sortOrder ?? 0,
  });

  const filteredTools = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    if (!q) return props.tools;
    return props.tools.filter((t) => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q));
  }, [props.tools, toolQuery]);

  const toggleTool = (toolId: string) => {
    setSelectedToolIds((prev) => {
      if (prev.includes(toolId)) return prev.filter((id) => id !== toolId);
      return [...prev, toolId];
    });
  };

  const generateSlug = () => {
    const slug = form.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setForm((p) => ({ ...p, slug }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url =
        props.mode === "create" ? "/api/admin/bundles" : `/api/admin/bundles/${props.bundle?.id}`;
      const method = props.mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          description: form.description,
          shortDescription: form.shortDescription || null,
          icon: form.icon || null,
          priceMonthly: Math.round(form.priceMonthly * 100),
          priceSixMonth: form.priceSixMonth > 0 ? Math.round(form.priceSixMonth * 100) : null,
          priceYearly: form.priceYearly > 0 ? Math.round(form.priceYearly * 100) : null,
          features: form.features || null,
          targetAudience: form.targetAudience || null,
          isActive: form.isActive ?? true,
          isTrending: form.isTrending ?? false,
          sortOrder: Number(form.sortOrder) || 0,
          toolIds: selectedToolIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save bundle");
      }

      router.push("/admin/bundles");
      router.refresh();
    } catch (e: any) {
      setError(e.message || "Failed to save bundle");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Bundle Details</CardTitle>
          <CardDescription>Name, pricing, and visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bundle Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  required
                />
                <Button type="button" variant="outline" onClick={generateSlug}>
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={form.shortDescription}
              onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description *</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              required
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceMonthly">Monthly Price (₹)</Label>
              <Input
                id="priceMonthly"
                type="number"
                step="0.01"
                value={form.priceMonthly}
                onChange={(e) => setForm((p) => ({ ...p, priceMonthly: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceSixMonth">6-Month Price (₹)</Label>
              <Input
                id="priceSixMonth"
                type="number"
                step="0.01"
                value={form.priceSixMonth}
                onChange={(e) => setForm((p) => ({ ...p, priceSixMonth: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceYearly">Yearly Price (₹)</Label>
              <Input
                id="priceYearly"
                type="number"
                step="0.01"
                value={form.priceYearly}
                onChange={(e) => setForm((p) => ({ ...p, priceYearly: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (emoji or URL)</Label>
              <Input
                id="icon"
                value={form.icon}
                onChange={(e) => setForm((p) => ({ ...p, icon: e.target.value }))}
                placeholder="📦 or https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                value={form.targetAudience}
                onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
                placeholder="Creators, students, agencies..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features (comma or newline separated)</Label>
            <textarea
              id="features"
              value={form.features}
              onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Active
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isTrending"
                type="checkbox"
                checked={form.isTrending}
                onChange={(e) => setForm((p) => ({ ...p, isTrending: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isTrending" className="cursor-pointer">
                Trending (homepage slider)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bundle Tools</CardTitle>
          <CardDescription>Select which tools are included in this bundle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="toolSearch">Search tools</Label>
            <Input
              id="toolSearch"
              value={toolQuery}
              onChange={(e) => setToolQuery(e.target.value)}
              placeholder="Search by name or slug..."
            />
          </div>

          <div className="border rounded-md p-3 max-h-72 overflow-auto space-y-2">
            {filteredTools.map((t) => {
              const checked = selectedToolIds.includes(t.id);
              return (
                <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTool(t.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="font-medium">{t.name}</span>
                  <span className="text-gray-500">({t.slug})</span>
                </label>
              );
            })}
            {filteredTools.length === 0 && (
              <div className="text-sm text-gray-500">No tools found.</div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Selected: <span className="font-medium">{selectedToolIds.length}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : props.mode === "create" ? "Create Bundle" : "Update Bundle"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/bundles")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

