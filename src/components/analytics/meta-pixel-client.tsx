'use client';

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

export function MetaPixelClient({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (typeof window.fbq !== "function") return;

    // Track SPA navigations
    window.fbq("track", "PageView");
  }, [enabled, pathname]);

  return null;
}

