import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getAuthenticatedStaffProfile,
  hasSupabaseConfigMismatch,
} from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import {
  normalizeOptionalDeadline,
  normalizeOptionalTime,
  parseOptionalNumber,
  safeSlug,
} from "@/lib/utils/format";
import type { EventCategory, EventStatus } from "@/types/database";

const DIRECT_STRING_FIELDS = [
  "category",
  "title",
  "slug",
  "short_description",
  "description",
  "location",
  "start_date",
  "status",
] as const;

const NULLABLE_FIELDS = [
  "adventure_id",
  "map_url",
  "end_date",
  "start_time",
  "end_time",
  "registration_deadline",
  "registration_instructions",
  "cover_image_url",
  "cover_image_alt",
] as const;

export async function GET() {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (hasSupabaseConfigMismatch()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({
      items: readLocalDb().events.sort((a, b) => a.start_date.localeCompare(b.start_date)),
    });
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (hasSupabaseConfigMismatch()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  const startDate = String(body.start_date || "").trim();
  if (!title || !startDate) {
    return NextResponse.json(
      { error: "Title and start date are required." },
      { status: 400 }
    );
  }

  const baseSlug = safeSlug(body.slug, `${title}-${startDate}`);
  const price = parseOptionalNumber(body.price);
  const maxParticipants = parseOptionalNumber(body.max_participants);
  const latitude = parseOptionalNumber(body.latitude);
  const longitude = parseOptionalNumber(body.longitude);

  const parsedStartTime = normalizeOptionalTime(body.start_time);
  if (!parsedStartTime.ok) {
    return NextResponse.json({ error: parsedStartTime.error }, { status: 400 });
  }
  const parsedEndTime = normalizeOptionalTime(body.end_time);
  if (!parsedEndTime.ok) {
    return NextResponse.json({ error: parsedEndTime.error }, { status: 400 });
  }
  const normalizedDeadline = normalizeOptionalDeadline(body.registration_deadline);

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const now = new Date().toISOString();
    const item = {
      id: newUuid(),
      adventure_id: (body.adventure_id as string) || null,
      category: (body.category as EventCategory) || "trek",
      title,
      slug: db.events.some((e) => e.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString(36)}`
        : baseSlug,
      short_description: String(body.short_description || ""),
      description: String(body.description || ""),
      location: String(body.location || ""),
      map_url: (body.map_url as string) || null,
      latitude,
      longitude,
      start_date: startDate,
      end_date: (body.end_date as string) || null,
      start_time: parsedStartTime.value,
      end_time: parsedEndTime.value,
      price,
      max_participants: maxParticipants,
      registration_deadline: normalizedDeadline,
      status: (body.status as EventStatus) || "draft",
      registration_instructions: (body.registration_instructions as string) || null,
      cover_image_url: (body.cover_image_url as string) || null,
      cover_image_alt: (body.cover_image_alt as string) || null,
      created_at: now,
      updated_at: now,
    };
    db.events.push(item);
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ item }, { status: 201 });
  }

  const { data: existingSlug } = await supabase
    .from("events")
    .select("id")
    .eq("slug", baseSlug)
    .maybeSingle();

  const finalSlug = existingSlug
    ? `${baseSlug}-${Date.now().toString(36)}`
    : baseSlug;

  const { data, error } = await supabase
    .from("events")
    .insert({
      adventure_id: body.adventure_id || null,
      category: body.category || "trek",
      title,
      slug: finalSlug,
      short_description: body.short_description || "",
      description: body.description || "",
      location: body.location || "",
      map_url: body.map_url || null,
      latitude,
      longitude,
      start_date: startDate,
      end_date: body.end_date || null,
      start_time: parsedStartTime.value,
      end_time: parsedEndTime.value,
      price,
      max_participants: maxParticipants,
      registration_deadline: normalizedDeadline,
      status: body.status || "draft",
      registration_instructions: body.registration_instructions || null,
      cover_image_url: body.cover_image_url || null,
      cover_image_alt: body.cover_image_alt || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/", "layout");
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (hasSupabaseConfigMismatch()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: "Event ID is required." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const key of DIRECT_STRING_FIELDS) {
    if (key in body) updates[key] = String(body[key] ?? "");
  }
  for (const key of NULLABLE_FIELDS) {
    if (key in body) updates[key] = body[key] === "" ? null : body[key];
  }
  if ("start_time" in updates) {
    const parsedTime = normalizeOptionalTime(updates.start_time);
    if (!parsedTime.ok) {
      return NextResponse.json({ error: parsedTime.error }, { status: 400 });
    }
    updates.start_time = parsedTime.value;
  }
  if ("end_time" in updates) {
    const parsedTime = normalizeOptionalTime(updates.end_time);
    if (!parsedTime.ok) {
      return NextResponse.json({ error: parsedTime.error }, { status: 400 });
    }
    updates.end_time = parsedTime.value;
  }
  if ("registration_deadline" in updates) {
    updates.registration_deadline = normalizeOptionalDeadline(
      updates.registration_deadline
    );
  }
  for (const numKey of ["price", "max_participants", "latitude", "longitude"] as const) {
    if (numKey in body) {
      updates[numKey] = parseOptionalNumber(body[numKey]);
    }
  }
  if ("slug" in updates) {
    updates.slug = safeSlug(updates.slug, String(updates.title || "event"));
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const idx = db.events.findIndex((e) => e.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found." }, { status: 404 });
    db.events[idx] = {
      ...db.events[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ item: db.events[idx] });
  }

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/", "layout");
  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (hasSupabaseConfigMismatch()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const hasLinkedRegs =
      db.registrations.some((r) => r.event_id === id) ||
      db.volunteer_registrations.some((r) => r.event_id === id);
    if (hasLinkedRegs) {
      return NextResponse.json(
        { error: "Cannot delete event with existing registrations." },
        { status: 409 }
      );
    }
    db.events = db.events.filter((e) => e.id !== id);
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Cannot delete event with existing registrations." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
