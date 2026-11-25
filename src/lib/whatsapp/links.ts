export interface WhatsAppEnquiryParams {
  whatsappNumber?: string | null;
  eventName?: string;
  participantName?: string;
  participantsCount?: number;
  eventDate?: string;
  customMessage?: string;
}

/**
 * Formats a WhatsApp number for wa.me links (digits only).
 * Falls back to NEXT_PUBLIC_WHATSAPP_NUMBER if not passed from website_settings.
 */
export function sanitizeWhatsAppNumber(raw?: string | null): string {
  const source = raw?.trim() || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  return source.replace(/\D/g, "");
}

/**
 * Builds a WhatsApp click-to-chat URL with a prefilled enquiry message.
 * Note: Click-to-chat does not create a database registration; the visitor must send the message.
 */
export function buildWhatsAppEnquiryUrl(params: WhatsAppEnquiryParams): string | null {
  const cleanNumber = sanitizeWhatsAppNumber(params.whatsappNumber);
  if (!cleanNumber) {
    return null;
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
