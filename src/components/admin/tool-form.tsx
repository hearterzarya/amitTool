'use client';

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Upload, X } from "lucide-react";

interface ToolFormProps {
  tool?: {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string | null;
    category: string;
    icon?: string | null;
    toolUrl: string;
    priceMonthly: number;
    // Duration-specific prices
    sharedPlanPrice1Month?: number | null;
    sharedPlanPrice3Months?: number | null;
    sharedPlanPrice6Months?: number | null;
    sharedPlanPrice1Year?: number | null;
    privatePlanPrice1Month?: number | null;
    privatePlanPrice3Months?: number | null;
    privatePlanPrice6Months?: number | null;
    privatePlanPrice1Year?: number | null;
    // Legacy fields
    sharedPlanPrice?: number | null;
    privatePlanPrice?: number | null;
    sharedPlanFeatures?: string | null;
    privatePlanFeatures?: string | null;
    sharedPlanEnabled?: boolean;
    privatePlanEnabled?: boolean;
    sharedPlanName?: string | null;
    privatePlanName?: string | null;
    sharedPlanDescription?: string | null;
    privatePlanDescription?: string | null;
    isActive: boolean;
    isFeatured?: boolean;
    isOutOfStock?: boolean;
    sortOrder: number;
    cookiesEncrypted?: string | null;
    cookiesExpiryDate?: Date | null;
  };
  mode: "create" | "edit";
}

