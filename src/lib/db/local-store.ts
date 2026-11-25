import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type {
  Adventure,
  CollaborationEnquiry,
  Enquiry,
  EventImage,
  EventRecord,
  Registration,
  TrekLeader,
  VolunteerRegistration,
  WebsiteSettings,
} from "@/types/database";

export interface LocalDatabase {
  adventures: Adventure[];
  events: EventRecord[];
  event_images: EventImage[];
  trek_leaders: TrekLeader[];
  registrations: Registration[];
  volunteer_registrations: VolunteerRegistration[];
  enquiries: Enquiry[];
  collaboration_enquiries: CollaborationEnquiry[];
  website_settings: WebsiteSettings;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "kaggadu-db.json");

function createDefaultSettings(): WebsiteSettings {
  return {
    id: "default",
    site_name: "Kaggadu Adventures",
    tagline: "LIVE WITH NATURE",
    supporting_tagline: "Explore | Experience | Create Memories",
    logo_url: null,
    contact_email: "",
    contact_phone: "",
    whatsapp_number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "",
    instagram_url: "",
    office_location: "Western Ghats, Karnataka, India",
    hero_title: "LIVE WITH NATURE.",
    hero_subtitle:
      "Discover the unexplored beauty of the Western Ghats. Trek through mountains, explore hidden waterfalls, experience nature and create memories that last forever.",
    hero_image_url: "/images/hero-western-ghats.jpg",
    intro_heading: "BEYOND THE ORDINARY.",
    intro_body:
      "Kaggadu Adventures brings people closer to nature through meaningful outdoor experiences. From mountain treks and coastal explorations to camping, kids' adventures and environmental initiatives, every journey creates a connection with the outdoors.",
    intro_image_url: "/images/intro-trail.jpg",
    footer_note: "Live with Nature | Explore | Experience | Create Memories",
    seo_default_title: "Kaggadu Adventures | Live With Nature",
    seo_default_description:
      "Discover the unexplored beauty of the Western Ghats with Kaggadu Adventures. Curated treks, trips, camping, kids outdoor programs, and conservation volunteer drives.",
    google_analytics_id: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
    updated_at: new Date().toISOString(),
  };
}

function createInitialDb(): LocalDatabase {
  return {
    adventures: [],
    events: [],
    event_images: [],
    trek_leaders: [],
    registrations: [],
    volunteer_registrations: [],
    enquiries: [],
    collaboration_enquiries: [],
    website_settings: createDefaultSettings(),
  };
}

export function readLocalDb(): LocalDatabase {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const initial = createInitialDb();
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      ...createInitialDb(),
      ...parsed,
      website_settings: {
        ...createDefaultSettings(),
        ...(parsed.website_settings || {}),
      },
    };
  } catch {
    return createInitialDb();
  }
}

export function writeLocalDb(db: LocalDatabase): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmpPath, DB_PATH);
}

export function newUuid(): string {
  return crypto.randomUUID();
}
