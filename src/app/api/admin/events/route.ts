import { NextResponse } from "next/server";
import { getAuthenticatedStaffProfile } from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { slugify } from "@/lib/utils/format";

export async function GET() {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title || !body.start_date) {
    return NextResponse.json(
      { error: "Title and start date are required." },
      { status: 400 }
    );
  }

  const slug = body.slug ? slugify(body.slug) : `${slugify(title)}-${body.start_date}`;
  const price =
    body.price !== "" && body.price !== null && body.price !== undefined
      ? Number(body.price)
      : null;
  const maxParticipants =
    body.max_participants !== "" &&
    body.max_participants !== null &&
    body.max_participants !== undefined
      ? Number(body.max_participants)
      : null;

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const now = new Date().toISOString();
    const item = {
      id: newUuid(),
      adventure_id: body.adventure_id || null,
      category: body.category || "trek",
      title,
      slug: db.events.some((e) => e.slug === slug)
        ? `${slug}-${Date.now().toString(36)}`
        : slug,
      short_description: body.short_description || "",
      description: body.description || "",
      location: body.location || "",
      map_url: body.map_url || null,
      latitude:
        body.latitude !== "" && body.latitude !== null && body.latitude !== undefined
          ? Number(body.latitude)
          : null,
      longitude:
        body.longitude !== "" && body.longitude !== null && body.longitude !== undefined
          ? Number(body.longitude)
          : null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      price,
      max_participants: maxParticipants,
      registration_deadline: body.registration_deadline || null,
      status: body.status || "draft",
      registration_instructions: body.registration_instructions || null,
      cover_image_url: body.cover_image_url || null,
      cover_image_alt: body.cover_image_alt || null,
      created_at: now,
      updated_at: now,
    };
    db.events.push(item);
    writeLocalDb(db);
    return NextResponse.json({ item }, { status: 201 });
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      adventure_id: body.adventure_id || null,
      category: body.category || "trek",
      title,
      slug,
      short_description: body.short_description || "",
      description: body.description || "",
      location: body.location || "",
      map_url: body.map_url || null,
      latitude:
        body.latitude !== "" && body.latitude !== null && body.latitude !== undefined
          ? Number(body.latitude)
          : null,
      longitude:
        body.longitude !== "" && body.longitude !== null && body.longitude !== undefined
          ? Number(body.longitude)
          : null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      price,
      max_participants: maxParticipants,
      registration_deadline: body.registration_deadline || null,
      status: body.status || "draft",
      registration_instructions: body.registration_instructions || null,
      cover_image_url: body.cover_image_url || null,
      cover_image_alt: body.cover_image_alt || null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "Event ID is required." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const idx = db.events.findIndex((e) => e.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found." }, { status: 404 });
    db.events[idx] = {
      ...db.events[idx],
      ...body,
      updated_at: new Date().toISOString(),
    };
    writeLocalDb(db);
    return NextResponse.json({ item: db.events[idx] });
  }

  const updates: Record<string, unknown> = {};
  const directFields = [
    "adventure_id",
    "category",
    "title",
    "slug",
    "short_description",
    "description",
    "location",
    "map_url",
    "start_date",
    "end_date",
    "start_time",
    "end_time",
    "registration_deadline",
    "status",
    "registration_instructions",
    "cover_image_url",
    "cover_image_alt",
  ];
  for (const key of directFields) {
    if (key in body) updates[key] = body[key] === "" ? null : body[key];
  }
  for (const numKey of ["price", "max_participants", "latitude", "longitude"]) {
    if (numKey in body) {
      updates[numKey] =
        body[numKey] !== "" && body[numKey] !== null && body[numKey] !== undefined
          ? Number(body[numKey])
          : null;
    }
  }

  const { data, error } = await supabase
    .from("events")
    .update(updates)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    db.events = db.events.filter((e) => e.id !== id);
    writeLocalDb(db);
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
