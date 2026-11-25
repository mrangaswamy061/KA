import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { volunteerRegistrationSchema } from "@/lib/validation/schemas";
import { generateReferenceCode } from "@/lib/utils/format";
import { sendNotificationEmail } from "@/lib/email/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = volunteerRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid volunteer registration." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const supabase = createAdminSupabaseClient();

    if (!supabase) {
      const db = readLocalDb();
      const event = db.events.find(
        (e) => e.id === input.eventId && e.category === "volunteer"
      );
      if (!event) {
        return NextResponse.json(
          { error: "Selected volunteer event was not found." },
          { status: 404 }
        );
      }
      if (event.status !== "published") {
        return NextResponse.json(
          { error: "Registration for this volunteer drive is closed." },
          { status: 400 }
        );
      }
      const existing = db.volunteer_registrations.find(
        (r) =>
          r.event_id === input.eventId &&
          ["new", "contacted", "confirmed"].includes(r.status) &&
          (r.mobile === input.mobile || r.email.toLowerCase() === input.email.toLowerCase())
      );
      if (existing) {
        return NextResponse.json(
          {
            error: `You are already registered for this volunteer drive (Reference: ${existing.reference_code}).`,
          },
          { status: 409 }
        );
      }

      const referenceCode = generateReferenceCode("KGDV");
      const now = new Date().toISOString();
      db.volunteer_registrations.unshift({
        id: newUuid(),
        reference_code: referenceCode,
        event_id: input.eventId,
        full_name: input.fullName,
        mobile: input.mobile,
        email: input.email.toLowerCase(),
        participants_count: input.participantsCount,
        message: input.message || null,
        consent_accepted: true,
        status: "new",
        internal_notes: null,
        created_at: now,
        updated_at: now,
      });
      writeLocalDb(db);

      const emailResult = await sendNotificationEmail({
        to: input.email,
        subject: `Volunteer Registration Received: ${event.title} (${referenceCode})`,
        text: `Hello ${input.fullName},\n\nThank you for volunteering for ${event.title} (${event.start_date}).\nReference Code: ${referenceCode}\n\n— Kaggadu Adventures`,
        html: `<p>Hello ${input.fullName},</p><p>Thank you for registering as a volunteer for <strong>${event.title}</strong> (${event.start_date}).</p><p><strong>Reference Code:</strong> ${referenceCode}</p><p>— Kaggadu Adventures</p>`,
      });

      return NextResponse.json(
        { success: true, referenceCode, emailSent: emailResult.sent },
        { status: 201 }
      );
    }

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id, title, start_date, status, category, max_participants")
      .eq("id", input.eventId)
      .maybeSingle();

    if (eventErr || !event || event.category !== "volunteer") {
      return NextResponse.json(
        { error: "Selected volunteer event was not found." },
        { status: 404 }
      );
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Registration for this volunteer drive is closed." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("volunteer_registrations")
      .select("id, reference_code")
      .eq("event_id", input.eventId)
      .in("status", ["new", "contacted", "confirmed"])
      .or(`mobile.eq.${input.mobile},email.eq.${input.email.toLowerCase()}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: `You are already registered for this volunteer drive (Reference: ${existing.reference_code}).`,
        },
        { status: 409 }
      );
    }

    const referenceCode = generateReferenceCode("KGDV");
    const { error: insertErr } = await supabase.from("volunteer_registrations").insert({
      reference_code: referenceCode,
      event_id: input.eventId,
      full_name: input.fullName,
      mobile: input.mobile,
      email: input.email.toLowerCase(),
      participants_count: input.participantsCount,
      message: input.message || null,
      consent_accepted: true,
      status: "new",
    });

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to save volunteer registration." },
        { status: 500 }
      );
    }

    const emailResult = await sendNotificationEmail({
      to: input.email,
      subject: `Volunteer Registration Received: ${event.title} (${referenceCode})`,
      text: `Hello ${input.fullName},\n\nThank you for volunteering for ${event.title} (${event.start_date}).\nReference Code: ${referenceCode}\n\n— Kaggadu Adventures`,
      html: `<p>Hello ${input.fullName},</p><p>Thank you for registering as a volunteer for <strong>${event.title}</strong> (${event.start_date}).</p><p><strong>Reference Code:</strong> ${referenceCode}</p><p>— Kaggadu Adventures</p>`,
    });

    return NextResponse.json(
      { success: true, referenceCode, emailSent: emailResult.sent },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
