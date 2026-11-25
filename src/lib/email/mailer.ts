import nodemailer from "nodemailer";

export interface EmailNotificationPayload {
  to?: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailSendResult {
  sent: boolean;
  provider?: "resend" | "smtp";
  reason?: string;
}

/**
 * Sends a notification email via Resend or SMTP when configured.
 * Never crashes the application if email credentials are missing.
 */
export async function sendNotificationEmail(
  payload: EmailNotificationPayload
): Promise<EmailSendResult> {
  const from =
    process.env.EMAIL_FROM || "Kaggadu Adventures <noreply@kaggaduadventures.com>";
  const recipient = payload.to || process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!recipient) {
    return {
      sent: false,
      reason: "No recipient email address configured.",
    };
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        return { sent: false, provider: "resend", reason: body };
      }

      return { sent: true, provider: "resend" };
    } catch (err) {
      return {
        sent: false,
        provider: "resend",
        reason: err instanceof Error ? err.message : "Resend request failed",
      };
    }
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from,
        to: recipient,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });

      return { sent: true, provider: "smtp" };
    } catch (err) {
      return {
        sent: false,
        provider: "smtp",
        reason: err instanceof Error ? err.message : "SMTP delivery failed",
      };
    }
  }

  return {
    sent: false,
    reason: "Email provider credentials are not configured.",
  };
}