export function ToolForm({ tool, mode }: ToolFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  
  // Check if existing icon is an image (URL or path)
  const isExistingImage = tool?.icon && (tool.icon.startsWith('/') || tool.icon.startsWith('http'));
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    isExistingImage ? (tool.icon || null) : null
  );

  // Helper to convert BigInt or number to number (for form display)
  const convertToNumber = (value: number | bigint | null | undefined): number => {
    if (!value) return 0;
    return typeof value === 'bigint' ? Number(value) : value;
  };

  const [formData, setFormData] = useState({
    name: tool?.name || "",
    slug: tool?.slug || "",
    description: tool?.description || "",
    shortDescription: tool?.shortDescription || "",
    category: tool?.category || "AI_WRITING",
    icon: tool?.icon || "",
    toolUrl: tool?.toolUrl || "",
    priceMonthly: tool ? convertToNumber(tool.priceMonthly) / 100 : 0,
    // Shared Plan Prices
    sharedPlanPrice1Month: (tool as any)?.sharedPlanPrice1Month ? convertToNumber((tool as any).sharedPlanPrice1Month) / 100 : 0,
    sharedPlanPrice3Months: (tool as any)?.sharedPlanPrice3Months ? convertToNumber((tool as any).sharedPlanPrice3Months) / 100 : 0,
    sharedPlanPrice6Months: (tool as any)?.sharedPlanPrice6Months ? convertToNumber((tool as any).sharedPlanPrice6Months) / 100 : 0,
    sharedPlanPrice1Year: (tool as any)?.sharedPlanPrice1Year ? convertToNumber((tool as any).sharedPlanPrice1Year) / 100 : 0,
    // Private Plan Prices
    privatePlanPrice1Month: (tool as any)?.privatePlanPrice1Month ? convertToNumber((tool as any).privatePlanPrice1Month) / 100 : 0,
    privatePlanPrice3Months: (tool as any)?.privatePlanPrice3Months ? convertToNumber((tool as any).privatePlanPrice3Months) / 100 : 0,
    privatePlanPrice6Months: (tool as any)?.privatePlanPrice6Months ? convertToNumber((tool as any).privatePlanPrice6Months) / 100 : 0,
    privatePlanPrice1Year: (tool as any)?.privatePlanPrice1Year ? convertToNumber((tool as any).privatePlanPrice1Year) / 100 : 0,
    // Legacy fields (for backward compatibility)
    sharedPlanPrice: tool?.sharedPlanPrice ? convertToNumber(tool.sharedPlanPrice) / 100 : 0,
    privatePlanPrice: tool?.privatePlanPrice ? convertToNumber(tool.privatePlanPrice) / 100 : 0,
    sharedPlanFeatures: tool?.sharedPlanFeatures || "",
    privatePlanFeatures: tool?.privatePlanFeatures || "",
    sharedPlanEnabled: tool?.sharedPlanEnabled ?? false,
    privatePlanEnabled: tool?.privatePlanEnabled ?? false,
    sharedPlanName: tool?.sharedPlanName || "Shared Plan",
    privatePlanName: tool?.privatePlanName || "Private Plan",
    sharedPlanDescription: tool?.sharedPlanDescription || "",
    privatePlanDescription: tool?.privatePlanDescription || "",
    isActive: tool?.isActive ?? true,
    isFeatured: tool?.isFeatured ?? false,
    isOutOfStock: tool?.isOutOfStock ?? false,
    sortOrder: tool?.sortOrder || 0,
    cookiesExpiryDateEnabled: !!tool?.cookiesExpiryDate,
    cookiesExpiryDate: tool?.cookiesExpiryDate 
      ? new Date(tool.cookiesExpiryDate).toISOString().split('T')[0]
      : '',
    // Duration toggles for Shared Plan - check if price exists and is greater than 0
    sharedPlanDuration1MonthEnabled: (tool as any)?.sharedPlanPrice1Month ? convertToNumber((tool as any).sharedPlanPrice1Month) > 0 : false,
    sharedPlanDuration3MonthsEnabled: (tool as any)?.sharedPlanPrice3Months ? convertToNumber((tool as any).sharedPlanPrice3Months) > 0 : false,
    sharedPlanDuration6MonthsEnabled: (tool as any)?.sharedPlanPrice6Months ? convertToNumber((tool as any).sharedPlanPrice6Months) > 0 : false,
    sharedPlanDuration1YearEnabled: (tool as any)?.sharedPlanPrice1Year ? convertToNumber((tool as any).sharedPlanPrice1Year) > 0 : false,
    // Duration toggles for Private Plan - check if price exists and is greater than 0
    privatePlanDuration1MonthEnabled: (tool as any)?.privatePlanPrice1Month ? convertToNumber((tool as any).privatePlanPrice1Month) > 0 : false,
    privatePlanDuration3MonthsEnabled: (tool as any)?.privatePlanPrice3Months ? convertToNumber((tool as any).privatePlanPrice3Months) > 0 : false,
    privatePlanDuration6MonthsEnabled: (tool as any)?.privatePlanPrice6Months ? convertToNumber((tool as any).privatePlanPrice6Months) > 0 : false,
    privatePlanDuration1YearEnabled: (tool as any)?.privatePlanPrice1Year ? convertToNumber((tool as any).privatePlanPrice1Year) > 0 : false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updated = {
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      };
      
      // Update preview if icon field changes and it's an image URL
      if (name === "icon") {
        const isImage = value && (value.startsWith('/') || value.startsWith('http'));
        setPreviewUrl(isImage ? value : null);
      }
      
      return updated;
    });
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only images are allowed (JPEG, PNG, GIF, WebP, SVG).");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Create FormData and upload
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const response = await fetch("/api/admin/tools/upload-icon", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        let errorMessage = "Failed to upload image";
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Server error (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.url) {
        throw new Error("Server did not return image URL");
      }
      
      const imageUrl = data.url;

      // Update form data with the image URL
      setFormData((prev) => ({ ...prev, icon: imageUrl }));
      setPreviewUrl(imageUrl);
      setError(""); // Clear any previous errors
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err.message || "Failed to upload image. Please try again.";
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, icon: "" }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = mode === "create" ? "/api/admin/tools" : `/api/admin/tools/${tool?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          priceMonthly: Math.round(formData.priceMonthly * 100),
          // Duration-specific prices (convert to paise, only if enabled)
          sharedPlanPrice1Month: formData.sharedPlanDuration1MonthEnabled && formData.sharedPlanPrice1Month > 0 ? Math.round(formData.sharedPlanPrice1Month * 100) : null,
          sharedPlanPrice3Months: formData.sharedPlanDuration3MonthsEnabled && formData.sharedPlanPrice3Months > 0 ? Math.round(formData.sharedPlanPrice3Months * 100) : null,
          sharedPlanPrice6Months: formData.sharedPlanDuration6MonthsEnabled && formData.sharedPlanPrice6Months > 0 ? Math.round(formData.sharedPlanPrice6Months * 100) : null,
          sharedPlanPrice1Year: formData.sharedPlanDuration1YearEnabled && formData.sharedPlanPrice1Year > 0 ? Math.round(formData.sharedPlanPrice1Year * 100) : null,
          privatePlanPrice1Month: formData.privatePlanDuration1MonthEnabled && formData.privatePlanPrice1Month > 0 ? Math.round(formData.privatePlanPrice1Month * 100) : null,
          privatePlanPrice3Months: formData.privatePlanDuration3MonthsEnabled && formData.privatePlanPrice3Months > 0 ? Math.round(formData.privatePlanPrice3Months * 100) : null,
          privatePlanPrice6Months: formData.privatePlanDuration6MonthsEnabled && formData.privatePlanPrice6Months > 0 ? Math.round(formData.privatePlanPrice6Months * 100) : null,
          privatePlanPrice1Year: formData.privatePlanDuration1YearEnabled && formData.privatePlanPrice1Year > 0 ? Math.round(formData.privatePlanPrice1Year * 100) : null,
          // Legacy fields (for backward compatibility)
          sharedPlanPrice: formData.sharedPlanPrice > 0 ? Math.round(formData.sharedPlanPrice * 100) : null,
          privatePlanPrice: formData.privatePlanPrice > 0 ? Math.round(formData.privatePlanPrice * 100) : null,
          sharedPlanEnabled: formData.sharedPlanEnabled ?? false,
          privatePlanEnabled: formData.privatePlanEnabled ?? false,
          isOutOfStock: formData.isOutOfStock ?? false,
          cookiesExpiryDate: formData.cookiesExpiryDateEnabled && formData.cookiesExpiryDate 
            ? new Date(formData.cookiesExpiryDate).toISOString()
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || "Failed to save tool";
        const errorDetails = data.details ? `\n\nDetails: ${data.details}` : '';
        throw new Error(errorMessage + errorDetails);
      }

      router.push("/admin/tools");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Tool details and pricing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tool Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="ChatGPT Plus"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  placeholder="chatgpt-plus"
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
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Brief description for cards"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description *</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Detailed description of the tool"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="AI_WRITING">AI Writing</option>
                <option value="SEO_TOOLS">SEO Tools</option>
                <option value="DESIGN">Design</option>
                <option value="PRODUCTIVITY">Productivity</option>
                <option value="CODE_DEV">Code & Dev</option>
                <option value="VIDEO_AUDIO">Video & Audio</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Tool Icon</Label>
              <div className="space-y-2">
                {previewUrl ? (
                  <div className="relative inline-block">
                    <div className="relative w-20 h-20 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <Image
                        src={previewUrl}
                        alt="Tool icon preview"
                        fill
                        className="object-contain"
                        sizes="80px"
                        unoptimized={previewUrl.startsWith('http')}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 z-10"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : formData.icon && !formData.icon.startsWith('/') && !formData.icon.startsWith('http') ? (
                  <div className="border-2 border-gray-200 rounded-lg p-4 text-center bg-gray-50">
                    <div className="text-4xl mb-2">{formData.icon}</div>
                    <p className="text-xs text-gray-500">Emoji icon</p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Upload tool icon</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF, WebP, SVG (max 5MB)</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? "Uploading..." : previewUrl ? "Change Image" : "Select Image"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                {/* Fallback: Allow manual URL or emoji input */}
                <div className="mt-2">
                  <Label htmlFor="iconUrl" className="text-xs text-gray-500">
                    Or enter URL/emoji manually:
                  </Label>
              <Input
                    id="iconUrl"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                    placeholder="https://example.com/icon.png or 🤖"
                    className="mt-1"
              />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                name="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={handleChange}
                placeholder="0"
              />
            </div>
          </div>

            <div className="space-y-2">
              <Label htmlFor="toolUrl">Tool URL *</Label>
              <Input
                id="toolUrl"
                name="toolUrl"
                type="url"
                value={formData.toolUrl}
                onChange={handleChange}
                required
                placeholder="https://chat.openai.com"
              />
            </div>
        </CardContent>
      </Card>

      {/* Plan Pricing Section */}
      <Card>
            <CardHeader>
              <CardTitle>Plan Pricing & Features</CardTitle>
              <CardDescription>Set prices and features for Shared and Private plans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Base Monthly Price - Fallback price if no plan-specific prices are set */}
              <div className="p-4 border-2 border-blue-200 bg-blue-50/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="priceMonthly" className="text-base font-semibold">
                    Base Monthly Price (₹) *
                  </Label>
                  <Input
                    id="priceMonthly"
                    name="priceMonthly"
                    type="number"
                    step="0.01"
                    value={formData.priceMonthly}
                    onChange={handleChange}
                    placeholder="199"
                    className="h-10 text-lg font-medium"
                    required
                  />
                  <p className="text-xs text-gray-600">
                    This is the fallback price used when plan-specific prices are not set. 
                    The minimum price shown in the tools list will be the lowest of: 1-month plan prices, base plan prices, or this base monthly price.
                  </p>
                </div>
              </div>
              {/* Shared Plan */}
              <div className={`space-y-4 p-4 border rounded-lg ${formData.sharedPlanEnabled ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-100 text-blue-800">Shared Plan</Badge>
                    <span className="text-sm text-gray-600">Multiple users share the account</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="sharedPlanEnabled" className="text-sm font-medium cursor-pointer">
                      {formData.sharedPlanEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <input
                      type="checkbox"
                      id="sharedPlanEnabled"
                      name="sharedPlanEnabled"
                      checked={formData.sharedPlanEnabled}
                      onChange={handleChange}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className={`space-y-4 ${!formData.sharedPlanEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sharedPlanName">Plan Name</Label>
                      <Input
                        id="sharedPlanName"
                        name="sharedPlanName"
                        type="text"
                        value={formData.sharedPlanName || "Shared Plan"}
                        onChange={handleChange}
                        placeholder="Shared Plan"
                      />
                      <p className="text-xs text-gray-500">Custom name for this plan</p>
                    </div>
                  </div>
                  
                  {/* Duration-Specific Prices */}
                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <Label className="text-sm font-semibold">Pricing by Duration</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sharedPlanPrice1Month" className="text-xs">1 Month (₹)</Label>
                          <input
                            type="checkbox"
                            id="sharedPlanDuration1MonthEnabled"
                            checked={formData.sharedPlanDuration1MonthEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                sharedPlanDuration1MonthEnabled: isEnabled,
                                // If disabling, set to 0. If enabling and was 0, set a default or keep 0
                                sharedPlanPrice1Month: isEnabled ? (prev.sharedPlanPrice1Month || 0) : 0
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <Input
                          id="sharedPlanPrice1Month"
                          name="sharedPlanPrice1Month"
                          type="number"
                          step="0.01"
                          value={formData.sharedPlanPrice1Month}
                          onChange={handleChange}
                          placeholder="199"
                          className="h-9"
                          disabled={!formData.sharedPlanDuration1MonthEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sharedPlanPrice3Months" className="text-xs">3 Months (₹)</Label>
                          <input
                            type="checkbox"
                            id="sharedPlanDuration3MonthsEnabled"
                            checked={formData.sharedPlanDuration3MonthsEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                sharedPlanDuration3MonthsEnabled: isEnabled,
                                sharedPlanPrice3Months: isEnabled ? (prev.sharedPlanPrice3Months || 0) : 0
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <Input
                          id="sharedPlanPrice3Months"
                          name="sharedPlanPrice3Months"
                          type="number"
                          step="0.01"
                          value={formData.sharedPlanPrice3Months}
                          onChange={handleChange}
                          placeholder="568"
                          className="h-9"
                          disabled={!formData.sharedPlanDuration3MonthsEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sharedPlanPrice6Months" className="text-xs">6 Months (₹)</Label>
                          <input
                            type="checkbox"
                            id="sharedPlanDuration6MonthsEnabled"
                            checked={formData.sharedPlanDuration6MonthsEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                sharedPlanDuration6MonthsEnabled: isEnabled,
                                sharedPlanPrice6Months: isEnabled ? (prev.sharedPlanPrice6Months || 0) : 0
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <Input
                          id="sharedPlanPrice6Months"
                          name="sharedPlanPrice6Months"
                          type="number"
                          step="0.01"
                          value={formData.sharedPlanPrice6Months}
                          onChange={handleChange}
                          placeholder="1074"
                          className="h-9"
                          disabled={!formData.sharedPlanDuration6MonthsEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="sharedPlanPrice1Year" className="text-xs">1 Year (₹)</Label>
                          <input
                            type="checkbox"
                            id="sharedPlanDuration1YearEnabled"
                            checked={formData.sharedPlanDuration1YearEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                sharedPlanDuration1YearEnabled: isEnabled,
                                sharedPlanPrice1Year: isEnabled ? (prev.sharedPlanPrice1Year || 0) : 0
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <Input
                          id="sharedPlanPrice1Year"
                          name="sharedPlanPrice1Year"
                          type="number"
                          step="0.01"
                          value={formData.sharedPlanPrice1Year}
                          onChange={handleChange}
                          placeholder="1910"
                          className="h-9"
                          disabled={!formData.sharedPlanDuration1YearEnabled}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Enable/disable each duration and set prices. Disabled durations won't be available for purchase.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sharedPlanDescription">Plan Description</Label>
                    <textarea
                      id="sharedPlanDescription"
                      name="sharedPlanDescription"
                      value={formData.sharedPlanDescription || ""}
                      onChange={handleChange}
                      rows={2}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Multiple users share the account. Instant activation after payment."
                    />
                    <p className="text-xs text-gray-500">Brief description shown to customers</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sharedPlanFeatures">Features (one per line)</Label>
                    <textarea
                      id="sharedPlanFeatures"
                      name="sharedPlanFeatures"
                      value={formData.sharedPlanFeatures}
                      onChange={handleChange}
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="GPT-4 Access&#10;Unlimited conversations&#10;Priority support"
                    />
                    <p className="text-xs text-gray-500">Enter each feature on a new line</p>
                  </div>
                </div>
              </div>

              {/* Private Plan */}
              <div className={`space-y-4 p-4 border rounded-lg ${formData.privatePlanEnabled ? 'border-purple-300 bg-purple-50/30' : 'border-gray-200 bg-gray-50/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-100 text-purple-800">Private Plan</Badge>
                    <span className="text-sm text-gray-600">Dedicated account for single user</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="privatePlanEnabled" className="text-sm font-medium cursor-pointer">
                      {formData.privatePlanEnabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <input
                      type="checkbox"
                      id="privatePlanEnabled"
                      name="privatePlanEnabled"
                      checked={formData.privatePlanEnabled}
                onChange={handleChange}
                      className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
            </div>
          </div>
                <div className={`space-y-4 ${!formData.privatePlanEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="privatePlanName">Plan Name</Label>
                      <Input
                        id="privatePlanName"
                        name="privatePlanName"
                        type="text"
                        value={formData.privatePlanName || "Private Plan"}
                        onChange={handleChange}
                        placeholder="Private Plan"
                      />
                      <p className="text-xs text-gray-500">Custom name for this plan</p>
                    </div>
                  </div>
                  
                  {/* Duration-Specific Prices */}
                  <div className="space-y-3 pt-2 border-t border-gray-200">
                    <Label className="text-sm font-semibold">Pricing by Duration</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="privatePlanPrice1Month" className="text-xs">1 Month (₹)</Label>
                          <input
                            type="checkbox"
                            id="privatePlanDuration1MonthEnabled"
                            checked={formData.privatePlanDuration1MonthEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                privatePlanDuration1MonthEnabled: isEnabled,
                                privatePlanPrice1Month: isEnabled ? (prev.privatePlanPrice1Month || 0) : 0
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <Input
                          id="privatePlanPrice1Month"
                          name="privatePlanPrice1Month"
                          type="number"
                          step="0.01"
                          value={formData.privatePlanPrice1Month}
                          onChange={handleChange}
                          placeholder="499"
                          className="h-9"
                          disabled={!formData.privatePlanDuration1MonthEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="privatePlanPrice3Months" className="text-xs">3 Months (₹)</Label>
                          <input
                            type="checkbox"
                            id="privatePlanDuration3MonthsEnabled"
                            checked={formData.privatePlanDuration3MonthsEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                privatePlanDuration3MonthsEnabled: isEnabled,
                                privatePlanPrice3Months: isEnabled ? (prev.privatePlanPrice3Months || 0) : 0
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <Input
                          id="privatePlanPrice3Months"
                          name="privatePlanPrice3Months"
                          type="number"
                          step="0.01"
                          value={formData.privatePlanPrice3Months}
                          onChange={handleChange}
                          placeholder="1422"
                          className="h-9"
                          disabled={!formData.privatePlanDuration3MonthsEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="privatePlanPrice6Months" className="text-xs">6 Months (₹)</Label>
                          <input
                            type="checkbox"
                            id="privatePlanDuration6MonthsEnabled"
                            checked={formData.privatePlanDuration6MonthsEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                privatePlanDuration6MonthsEnabled: isEnabled,
                                privatePlanPrice6Months: isEnabled ? (prev.privatePlanPrice6Months || 0) : 0
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <Input
                          id="privatePlanPrice6Months"
                          name="privatePlanPrice6Months"
                          type="number"
                          step="0.01"
                          value={formData.privatePlanPrice6Months}
                          onChange={handleChange}
                          placeholder="2694"
                          className="h-9"
                          disabled={!formData.privatePlanDuration6MonthsEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="privatePlanPrice1Year" className="text-xs">1 Year (₹)</Label>
                          <input
                            type="checkbox"
                            id="privatePlanDuration1YearEnabled"
                            checked={formData.privatePlanDuration1YearEnabled}
                            onChange={(e) => {
                              const isEnabled = e.target.checked;
                              setFormData(prev => ({
                                ...prev,
                                privatePlanDuration1YearEnabled: isEnabled,
                                privatePlanPrice1Year: isEnabled ? (prev.privatePlanPrice1Year || 0) : 0
                              }));
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </div>
                        <Input
                          id="privatePlanPrice1Year"
                          name="privatePlanPrice1Year"
                          type="number"
                          step="0.01"
                          value={formData.privatePlanPrice1Year}
                          onChange={handleChange}
                          placeholder="4790"
                          className="h-9"
                          disabled={!formData.privatePlanDuration1YearEnabled}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">Enable/disable each duration and set prices. Disabled durations won't be available for purchase.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="privatePlanDescription">Plan Description</Label>
                    <textarea
                      id="privatePlanDescription"
                      name="privatePlanDescription"
                      value={formData.privatePlanDescription || ""}
                      onChange={handleChange}
                      rows={2}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Dedicated account for single user. Manual activation via Email/WhatsApp after payment."
                    />
                    <p className="text-xs text-gray-500">Brief description shown to customers</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="privatePlanFeatures">Features (one per line)</Label>
                    <textarea
                      id="privatePlanFeatures"
                      name="privatePlanFeatures"
                      value={formData.privatePlanFeatures}
                      onChange={handleChange}
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="GPT-4 Access&#10;Unlimited conversations&#10;Priority support&#10;Dedicated account"
                    />
                    <p className="text-xs text-gray-500">Enter each feature on a new line</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tool Status Section */}
          <Card>
            <CardHeader>
              <CardTitle>Tool Status & Availability</CardTitle>
              <CardDescription>Control tool visibility and availability</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-base font-semibold cursor-pointer">
                    Tool Status
                  </Label>
                  <p className="text-sm text-gray-600">
                    {formData.isActive 
                      ? "Tool is active and available for subscription" 
                      : "Tool is inactive and hidden from users"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="h-6 w-6 rounded border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="isFeatured" className="text-base font-semibold cursor-pointer">
                    Featured Tool
                  </Label>
                  <p className="text-sm text-gray-600">
                    Feature this tool in the slider (best/offer tools)
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="isFeatured"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="h-6 w-6 rounded border-gray-300 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="isOutOfStock" className="text-base font-semibold cursor-pointer">
                    Out of Stock
                  </Label>
                  <p className="text-sm text-gray-600">
                    Mark as out of stock (temporarily unavailable)
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="isOutOfStock"
                  name="isOutOfStock"
                  checked={formData.isOutOfStock}
                  onChange={handleChange}
                  className="h-6 w-6 rounded border-gray-300 cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

      {/* Cookie Expiry Date Section */}
      <Card>
        <CardHeader>
          <CardTitle>Cookie Expiration Settings</CardTitle>
          <CardDescription>Set when the cookies for this tool will expire</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="cookiesExpiryDateEnabled"
              name="cookiesExpiryDateEnabled"
              checked={formData.cookiesExpiryDateEnabled}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  cookiesExpiryDateEnabled: e.target.checked,
                  cookiesExpiryDate: e.target.checked ? prev.cookiesExpiryDate : ''
                }));
              }}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="cookiesExpiryDateEnabled" className="cursor-pointer">
              Enable cookie expiration date
            </Label>
          </div>
          {formData.cookiesExpiryDateEnabled && (
            <div className="space-y-2">
              <Label htmlFor="cookiesExpiryDate">Cookie Expiry Date</Label>
              <Input
                id="cookiesExpiryDate"
                name="cookiesExpiryDate"
                type="date"
                value={formData.cookiesExpiryDate}
                onChange={handleChange}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                When the cookies for this tool will expire. Leave empty to disable expiration tracking.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : mode === "create" ? "Create Tool" : "Update Tool"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/tools")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
