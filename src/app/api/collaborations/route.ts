import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { collaborationEnquirySchema } from "@/lib/validation/schemas";
import { sendNotificationEmail } from "@/lib/email/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = collaborationEnquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid collaboration enquiry." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const supabase = createAdminSupabaseClient();

    if (!supabase) {
      const db = readLocalDb();
      const now = new Date().toISOString();
      db.collaboration_enquiries.unshift({
        id: newUuid(),
        name: input.name,
        organisation: input.organisation,
        email: input.email.toLowerCase(),
        mobile: input.mobile,
        collaboration_type: input.collaborationType,
        message: input.message,
        status: "new",
        internal_notes: null,
        created_at: now,
        updated_at: now,
      });
      writeLocalDb(db);
      return NextResponse.json({ success: true }, { status: 201 });
    }

    const { error: insertErr } = await supabase.from("collaboration_enquiries").insert({
      name: input.name,
      organisation: input.organisation,
      email: input.email.toLowerCase(),
      mobile: input.mobile,
      collaboration_type: input.collaborationType,
      message: input.message,
      status: "new",
    });

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to save collaboration enquiry." },
        { status: 500 }
      );
    }

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await sendNotificationEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New Collaboration Enquiry: ${input.organisation}`,
        text: `Name: ${input.name}\nOrganisation: ${input.organisation}\nType: ${input.collaborationType}\nMobile: ${input.mobile}\nEmail: ${input.email}\n\n${input.message}`,
        html: `<p><strong>Collaboration Enquiry from ${input.organisation}</strong></p><p>${input.name} (${input.collaborationType})</p><p>${input.message}</p>`,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
