export interface WhatsAppEnquiryParams {
  whatsappNumber?: string | null;
  eventName?: string;
  participantName?: string;
  participantsCount?: number;
  eventDate?: string;
  customMessage?: string;
}

const DEFAULT_WHATSAPP_LINK = "https://wa.me/message/2RLALIQ3GCUQM1";

/**
 * Formats a WhatsApp number for wa.me links (digits only).
 */
export function sanitizeWhatsAppNumber(raw?: string | null): string {
  const source = raw?.trim() || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  if (source.startsWith("http://") || source.startsWith("https://")) {
    return "";
  }
  return source.replace(/\D/g, "");
}

/**
 * Builds a WhatsApp click-to-chat URL.
 * Supports both full wa.me/message/... links and phone numbers with prefilled messages.
 */
export function buildWhatsAppEnquiryUrl(params: WhatsAppEnquiryParams): string | null {
  const raw =
    params.whatsappNumber?.trim() ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() ||
    DEFAULT_WHATSAPP_LINK;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  const cleanNumber = raw.replace(/\D/g, "");
  if (!cleanNumber) {
    return DEFAULT_WHATSAPP_LINK;
  }

  let message: string;
  if (params.customMessage) {
    message = params.customMessage;
  } else if (params.eventName) {
    message = [
      "Hello Kaggadu Adventures!",
      "",
      `I am interested in joining ${params.eventName}.`,
      "",
      `Name: ${params.participantName?.trim() || ""}`,
      `Participants: ${params.participantsCount ?? ""}`,
      `Event Date: ${params.eventDate || ""}`,
      "Please share the booking details.",
    ].join("\n");
  } else {
    message =
      "Hello Kaggadu Adventures! I would like to enquire about your upcoming adventures.";
  }

  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Server-side WhatsApp Business Cloud API readiness adapter.
 * Safely no-ops if API credentials are not configured.
 */
export async function sendWhatsAppCloudNotification(payload: {
  toPhone: string;
  templateName: string;
  bodyParameters: string[];
}): Promise<{ sent: boolean; reason?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    return {
      sent: false,
      reason: "WhatsApp Business Cloud API credentials are not configured.",
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: payload.toPhone.replace(/\D/g, ""),
          type: "template",
          template: {
            name: payload.templateName,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: payload.bodyParameters.map((text) => ({
                  type: "text",
                  text,
                })),
              },
            ],
          },
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return { sent: false, reason: `WhatsApp API error: ${errorText}` };
    }

    return { sent: true };
  } catch (err) {
    return {
      sent: false,
      reason: err instanceof Error ? err.message : "Unknown WhatsApp API error",
    };
  }
}
