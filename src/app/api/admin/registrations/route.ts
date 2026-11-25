import { NextResponse } from "next/server";
import { getAuthenticatedStaffProfile } from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";

export async function GET(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const isVolunteer = searchParams.get("type") === "volunteer";

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const eventById = new Map(db.events.map((e) => [e.id, e]));
    const source = isVolunteer ? db.volunteer_registrations : db.registrations;
    return NextResponse.json({
      items: source.map((r) => ({ ...r, event: eventById.get(r.event_id) })),
    });
  }

  const table = isVolunteer ? "volunteer_registrations" : "registrations";
  const { data, error } = await supabase
    .from(table)
    .select("*, event:events(id, title, slug, start_date, category)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data || [] });
}

export async function PATCH(request: Request) {
  const staff = await getAuthenticatedStaffProfile();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  if (!body.id) return NextResponse.json({ error: "ID is required." }, { status: 400 });

  const isVolunteer = body.type === "volunteer";
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    const db = readLocalDb();
    const list = isVolunteer ? db.volunteer_registrations : db.registrations;
    const idx = list.findIndex((r) => r.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if ("status" in body) list[idx].status = body.status;
    if ("internal_notes" in body) list[idx].internal_notes = body.internal_notes;
    list[idx].updated_at = new Date().toISOString();
    writeLocalDb(db);
    return NextResponse.json({ item: list[idx] });
  }

  const table = isVolunteer ? "volunteer_registrations" : "registrations";
  const updates: Record<string, unknown> = {};
  if ("status" in body) updates.status = body.status;
  if ("internal_notes" in body) updates.internal_notes = body.internal_notes;

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
