import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getAuthenticatedStaffProfile,
  hasSupabaseConfigMismatch,
} from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { newUuid, readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import { parseOptionalNumber, safeSlug } from "@/lib/utils/format";

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
      items: readLocalDb().trek_leaders.sort((a, b) => a.sort_order - b.sort_order),
    });
  }

  const { data, error } = await supabase
    .from("trek_leaders")
    .select("*")
    .order("sort_order", { ascending: true });

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

  const fullName = String(body.full_name || "").trim();
  if (!fullName) return NextResponse.json({ error: "Full name is required." }, { status: 400 });

  const baseSlug = safeSlug(body.slug, fullName);
  const sortOrder = parseOptionalNumber(body.sort_order) ?? 0;

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const now = new Date().toISOString();
    const item = {
      id: newUuid(),
      full_name: fullName,
      slug: db.trek_leaders.some((l) => l.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString(36)}`
        : baseSlug,
      bio: String(body.bio || ""),
      experience: String(body.experience || ""),
      specialisation: String(body.specialisation || ""),
      avatar_url: (body.avatar_url as string) || null,
      avatar_alt: (body.avatar_alt as string) || null,
      is_published: Boolean(body.is_published),
      sort_order: sortOrder,
      created_at: now,
      updated_at: now,
    };
    db.trek_leaders.push(item);
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ item }, { status: 201 });
  }

  const { data: existingSlug } = await supabase
    .from("trek_leaders")
    .select("id")
    .eq("slug", baseSlug)
    .maybeSingle();

  const finalSlug = existingSlug
    ? `${baseSlug}-${Date.now().toString(36)}`
    : baseSlug;

  const { data, error } = await supabase
    .from("trek_leaders")
    .insert({
      full_name: fullName,
      slug: finalSlug,
      bio: body.bio || "",
      experience: body.experience || "",
      specialisation: body.specialisation || "",
      avatar_url: body.avatar_url || null,
      avatar_alt: body.avatar_alt || null,
      is_published: Boolean(body.is_published),
      sort_order: sortOrder,
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

  if (!body.id) return NextResponse.json({ error: "Leader ID is required." }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const key of ["full_name", "slug", "bio", "experience", "specialisation"] as const) {
    if (key in body) updates[key] = String(body[key] ?? "");
  }
  for (const key of ["avatar_url", "avatar_alt"] as const) {
    if (key in body) updates[key] = body[key] === "" ? null : body[key];
  }
  if ("is_published" in body) {
    updates.is_published = Boolean(body.is_published);
  }
  if ("sort_order" in body) {
    updates.sort_order = parseOptionalNumber(body.sort_order) ?? 0;
  }
  if ("slug" in updates) {
    updates.slug = safeSlug(updates.slug, String(updates.full_name || "leader"));
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const idx = db.trek_leaders.findIndex((l) => l.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found." }, { status: 404 });
    db.trek_leaders[idx] = {
      ...db.trek_leaders[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ item: db.trek_leaders[idx] });
  }

  const { data, error } = await supabase
    .from("trek_leaders")
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
    db.trek_leaders = db.trek_leaders.filter((l) => l.id !== id);
    writeLocalDb(db);
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("trek_leaders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidatePath("/", "layout");
  return NextResponse.json({ success: true });
}
