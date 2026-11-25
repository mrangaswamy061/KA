import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { registrationSchema } from "@/lib/validation/schemas";
import { generateReferenceCode } from "@/lib/utils/format";
import { sendNotificationEmail } from "@/lib/email/mailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid registration data." },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const supabase = createAdminSupabaseClient();

    if (!supabase) {
      const db = readLocalDb();
      const event = db.events.find((e) => e.id === input.eventId);
      if (!event) {
        return NextResponse.json({ error: "Selected event was not found." }, { status: 404 });
      }
      if (event.status !== "published") {
        return NextResponse.json(
          { error: `Registration is currently unavailable (${event.status.replace(/_/g, " ")}).` },
          { status: 400 }
        );
      }
      if (
        event.registration_deadline &&
        new Date(event.registration_deadline).getTime() < Date.now()
      ) {
        return NextResponse.json(
          { error: "The registration deadline for this event has passed." },
          { status: 400 }
        );
      }

      const activeStatuses = ["new", "contacted", "confirmed"];
      const existing = db.registrations.find(
        (r) =>
          r.event_id === input.eventId &&
          activeStatuses.includes(r.status) &&
          (r.mobile === input.mobile || r.email.toLowerCase() === input.email.toLowerCase())
      );
      if (existing) {
        return NextResponse.json(
          {
            error: `A registration for this mobile or email already exists (Reference: ${existing.reference_code}).`,
          },
          { status: 409 }
        );
      }

      if (event.max_participants !== null) {
        const booked = db.registrations
          .filter((r) => r.event_id === input.eventId && activeStatuses.includes(r.status))
          .reduce((sum, r) => sum + (r.participants_count || 0), 0);
        if (booked + input.participantsCount > event.max_participants) {
          const remaining = Math.max(0, event.max_participants - booked);
          return NextResponse.json(
            {
              error:
                remaining === 0
                  ? "This event is currently full."
                  : `Only ${remaining} spot(s) remaining for this event.`,
            },
            { status: 400 }
          );
        }
      }

      const referenceCode = generateReferenceCode("KGD");
      const now = new Date().toISOString();
      db.registrations.unshift({
        id: newUuid(),
        reference_code: referenceCode,
        event_id: input.eventId,
        full_name: input.fullName,
        mobile: input.mobile,
        email: input.email.toLowerCase(),
        participants_count: input.participantsCount,
        emergency_contact: input.emergencyContact || null,
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
        subject: `Registration Received: ${event.title} (${referenceCode})`,
        text: `Hello ${input.fullName},\n\nWe have received your registration for ${event.title} (${event.start_date}).\nReference Code: ${referenceCode}\nParticipants: ${input.participantsCount}\n\nThank you,\nKaggadu Adventures`,
        html: `<p>Hello ${input.fullName},</p><p>We have received your registration for <strong>${event.title}</strong> (${event.start_date}).</p><p><strong>Reference Code:</strong> ${referenceCode}<br/><strong>Participants:</strong> ${input.participantsCount}</p><p>Our team will connect with you shortly.<br/>— Kaggadu Adventures</p>`,
      });

      return NextResponse.json(
        { success: true, referenceCode, emailSent: emailResult.sent },
        { status: 201 }
      );
    }

    // Supabase mode
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id, title, start_date, status, max_participants, registration_deadline")
      .eq("id", input.eventId)
      .maybeSingle();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Selected event was not found." }, { status: 404 });
    }

    if (event.status !== "published") {
      return NextResponse.json(
        { error: `Registration is currently unavailable (${event.status.replace(/_/g, " ")}).` },
        { status: 400 }
      );
    }

    if (
      event.registration_deadline &&
      new Date(event.registration_deadline).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { error: "The registration deadline for this event has passed." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("registrations")
      .select("id, reference_code")
      .eq("event_id", input.eventId)
      .in("status", ["new", "contacted", "confirmed"])
      .or(`mobile.eq.${input.mobile},email.eq.${input.email.toLowerCase()}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: `A registration for this mobile or email already exists (Reference: ${existing.reference_code}).`,
        },
        { status: 409 }
      );
    }

    if (event.max_participants !== null) {
      const { data: activeRegs } = await supabase
        .from("registrations")
        .select("participants_count")
        .eq("event_id", input.eventId)
        .in("status", ["new", "contacted", "confirmed"]);

      const booked = (activeRegs || []).reduce(
        (sum, row) => sum + (row.participants_count || 0),
        0
      );

      if (booked + input.participantsCount > event.max_participants) {
        const remaining = Math.max(0, event.max_participants - booked);
        return NextResponse.json(
          {
            error:
              remaining === 0
                ? "This event is currently full."
                : `Only ${remaining} spot(s) remaining for this event.`,
          },
          { status: 400 }
        );
      }
    }

    const referenceCode = generateReferenceCode("KGD");
    const { error: insertErr } = await supabase.from("registrations").insert({
      reference_code: referenceCode,
      event_id: input.eventId,
      full_name: input.fullName,
      mobile: input.mobile,
      email: input.email.toLowerCase(),
      participants_count: input.participantsCount,
      emergency_contact: input.emergencyContact || null,
      message: input.message || null,
      consent_accepted: true,
      status: "new",
    });

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to save registration. Please try again." },
        { status: 500 }
      );
    }

    const emailResult = await sendNotificationEmail({
      to: input.email,
      subject: `Registration Received: ${event.title} (${referenceCode})`,
      text: `Hello ${input.fullName},\n\nWe have received your registration for ${event.title} (${event.start_date}).\nReference Code: ${referenceCode}\nParticipants: ${input.participantsCount}\n\nThank you,\nKaggadu Adventures`,
      html: `<p>Hello ${input.fullName},</p><p>We have received your registration for <strong>${event.title}</strong> (${event.start_date}).</p><p><strong>Reference Code:</strong> ${referenceCode}<br/><strong>Participants:</strong> ${input.participantsCount}</p><p>Our team will connect with you shortly.<br/>— Kaggadu Adventures</p>`,
    });

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await sendNotificationEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New Event Registration: ${event.title} (${referenceCode})`,
        text: `Name: ${input.fullName}\nMobile: ${input.mobile}\nEmail: ${input.email}\nParticipants: ${input.participantsCount}\nRef: ${referenceCode}`,
        html: `<p><strong>New Registration</strong></p><ul><li>Event: ${event.title}</li><li>Ref: ${referenceCode}</li><li>Name: ${input.fullName}</li><li>Mobile: ${input.mobile}</li><li>Email: ${input.email}</li><li>Participants: ${input.participantsCount}</li></ul>`,
      });
    }

    return NextResponse.json(
      { success: true, referenceCode, emailSent: emailResult.sent },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
}
