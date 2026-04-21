'use client';

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

type PopupConfig = {
  enabled: boolean;
  pageTarget: "home" | "product" | "both";
  title: string;
  description: string;
  tool: {
    id: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    icon: string | null;
  } | null;
};

interface FeaturedProductPopupProps {
  config: PopupConfig;
}

export function FeaturedProductPopup({ config }: FeaturedProductPopupProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const shouldRenderOnPage = useMemo(() => {
    if (config.pageTarget === "both") return pathname === "/" || pathname.startsWith("/tools/");
    if (config.pageTarget === "home") return pathname === "/";
    return pathname.startsWith("/tools/");
  }, [config.pageTarget, pathname]);

  useEffect(() => {
    if (!config.enabled || !config.tool || !shouldRenderOnPage) return;
    const onceKey = `product-popup-seen:${config.tool.id}:${config.pageTarget}`;
    if (window.sessionStorage.getItem(onceKey) === "1") return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      window.sessionStorage.setItem(onceKey, "1");
    }, 1100);

    return () => window.clearTimeout(timer);
  }, [config.enabled, config.pageTarget, config.tool, shouldRenderOnPage]);

  if (!config.enabled || !config.tool || !shouldRenderOnPage) return null;

  const isImageUrl = config.tool.icon && (config.tool.icon.startsWith("/") || config.tool.icon.startsWith("http"));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200">
              <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
              Featured
            </Badge>
          </div>
          <DialogTitle>{config.title || `Try ${config.tool.name}`}</DialogTitle>
          <DialogDescription>
            {config.description || config.tool.shortDescription || "Recommended product for you."}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
            {isImageUrl ? (
              <img src={config.tool.icon!} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="text-6xl">{config.tool.icon || "🛠️"}</span>
            )}
          </div>
          <div className="p-3">
            <p className="font-semibold text-slate-900">{config.tool.name}</p>
            {config.tool.shortDescription && (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2">{config.tool.shortDescription}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Button asChild className="flex-1">
            <Link href={`/tools/${config.tool.slug}`} onClick={() => setOpen(false)}>
              View Product
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
