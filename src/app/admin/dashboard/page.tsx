import { redirect } from "next/navigation";
import { getAuthenticatedStaffProfile } from "@/lib/services/admin-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getWebsiteSettings } from "@/lib/services/public-data";
import { readLocalDb } from "@/lib/db/local-store";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import type {
  Adventure,
  CollaborationEnquiry,
  Enquiry,
  EventRecord,
  Registration,
  TrekLeader,
  VolunteerRegistration,
} from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await getAuthenticatedStaffProfile();
  if (!profile) {
    redirect("/admin/login");
  }

  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const eventById = new Map(db.events.map((e) => [e.id, e]));
    const regsWithEvent: Registration[] = db.registrations.map((r) => ({
      ...r,
      event: eventById.get(r.event_id),
    }));
    const volRegsWithEvent: VolunteerRegistration[] =
      db.volunteer_registrations.map((r) => ({
        ...r,
        event: eventById.get(r.event_id),
      }));

    return (
      <AdminDashboardClient
        profile={profile}
        initialAdventures={db.adventures}
        initialEvents={db.events}
        initialLeaders={db.trek_leaders}
        initialRegistrations={regsWithEvent}
        initialVolunteerRegistrations={volRegsWithEvent}
        initialEnquiries={db.enquiries}
        initialCollaborations={db.collaboration_enquiries}
        initialSettings={db.website_settings}
      />
    );
  }

  const [
    { data: adventures },
    { data: events },
    { data: trekLeaders },
    { data: registrations },
    { data: volunteerRegistrations },
    { data: enquiries },
    { data: collaborations },
    settings,
  ] = await Promise.all([
    supabase.from("adventures").select("*").order("created_at", { ascending: false }),
    supabase.from("events").select("*").order("start_date", { ascending: true }),
    supabase.from("trek_leaders").select("*").order("sort_order", { ascending: true }),
    supabase
      .from("registrations")
      .select("*, event:events(id, title, slug, start_date, category)")
      .order("created_at", { ascending: false }),
    supabase
      .from("volunteer_registrations")
      .select("*, event:events(id, title, slug, start_date)")
      .order("created_at", { ascending: false }),
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
    supabase
      .from("collaboration_enquiries")
      .select("*")
      .order("created_at", { ascending: false }),
    getWebsiteSettings(),
  ]);

  return (
    <AdminDashboardClient
      profile={profile}
      initialAdventures={(adventures as Adventure[]) || []}
      initialEvents={(events as EventRecord[]) || []}
      initialLeaders={(trekLeaders as TrekLeader[]) || []}
      initialRegistrations={(registrations as Registration[]) || []}
      initialVolunteerRegistrations={
        (volunteerRegistrations as VolunteerRegistration[]) || []
      }
      initialEnquiries={(enquiries as Enquiry[]) || []}
      initialCollaborations={(collaborations as CollaborationEnquiry[]) || []}
      initialSettings={settings}
    />
  );
}
