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

  const body = await request.json();
  const fullName = String(body.full_name || "").trim();
  if (!fullName) return NextResponse.json({ error: "Full name is required." }, { status: 400 });

  const slug = body.slug ? slugify(body.slug) : slugify(fullName);
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const now = new Date().toISOString();
    const item = {
      id: newUuid(),
      full_name: fullName,
      slug: db.trek_leaders.some((l) => l.slug === slug)
        ? `${slug}-${Date.now().toString(36)}`
        : slug,
      bio: body.bio || "",
      experience: body.experience || "",
      specialisation: body.specialisation || "",
      avatar_url: body.avatar_url || null,
      avatar_alt: body.avatar_alt || null,
      is_published: Boolean(body.is_published),
      sort_order: Number(body.sort_order || 0),
      created_at: now,
      updated_at: now,
    };
    db.trek_leaders.push(item);
    writeLocalDb(db);
    return NextResponse.json({ item }, { status: 201 });
  }

  const { data, error } = await supabase
    .from("trek_leaders")
    .insert({
      full_name: fullName,
      slug,
      bio: body.bio || "",
      experience: body.experience || "",
      specialisation: body.specialisation || "",
      avatar_url: body.avatar_url || null,
      avatar_alt: body.avatar_alt || null,
      is_published: Boolean(body.is_published),
      sort_order: Number(body.sort_order || 0),
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
  if (!body.id) return NextResponse.json({ error: "Leader ID is required." }, { status: 400 });

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const idx = db.trek_leaders.findIndex((l) => l.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found." }, { status: 404 });
    db.trek_leaders[idx] = {
      ...db.trek_leaders[idx],
      ...body,
      updated_at: new Date().toISOString(),
    };
    writeLocalDb(db);
    return NextResponse.json({ item: db.trek_leaders[idx] });
  }

  const updates: Record<string, unknown> = {};
  for (const key of [
    "full_name",
    "slug",
    "bio",
    "experience",
    "specialisation",
    "avatar_url",
    "avatar_alt",
    "is_published",
    "sort_order",
  ]) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("trek_leaders")
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
    db.trek_leaders = db.trek_leaders.filter((l) => l.id !== id);
    writeLocalDb(db);
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase.from("trek_leaders").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
