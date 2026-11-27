import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  getAuthenticatedStaffProfile,
  hasSupabaseConfigMismatch,
} from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";

const ALLOWED_FIELDS = [
  "site_name",
  "tagline",
  "supporting_tagline",
  "logo_url",
  "contact_email",
  "contact_phone",
  "secondary_phone",
  "whatsapp_number",
  "instagram_url",
  "google_review_url",
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

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const updates: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
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
    revalidatePath("/", "layout");
    return NextResponse.json({ settings: db.website_settings });
  }

  let targetId =
    typeof body.id === "string" && UUID_REGEX.test(body.id) ? body.id : null;

  if (!targetId) {
    const { data: existingRow } = await supabase
      .from("website_settings")
      .select("id")
      .limit(1)
      .maybeSingle();
    targetId = existingRow?.id ?? null;
  }

  const query = targetId
    ? supabase.from("website_settings").update(updates).eq("id", targetId)
    : supabase.from("website_settings").insert(updates);

  const { data, error } = await query.select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  revalidatePath("/", "layout");
  return NextResponse.json({ settings: data });
}
