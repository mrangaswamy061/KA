"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./SiteFooter";
import type { WebsiteSettings } from "@/types/database";

export function ConditionalFooter({ settings }: { settings: WebsiteSettings }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return <SiteFooter settings={settings} />;
}
