import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasSupabaseConfigMismatch } from "@/lib/services/admin-auth";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { volunteerRegistrationSchema } from "@/lib/validation/schemas";
import {
  escapeHtml,
  generateReferenceCode,
  isDeadlinePassed,
} from "@/lib/utils/format";
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
      if (isDeadlinePassed(event.registration_deadline)) {
        return NextResponse.json(
          { error: "The registration deadline for this volunteer drive has passed." },
          { status: 400 }
        );
      }

      const activeStatuses = ["new", "contacted", "confirmed"];
      const existing = db.volunteer_registrations.find(
        (r) =>
          r.event_id === input.eventId &&
          activeStatuses.includes(r.status) &&
          (r.mobile === input.mobile || r.email.toLowerCase() === normalizedEmail)
      );
      if (existing) {
        return NextResponse.json(
          {
            error: `You are already registered for this volunteer drive (Reference: ${existing.reference_code}).`,
          },
          { status: 409 }
        );
      }

      if (event.max_participants !== null) {
        const booked = db.volunteer_registrations
          .filter((r) => r.event_id === input.eventId && activeStatuses.includes(r.status))
          .reduce((sum, r) => sum + (r.participants_count || 0), 0);
        if (booked + input.participantsCount > event.max_participants) {
          const remaining = Math.max(0, event.max_participants - booked);
          return NextResponse.json(
            {
              error:
                remaining === 0
                  ? "This volunteer drive is currently full."
                  : `Only ${remaining} spot(s) remaining for this volunteer drive.`,
            },
            { status: 400 }
          );
        }
      }

      const referenceCode = generateReferenceCode("KGDV");
      const now = new Date().toISOString();
      db.volunteer_registrations.unshift({
        id: newUuid(),
        reference_code: referenceCode,
        event_id: input.eventId,
        full_name: input.fullName,
        mobile: input.mobile,
        email: normalizedEmail,
        participants_count: input.participantsCount,
        message: input.message || null,
        consent_accepted: true,
        status: "new",
        internal_notes: null,
        created_at: now,
        updated_at: now,
      });
      writeLocalDb(db);

      const safeName = escapeHtml(input.fullName);
      const safeTitle = escapeHtml(event.title);
      const emailResult = await sendNotificationEmail({
        to: normalizedEmail,
        subject: `Volunteer Registration Received: ${event.title} (${referenceCode})`,
        text: `Hello ${input.fullName},\n\nThank you for volunteering for ${event.title} (${event.start_date}).\nReference Code: ${referenceCode}\n\n— Kaggadu Adventures`,
        html: `<p>Hello ${safeName},</p><p>Thank you for registering as a volunteer for <strong>${safeTitle}</strong> (${escapeHtml(event.start_date)}).</p><p><strong>Reference Code:</strong> ${referenceCode}</p><p>— Kaggadu Adventures</p>`,
      });

      if (process.env.ADMIN_NOTIFICATION_EMAIL) {
        await sendNotificationEmail({
          to: process.env.ADMIN_NOTIFICATION_EMAIL,
          subject: `New Volunteer Registration: ${event.title} (${referenceCode})`,
          text: `Name: ${input.fullName}\nMobile: ${input.mobile}\nEmail: ${normalizedEmail}\nParticipants: ${input.participantsCount}\nRef: ${referenceCode}`,
          html: `<p><strong>New Volunteer Registration</strong></p><ul><li>Event: ${safeTitle}</li><li>Ref: ${referenceCode}</li><li>Name: ${safeName}</li><li>Mobile: ${escapeHtml(input.mobile)}</li><li>Email: ${escapeHtml(normalizedEmail)}</li><li>Participants: ${input.participantsCount}</li></ul>`,
        });
      }

      return NextResponse.json(
        { success: true, referenceCode, emailSent: emailResult.sent },
        { status: 201 }
      );
    }

    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id, title, start_date, status, category, max_participants, registration_deadline")
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

    if (isDeadlinePassed(event.registration_deadline)) {
      return NextResponse.json(
        { error: "The registration deadline for this volunteer drive has passed." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("volunteer_registrations")
      .select("id, reference_code")
      .eq("event_id", input.eventId)
      .in("status", ["new", "contacted", "confirmed"])
      .or(
        `mobile.eq."${input.mobile.replace(/"/g, "")}",email.eq."${normalizedEmail.replace(/"/g, "")}"`
      )
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

    if (event.max_participants !== null) {
      const { data: activeRegs } = await supabase
        .from("volunteer_registrations")
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
                ? "This volunteer drive is currently full."
                : `Only ${remaining} spot(s) remaining for this volunteer drive.`,
          },
          { status: 400 }
        );
      }
    }

    const referenceCode = generateReferenceCode("KGDV");
    const { error: insertErr } = await supabase.from("volunteer_registrations").insert({
      reference_code: referenceCode,
      event_id: input.eventId,
      full_name: input.fullName,
      mobile: input.mobile,
      email: normalizedEmail,
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

    const safeName = escapeHtml(input.fullName);
    const safeTitle = escapeHtml(event.title);
    const emailResult = await sendNotificationEmail({
      to: normalizedEmail,
      subject: `Volunteer Registration Received: ${event.title} (${referenceCode})`,
      text: `Hello ${input.fullName},\n\nThank you for volunteering for ${event.title} (${event.start_date}).\nReference Code: ${referenceCode}\n\n— Kaggadu Adventures`,
      html: `<p>Hello ${safeName},</p><p>Thank you for registering as a volunteer for <strong>${safeTitle}</strong> (${escapeHtml(event.start_date)}).</p><p><strong>Reference Code:</strong> ${referenceCode}</p><p>— Kaggadu Adventures</p>`,
    });

    if (process.env.ADMIN_NOTIFICATION_EMAIL) {
      await sendNotificationEmail({
        to: process.env.ADMIN_NOTIFICATION_EMAIL,
        subject: `New Volunteer Registration: ${event.title} (${referenceCode})`,
        text: `Name: ${input.fullName}\nMobile: ${input.mobile}\nEmail: ${normalizedEmail}\nParticipants: ${input.participantsCount}\nRef: ${referenceCode}`,
        html: `<p><strong>New Volunteer Registration</strong></p><ul><li>Event: ${safeTitle}</li><li>Ref: ${referenceCode}</li><li>Name: ${safeName}</li><li>Mobile: ${escapeHtml(input.mobile)}</li><li>Email: ${escapeHtml(normalizedEmail)}</li><li>Participants: ${input.participantsCount}</li></ul>`,
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
