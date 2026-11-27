import { NextResponse } from "next/server";
import {
  getAuthenticatedStaffProfile,
  hasSupabaseConfigMismatch,
} from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLocalDb, writeLocalDb } from "@/lib/db/local-store";
import type { EnquiryStatus } from "@/types/database";

const VALID_STATUSES: EnquiryStatus[] = [
  "new",
  "in_progress",
  "resolved",
  "archived",
];

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
    const db = readLocalDb();
    return NextResponse.json({
      enquiries: db.enquiries,
      collaborations: db.collaboration_enquiries,
    });
  }

  const [{ data: enquiries }, { data: collaborations }] = await Promise.all([
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
    supabase
      .from("collaboration_enquiries")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    enquiries: enquiries || [],
    collaborations: collaborations || [],
  });
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

  if (!body.id) return NextResponse.json({ error: "ID is required." }, { status: 400 });
  if ("status" in body && !VALID_STATUSES.includes(body.status as EnquiryStatus)) {
    return NextResponse.json({ error: "Invalid enquiry status." }, { status: 400 });
  }

  const isCollab = body.kind === "collaboration";
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    const db = readLocalDb();
    const list = isCollab ? db.collaboration_enquiries : db.enquiries;
    const idx = list.findIndex((i) => i.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if ("status" in body) list[idx].status = body.status as EnquiryStatus;
    if ("internal_notes" in body) {
      list[idx].internal_notes =
        body.internal_notes === "" || body.internal_notes === null
          ? null
          : String(body.internal_notes);
    }
    list[idx].updated_at = new Date().toISOString();
    writeLocalDb(db);
    return NextResponse.json({ item: list[idx] });
  }

  const table = isCollab ? "collaboration_enquiries" : "enquiries";
  const updates: Record<string, unknown> = {};
  if ("status" in body) updates.status = body.status;
  if ("internal_notes" in body) {
    updates.internal_notes =
      body.internal_notes === "" || body.internal_notes === null
        ? null
        : String(body.internal_notes);
  }

  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}
