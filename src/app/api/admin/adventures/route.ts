import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getAuthenticatedStaffProfile,
  hasSupabaseConfigMismatch,
} from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { parseOptionalNumber, safeSlug } from "@/lib/utils/format";

const PATCH_STRING_FIELDS = [
  "category",
  "title",
  "slug",
  "short_description",
  "description",
  "location",
] as const;

const PATCH_NULLABLE_STRING_FIELDS = [
  "difficulty",
  "distance",
  "duration",
  "elevation",
  "age_requirement",
  "safety_guidelines",
  "facilities",
  "accommodation_info",
  "travel_arrangements",
  "supervision_info",
  "cover_image_url",
  "cover_image_alt",
] as const;

const PATCH_ARRAY_FIELDS = [
  "highlights",
  "itinerary",
  "inclusions",
  "exclusions",
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
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const baseSlug = safeSlug(body.slug, title);
  const price = parseOptionalNumber(body.price);

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const now = new Date().toISOString();
    const item = {
      id: newUuid(),
      category: (body.category as "trek" | "trip" | "camping" | "kids") || "trek",
      title,
      slug: db.adventures.some((a) => a.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString(36)}`
        : baseSlug,
      short_description: String(body.short_description || ""),
      description: String(body.description || ""),
      location: String(body.location || ""),
      difficulty: (body.difficulty as string) || null,
      distance: (body.distance as string) || null,
      duration: (body.duration as string) || null,
      elevation: (body.elevation as string) || null,
      price,
      age_requirement: (body.age_requirement as string) || null,
      highlights: Array.isArray(body.highlights) ? body.highlights : [],
      itinerary: Array.isArray(body.itinerary) ? body.itinerary : [],
      inclusions: Array.isArray(body.inclusions) ? body.inclusions : [],
      exclusions: Array.isArray(body.exclusions) ? body.exclusions : [],
      safety_guidelines: (body.safety_guidelines as string) || null,
      facilities: (body.facilities as string) || null,
      accommodation_info: (body.accommodation_info as string) || null,
      travel_arrangements: (body.travel_arrangements as string) || null,
      supervision_info: (body.supervision_info as string) || null,
      cover_image_url: (body.cover_image_url as string) || null,
      cover_image_alt: (body.cover_image_alt as string) || null,
      is_published: Boolean(body.is_published),
      created_at: now,
      updated_at: now,
    };
    db.adventures.unshift(item);
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ item }, { status: 201 });
  }

  const { data: existingSlug } = await supabase
    .from("adventures")
    .select("id")
    .eq("slug", baseSlug)
    .maybeSingle();

  const finalSlug = existingSlug
    ? `${baseSlug}-${Date.now().toString(36)}`
    : baseSlug;

  const { data, error } = await supabase
    .from("adventures")
    .insert({
      category: body.category || "trek",
      title,
      slug: finalSlug,
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

  if (!body.id) return NextResponse.json({ error: "Adventure ID is required." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const key of PATCH_STRING_FIELDS) {
    if (key in body) updates[key] = String(body[key] ?? "");
  }
  for (const key of PATCH_NULLABLE_STRING_FIELDS) {
    if (key in body) updates[key] = body[key] === "" ? null : body[key];
  }
  for (const key of PATCH_ARRAY_FIELDS) {
    if (key in body && Array.isArray(body[key])) updates[key] = body[key];
  }
  if ("is_published" in body) {
    updates.is_published = Boolean(body.is_published);
  }
  if ("price" in body) {
    updates.price = parseOptionalNumber(body.price);
  }
  if ("slug" in updates) {
    updates.slug = safeSlug(updates.slug, String(updates.title || "adventure"));
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const idx = db.adventures.findIndex((a) => a.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found." }, { status: 404 });
    db.adventures[idx] = {
      ...db.adventures[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ item: db.adventures[idx] });
  }

  const { data, error } = await supabase
    .from("adventures")
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
    db.adventures = db.adventures.filter((a) => a.id !== id);
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("adventures").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
