'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminSettingsForm(props: {
  initialMetaPixelId: string;
  initialMetaPixelEnabled: boolean;
  initialWhatsappNumber: string;
  initialProductPopupEnabled: boolean;
  initialProductPopupToolSlug: string;
  initialProductPopupPageTarget: "home" | "product" | "both";
  initialProductPopupTitle: string;
  initialProductPopupDescription: string;
  activeTools: Array<{ id: string; name: string; slug: string }>;
}) {
  const [metaPixelId, setMetaPixelId] = useState(props.initialMetaPixelId);
  const [metaPixelEnabled, setMetaPixelEnabled] = useState(props.initialMetaPixelEnabled);
  const [whatsappNumber, setWhatsappNumber] = useState(props.initialWhatsappNumber);
  const [productPopupEnabled, setProductPopupEnabled] = useState(props.initialProductPopupEnabled);
  const [productPopupToolSlug, setProductPopupToolSlug] = useState(props.initialProductPopupToolSlug);
  const [productPopupPageTarget, setProductPopupPageTarget] = useState<"home" | "product" | "both">(
    props.initialProductPopupPageTarget
  );
  const [productPopupTitle, setProductPopupTitle] = useState(props.initialProductPopupTitle);
  const [productPopupDescription, setProductPopupDescription] = useState(props.initialProductPopupDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaPixelId,
          metaPixelEnabled,
          whatsappNumber,
          productPopupEnabled,
          productPopupToolSlug,
          productPopupPageTarget,
          productPopupTitle,
          productPopupDescription,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save settings");
      }

      setSaved(true);
    } catch (e: any) {
      setError(e.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 text-green-800 text-sm p-3 rounded-md border border-green-200">
          Settings saved. Refresh the site to see changes (e.g. pixel and WhatsApp number).
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact (WhatsApp)</CardTitle>
          <CardDescription>WhatsApp number used for support links and the floating button across the site.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp / Support Number</Label>
            <Input
              id="whatsappNumber"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="7822987968 or +91 7822987968"
            />
            <p className="text-xs text-gray-500">
              Enter with or without country code (e.g. 91). Used for wa.me links and display.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Contact"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Featured Product Popup</CardTitle>
          <CardDescription>
            Show a selected product in a popup on Home, Product pages, or both.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="productPopupEnabled"
              type="checkbox"
              checked={productPopupEnabled}
              onChange={(e) => setProductPopupEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="productPopupEnabled" className="cursor-pointer">
              Enable popup
            </Label>
          </div>

          <div className="space-y-2">
            <Label>Where to show popup</Label>
            <Select
              value={productPopupPageTarget}
              onValueChange={(v) => setProductPopupPageTarget(v as "home" | "product" | "both")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home page only</SelectItem>
                <SelectItem value="product">Product pages only</SelectItem>
                <SelectItem value="both">Both Home and Product pages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Popup Product</Label>
            <Select
              value={productPopupToolSlug || undefined}
              onValueChange={setProductPopupToolSlug}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product..." />
              </SelectTrigger>
              <SelectContent>
                {props.activeTools.map((tool) => (
                  <SelectItem key={tool.id} value={tool.slug}>
                    {tool.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="productPopupTitle">Popup Title (optional)</Label>
            <Input
              id="productPopupTitle"
              value={productPopupTitle}
              onChange={(e) => setProductPopupTitle(e.target.value)}
              placeholder="Limited Time Featured Product"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productPopupDescription">Popup Description (optional)</Label>
            <Input
              id="productPopupDescription"
              value={productPopupDescription}
              onChange={(e) => setProductPopupDescription(e.target.value)}
              placeholder="Handpicked by our team based on customer demand."
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Popup Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Pixels</CardTitle>
          <CardDescription>Configure tracking pixels for the public website.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              id="metaPixelEnabled"
              type="checkbox"
              checked={metaPixelEnabled}
              onChange={(e) => setMetaPixelEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="metaPixelEnabled" className="cursor-pointer">
              Enable Meta (Facebook) Pixel
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metaPixelId">Meta Pixel ID</Label>
            <Input
              id="metaPixelId"
              value={metaPixelId}
              onChange={(e) => setMetaPixelId(e.target.value)}
              placeholder="123456789012345"
            />
            <p className="text-xs text-gray-500">
              Paste your Pixel ID (numbers). We’ll inject the standard `fbq` snippet site-wide.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

