import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readLocalDb } from "@/lib/db/local-store";
import type {
  Adventure,
  AdventureCategory,
  EventCategory,
  EventImage,
  EventRecord,
  TrekLeader,
  WebsiteSettings,
} from "@/types/database";

const PUBLIC_EVENT_STATUSES = [
  "published",
  "fully_booked",
  "registration_closed",
  "completed",
];

export async function getWebsiteSettings(): Promise<WebsiteSettings> {
  const supabase = await createServerSupabaseClient();
  const local = readLocalDb().website_settings;

  if (!supabase) {
    return local;
  }

  const { data, error } = await supabase
    .from("website_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return local;
  }

  return {
    ...local,
    ...data,
    whatsapp_number:
      data.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    google_analytics_id:
      data.google_analytics_id ||
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ||
      null,
  };
}

export async function getPublishedAdventures(
  category?: AdventureCategory
): Promise<Adventure[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    const items = readLocalDb().adventures.filter((a) => a.is_published);
    return category ? items.filter((a) => a.category === category) : items;
  }

  let query = supabase
    .from("adventures")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as Adventure[];
}

export async function getPublishedAdventureBySlug(
  category: AdventureCategory,
  slug: string
): Promise<{
  adventure: Adventure;
  gallery: EventImage[];
  upcomingEvents: EventRecord[];
} | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const adventure = db.adventures.find(
      (a) => a.category === category && a.slug === slug && a.is_published
    );
    if (!adventure) return null;
    const gallery = db.event_images
      .filter((i) => i.adventure_id === adventure.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const upcomingEvents = db.events
      .filter(
        (e) =>
          e.adventure_id === adventure.id &&
          PUBLIC_EVENT_STATUSES.includes(e.status)
      )
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    return { adventure, gallery, upcomingEvents };
  }

  const { data: adventure, error } = await supabase
    .from("adventures")
    .select("*")
    .eq("category", category)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !adventure) return null;

  const [{ data: gallery }, { data: upcomingEvents }] = await Promise.all([
    supabase
      .from("event_images")
      .select("*")
      .eq("adventure_id", adventure.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("events")
      .select("*")
      .eq("adventure_id", adventure.id)
      .in("status", PUBLIC_EVENT_STATUSES)
      .order("start_date", { ascending: true }),
  ]);

  return {
    adventure: adventure as Adventure,
    gallery: (gallery as EventImage[]) || [],
    upcomingEvents: (upcomingEvents as EventRecord[]) || [],
  };
}

export async function getPublishedEvents(options?: {
  category?: EventCategory;
  upcomingOnly?: boolean;
  limit?: number;
}): Promise<EventRecord[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    let items = readLocalDb().events.filter((e) =>
      PUBLIC_EVENT_STATUSES.includes(e.status)
    );
    if (options?.category) {
      items = items.filter((e) => e.category === options.category);
    }
    if (options?.upcomingOnly) {
      const today = new Date().toISOString().slice(0, 10);
      items = items.filter((e) => e.start_date >= today);
    }
    items.sort((a, b) => a.start_date.localeCompare(b.start_date));
    return options?.limit ? items.slice(0, options.limit) : items;
  }

  let query = supabase
    .from("events")
    .select("*")
    .in("status", PUBLIC_EVENT_STATUSES)
    .order("start_date", { ascending: true });

  if (options?.category) {
    query = query.eq("category", options.category);
  }
  if (options?.upcomingOnly) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.gte("start_date", today);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as EventRecord[];
}

export async function getPublishedEventBySlug(
  slug: string
): Promise<{ event: EventRecord; gallery: EventImage[] } | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    const db = readLocalDb();
    const event = db.events.find(
      (e) => e.slug === slug && PUBLIC_EVENT_STATUSES.includes(e.status)
    );
    if (!event) return null;
    const gallery = db.event_images
      .filter((i) => i.event_id === event.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    return { event, gallery };
  }

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .in("status", PUBLIC_EVENT_STATUSES)
    .maybeSingle();

  if (error || !event) return null;

  const { data: gallery } = await supabase
    .from("event_images")
    .select("*")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true });

  return {
    event: event as EventRecord,
    gallery: (gallery as EventImage[]) || [],
  };
}

export async function getPublishedTrekLeaders(): Promise<TrekLeader[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return readLocalDb()
      .trek_leaders.filter((l) => l.is_published)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  const { data, error } = await supabase
    .from("trek_leaders")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as TrekLeader[];
}

export async function getPublishedTrekLeaderBySlug(
  slug: string
): Promise<TrekLeader | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return (
      readLocalDb().trek_leaders.find(
        (l) => l.slug === slug && l.is_published
      ) || null
    );
  }

  const { data, error } = await supabase
    .from("trek_leaders")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as TrekLeader;
}
