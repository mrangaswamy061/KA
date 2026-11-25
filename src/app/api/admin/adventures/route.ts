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
    return NextResponse.json({ items: readLocalDb().adventures });
  }

  const { data, error } = await supabase
    .from("adventures")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const title = String(body.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const slug = body.slug ? slugify(body.slug) : slugify(title);
  const price =
    body.price !== "" && body.price !== null && body.price !== undefined
      ? Number(body.price)
      : null;

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const now = new Date().toISOString();
    const item = {
      id: newUuid(),
      category: body.category || "trek",
      title,
      slug: db.adventures.some((a) => a.slug === slug)
        ? `${slug}-${Date.now().toString(36)}`
        : slug,
      short_description: body.short_description || "",
      description: body.description || "",
      location: body.location || "",
      difficulty: body.difficulty || null,
      distance: body.distance || null,
      duration: body.duration || null,
      elevation: body.elevation || null,
      price,
      age_requirement: body.age_requirement || null,
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      itinerary: Array.isArray(body.itinerary) ? body.itinerary : [],
      inclusions: Array.isArray(body.inclusions) ? body.inclusions : [],
      exclusions: Array.isArray(body.exclusions) ? body.exclusions : [],
      safety_guidelines: body.safety_guidelines || null,
      facilities: body.facilities || null,
      accommodation_info: body.accommodation_info || null,
      travel_arrangements: body.travel_arrangements || null,
      supervision_info: body.supervision_info || null,
      cover_image_url: body.cover_image_url || null,
      cover_image_alt: body.cover_image_alt || null,
      is_published: Boolean(body.is_published),
      created_at: now,
      updated_at: now,
    };
    db.adventures.unshift(item);
    writeLocalDb(db);
    return NextResponse.json({ item }, { status: 201 });
  }

  const { data, error } = await supabase
    .from("adventures")
    .insert({
      category: body.category || "trek",
      title,
      slug,
      short_description: body.short_description || "",
      description: body.description || "",
      location: body.location || "",
      difficulty: body.difficulty || null,
      distance: body.distance || null,
      duration: body.duration || null,
      elevation: body.elevation || null,
      price,
      age_requirement: body.age_requirement || null,
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      itinerary: Array.isArray(body.itinerary) ? body.itinerary : [],
      inclusions: Array.isArray(body.inclusions) ? body.inclusions : [],
      exclusions: Array.isArray(body.exclusions) ? body.exclusions : [],
      safety_guidelines: body.safety_guidelines || null,
      facilities: body.facilities || null,
      accommodation_info: body.accommodation_info || null,
      travel_arrangements: body.travel_arrangements || null,
      supervision_info: body.supervision_info || null,
      cover_image_url: body.cover_image_url || null,
      cover_image_alt: body.cover_image_alt || null,
      is_published: Boolean(body.is_published),
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
  if (!body.id) return NextResponse.json({ error: "Adventure ID is required." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const idx = db.adventures.findIndex((a) => a.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found." }, { status: 404 });
    db.adventures[idx] = {
      ...db.adventures[idx],
      ...body,
      updated_at: new Date().toISOString(),
    };
    writeLocalDb(db);
    return NextResponse.json({ item: db.adventures[idx] });
  }

  const updates: Record<string, unknown> = {};
  const fields = [
    "category",
    "title",
    "slug",
    "short_description",
    "description",
    "location",
    "difficulty",
    "distance",
    "duration",
    "elevation",
    "age_requirement",
    "highlights",
    "itinerary",
    "inclusions",
    "exclusions",
    "safety_guidelines",
    "facilities",
    "accommodation_info",
    "travel_arrangements",
    "supervision_info",
    "cover_image_url",
    "cover_image_alt",
    "is_published",
  ];
  for (const key of fields) {
    if (key in body) updates[key] = body[key];
  }
  if ("price" in body) {
    updates.price =
      body.price !== "" && body.price !== null && body.price !== undefined
        ? Number(body.price)
        : null;
  }

  const { data, error } = await supabase
    .from("adventures")
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
    db.adventures = db.adventures.filter((a) => a.id !== id);
    writeLocalDb(db);
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("adventures").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
