"use client";

import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { buildWhatsAppEnquiryUrl } from "@/lib/whatsapp/links";

export function FloatingWhatsAppCta({
  whatsappNumber,
}: {
  whatsappNumber?: string | null;
}) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const url = buildWhatsAppEnquiryUrl({ whatsappNumber });
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Kaggadu Adventures on WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#244B3C] px-4 py-3 text-xs sm:text-sm font-semibold text-[#FFFDF8] shadow-lg border border-[#A8B8A0]/40 hover:bg-[#18372D] transition-colors"
    >
      <MessageCircle className="h-4 w-4 text-[#A8B8A0]" aria-hidden="true" />
      <span>WhatsApp Us</span>
    </a>
  );
}
