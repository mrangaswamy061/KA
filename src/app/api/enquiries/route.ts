import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseConfigMismatch } from "@/lib/services/admin-auth";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { contactEnquirySchema } from "@/lib/validation/schemas";
import { escapeHtml } from "@/lib/utils/format";
import { sendNotificationEmail } from "@/lib/email/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactEnquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid enquiry form." },
        { status: 400 }
      );
    }

    if (hasSupabaseConfigMismatch()) {
      return NextResponse.json(
        { error: "Server database configuration is incomplete." },
        { status: 503 }
      );
    }

    const input = parsed.data;
    const normalizedEmail = input.email.toLowerCase();
    const supabase = createAdminSupabaseClient();

    if (!supabase) {
      const db = readLocalDb();
      const now = new Date().toISOString();
      db.enquiries.unshift({
        id: newUuid(),
        full_name: input.fullName,
        email: normalizedEmail,
        mobile: input.mobile,
        subject: input.subject,
        message: input.message,
        status: "new",
        internal_notes: null,
        created_at: now,
        updated_at: now,
      });
      writeLocalDb(db);

      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        await sendNotificationEmail({
          to: process.env.ADMIN_NOTIFICATION_EMAIL,
          subject: `New Website Enquiry: ${input.subject}`,
          text: `From: ${input.fullName} (${input.mobile}, ${normalizedEmail})\n\n${input.message}`,
          html: `<p><strong>New Enquiry: ${escapeHtml(input.subject)}</strong></p><p>From: ${escapeHtml(input.fullName)} (${escapeHtml(input.mobile)}, ${escapeHtml(normalizedEmail)})</p><p>${escapeHtml(input.message)}</p>`,
        });
      }

      return NextResponse.json({ success: true }, { status: 201 });
    }

    const { error: insertErr } = await supabase.from("enquiries").insert({
      full_name: input.fullName,
      email: normalizedEmail,
      mobile: input.mobile,
      subject: input.subject,
      message: input.message,
      status: "new",
    });

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to save enquiry. Please try again." },
        { status: 500 }
      );
    }

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await sendNotificationEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New Website Enquiry: ${input.subject}`,
        text: `From: ${input.fullName} (${input.mobile}, ${normalizedEmail})\n\n${input.message}`,
        html: `<p><strong>New Enquiry: ${escapeHtml(input.subject)}</strong></p><p>From: ${escapeHtml(input.fullName)} (${escapeHtml(input.mobile)}, ${escapeHtml(normalizedEmail)})</p><p>${escapeHtml(input.message)}</p>`,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
