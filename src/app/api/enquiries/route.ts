import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { contactEnquirySchema } from "@/lib/validation/schemas";
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

    const input = parsed.data;
    const supabase = createAdminSupabaseClient();

    if (!supabase) {
      const db = readLocalDb();
      const now = new Date().toISOString();
      db.enquiries.unshift({
        id: newUuid(),
        full_name: input.fullName,
        email: input.email.toLowerCase(),
        mobile: input.mobile,
        subject: input.subject,
        message: input.message,
        status: "new",
        internal_notes: null,
        created_at: now,
        updated_at: now,
      });
      writeLocalDb(db);
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const { error: insertErr } = await supabase.from("enquiries").insert({
      full_name: input.fullName,
      email: input.email.toLowerCase(),
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
        text: `From: ${input.fullName} (${input.mobile}, ${input.email})\n\n${input.message}`,
        html: `<p><strong>New Enquiry: ${input.subject}</strong></p><p>From: ${input.fullName} (${input.mobile}, ${input.email})</p><p>${input.message}</p>`,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
