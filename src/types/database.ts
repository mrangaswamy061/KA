export type UserRole = "admin" | "content_manager";

export type AdventureCategory = "trek" | "trip" | "camping" | "kids";

export type EventCategory =
  | "trek"
  | "trip"
  | "camping"
  | "kids"
  | "volunteer"
  | "special";

export type EventStatus =
  | "draft"
  | "published"
  | "fully_booked"
  | "registration_closed"
  | "completed"
  | "cancelled";

export type RegistrationStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "cancelled"
  | "completed";

export type EnquiryStatus = "new" | "in_progress" | "resolved" | "archived";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDay {
  day: string;
  title: string;
  description: string;
}

export interface Adventure {
  id: string;
  category: AdventureCategory;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  location: string;
  difficulty: string | null;
  distance: string | null;
  duration: string | null;
  elevation: string | null;
  price: number | null;
  age_requirement: string | null;
  highlights: string[];
  itinerary: ItineraryDay[];
  inclusions: string[];
  exclusions: string[];
  safety_guidelines: string | null;
  facilities: string | null;
  accommodation_info: string | null;
  travel_arrangements: string | null;
  supervision_info: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRecord {
  id: string;
  adventure_id: string | null;
  category: EventCategory;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  location: string;
  map_url: string | null;
  latitude: number | null;
  longitude: number | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  price: number | null;
  max_participants: number | null;
  registration_deadline: string | null;
  status: EventStatus;
  registration_instructions: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  created_at: string;
  updated_at: string;
  registered_count?: number;
}

export interface EventImage {
  id: string;
  event_id: string | null;
  adventure_id: string | null;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface TrekLeader {
  id: string;
  full_name: string;
  slug: string;
  bio: string;
  experience: string;
  specialisation: string;
  avatar_url: string | null;
  avatar_alt: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  reference_code: string;
  event_id: string;
  full_name: string;
  mobile: string;
  email: string;
  participants_count: number;
  emergency_contact: string | null;
  message: string | null;
  consent_accepted: boolean;
  status: RegistrationStatus;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  event?: Pick<EventRecord, "id" | "title" | "slug" | "start_date" | "category">;
}

export interface VolunteerRegistration {
  id: string;
  reference_code: string;
  event_id: string;
  full_name: string;
  mobile: string;
  email: string;
  participants_count: number;
  message: string | null;
  consent_accepted: boolean;
  status: RegistrationStatus;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  event?: Pick<EventRecord, "id" | "title" | "slug" | "start_date">;
}

export interface Enquiry {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  subject: string | null;
  message: string;
  status: EnquiryStatus;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollaborationEnquiry {
  id: string;
  name: string;
  organisation: string;
  email: string;
  mobile: string;
  collaboration_type: string;
  message: string;
  status: EnquiryStatus;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteSettings {
  id: string;
  site_name: string;
  tagline: string;
  supporting_tagline: string;
  logo_url: string | null;
  contact_email: string;
  contact_phone: string;
  secondary_phone: string;
  whatsapp_number: string;
  instagram_url: string;
  google_review_url: string;
  office_location: string;
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  intro_heading: string;
  intro_body: string;
  intro_image_url: string | null;
  footer_note: string;
  seo_default_title: string;
  seo_default_description: string;
  google_analytics_id: string | null;
  updated_at: string;
}
