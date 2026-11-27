import { MessageCircle } from "lucide-react";
import { buildWhatsAppEnquiryUrl } from "@/lib/whatsapp/links";

interface WhatsAppButtonProps {
  whatsappNumber?: string | null;
  eventName?: string;
  participantName?: string;
  participantsCount?: number;
  eventDate?: string;
  label?: string;
  className?: string;
  showNote?: boolean;
}

export function WhatsAppButton({
  whatsappNumber,
  eventName,
  participantName,
  participantsCount,
  eventDate,
  label = "ENQUIRE VIA WHATSAPP",
  className = "",
  showNote = true,
}: WhatsAppButtonProps) {
  const url = buildWhatsAppEnquiryUrl({
    whatsappNumber,
    eventName,
    participantName,
    participantsCount,
    eventDate,
  });

  if (!url) {
    return (
      <div className="rounded-md border border-[#E9E9E2] bg-[#F6F4ED] px-4 py-3 text-xs text-[#262B27]/75">
        WhatsApp enquiry number is not configured yet. Please use the online registration form or{" "}
        <a href="/contact" className="underline text-[#244B3C] font-medium">
          Contact Us
        </a>
        .
      </div>
    );
  }

  const isShortLink = url.startsWith("https://wa.me/message/");

  return (
    <div className="space-y-1.5">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 rounded-md border border-[#244B3C] bg-[#FFFDF8] px-5 py-3 text-sm font-semibold text-[#244B3C] hover:bg-[#244B3C] hover:text-[#FFFDF8] transition-colors ${className}`}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        <span>{label}</span>
      </a>
      {showNote && (
        <p className="text-[11px] text-[#262B27]/70 leading-snug">
          {isShortLink
            ? "Opens our official WhatsApp Business chat so you can message our team directly (this does not create an automatic online booking)."
            : "Opens WhatsApp with a prefilled message. Please send the message in WhatsApp to complete your enquiry (this does not create an automatic online booking)."}
        </p>
      )}
    </div>
  );
}
