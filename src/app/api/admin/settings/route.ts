import { NextResponse } from "next/server";
import { getAuthenticatedStaffProfile } from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";

export async function GET() {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ settings: readLocalDb().website_settings });
  }

  const { data, error } = await supabase
    .from("website_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function PATCH(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff || staff.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Administrator role required." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const allowed = [
    "site_name",
    "tagline",
    "supporting_tagline",
    "logo_url",
    "contact_email",
    "contact_phone",
    "whatsapp_number",
    "instagram_url",
    "office_location",
    "hero_title",
    "hero_subtitle",
    "hero_image_url",
    "intro_heading",
    "intro_body",
    "intro_image_url",
    "footer_note",
    "seo_default_title",
    "seo_default_description",
    "google_analytics_id",
  ];

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    db.website_settings = {
      ...db.website_settings,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeLocalDb(db);
    return NextResponse.json({ settings: db.website_settings });
  }

  if (!body.id) return NextResponse.json({ error: "Settings ID is required." }, { status: 400 });

  const { data, error } = await supabase
    .from("website_settings")
    .update(updates)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ settings: data });
}
