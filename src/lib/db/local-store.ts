import fs from "node:fs";
import os from "node:os";
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
import { SEED_ADVENTURES, SEED_EVENTS } from "./seed-data";

export interface LocalMediaItem {
  name: string;
  path: string;
  publicUrl: string;
  folder: string;
  created_at: string;
}

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
  media_items?: LocalMediaItem[];
}

const SEED_DIR = path.join(process.cwd(), "data");
const SEED_DB_PATH = path.join(SEED_DIR, "kaggadu-db.json");
const TMP_DB_PATH = path.join(os.tmpdir(), "kaggadu-db.json");

const globalCache = globalThis as typeof globalThis & {
  __kaggaduLocalDb?: LocalDatabase;
};

function isReadOnlyEnvironment(): boolean {
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return true;
  }
  try {
    fs.mkdirSync(SEED_DIR, { recursive: true });
    fs.accessSync(SEED_DIR, fs.constants.W_OK);
    return false;
  } catch {
    return true;
  }
}

function getActiveDbPath(): string {
  return isReadOnlyEnvironment() ? TMP_DB_PATH : SEED_DB_PATH;
}

function createDefaultSettings(): WebsiteSettings {
  return {
    id: "default",
    site_name: "Kaggadu Adventures",
    tagline: "LIVE WITH NATURE",
    supporting_tagline: "Explore | Experience | Create Memories",
    logo_url: "/images/kaggadu-logo.png",
    contact_email: "kaggadu.com",
    contact_phone: "7760013106",
    secondary_phone: "8310668859",
    whatsapp_number:
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
      "https://wa.me/message/2RLALIQ3GCUQM1",
    instagram_url:
      "https://www.instagram.com/kaggadu_adventures?utm_source=ig_web_button_share_sheet&knvt=ZDNlZDc0MzIxNw==",
    google_review_url: "https://g.page/r/Cbm5xxD4yuq-EAE/review",
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
    adventures: SEED_ADVENTURES,
    events: SEED_EVENTS,
    event_images: [],
    trek_leaders: [],
    registrations: [],
    volunteer_registrations: [],
    enquiries: [],
    collaboration_enquiries: [],
    website_settings: createDefaultSettings(),
    media_items: [],
  };
}

function normalizeDb(parsed: Partial<LocalDatabase>): LocalDatabase {
  return {
    ...createInitialDb(),
    ...parsed,
    media_items: Array.isArray(parsed.media_items) ? parsed.media_items : [],
    website_settings: {
      ...createDefaultSettings(),
      ...(parsed.website_settings || {}),
    },
  };
}

export function readLocalDb(): LocalDatabase {
  const activePath = getActiveDbPath();
  try {
    if (fs.existsSync(activePath)) {
      const raw = fs.readFileSync(activePath, "utf8");
      const db = normalizeDb(JSON.parse(raw) as Partial<LocalDatabase>);
      globalCache.__kaggaduLocalDb = db;
      return db;
    }

    if (activePath !== SEED_DB_PATH && fs.existsSync(SEED_DB_PATH)) {
      const seedRaw = fs.readFileSync(SEED_DB_PATH, "utf8");
      const db = normalizeDb(JSON.parse(seedRaw) as Partial<LocalDatabase>);
      try {
        fs.writeFileSync(activePath, JSON.stringify(db, null, 2), "utf8");
      } catch {
        // Ignore write error in read path; in-memory cache still holds data.
      }
      globalCache.__kaggaduLocalDb = db;
      return db;
    }

    if (globalCache.__kaggaduLocalDb) {
      return globalCache.__kaggaduLocalDb;
    }

    const initial = createInitialDb();
    try {
      fs.mkdirSync(path.dirname(activePath), { recursive: true });
      fs.writeFileSync(activePath, JSON.stringify(initial, null, 2), "utf8");
    } catch {
      // Ignore write error in read path.
    }
    globalCache.__kaggaduLocalDb = initial;
    return initial;
  } catch {
    return globalCache.__kaggaduLocalDb || createInitialDb();
  }
}

export function writeLocalDb(db: LocalDatabase): void {
  globalCache.__kaggaduLocalDb = db;
  const activePath = getActiveDbPath();
  const dir = path.dirname(activePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${activePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), "utf8");
  fs.renameSync(tmpPath, activePath);
}

export function newUuid(): string {
  return crypto.randomUUID();
}
