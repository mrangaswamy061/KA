-- ==============================================================================
-- KAGGADU ADVENTURES — INITIAL DATABASE SCHEMA (PostgreSQL / Supabase)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper trigger function to maintain updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. PROFILES (Admin & Staff)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'content_manager' CHECK (role IN ('admin', 'content_manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. ADVENTURES (Treks, Trips, Camping, Kids Programs)
CREATE TABLE IF NOT EXISTS public.adventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('trek', 'trip', 'camping', 'kids')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  difficulty TEXT,
  distance TEXT,
  duration TEXT,
  elevation TEXT,
  price NUMERIC(10, 2) CHECK (price IS NULL OR price >= 0),
  age_requirement TEXT,
  highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  itinerary JSONB NOT NULL DEFAULT '[]'::jsonb,
  inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_guidelines TEXT,
  facilities TEXT,
  accommodation_info TEXT,
  travel_arrangements TEXT,
  supervision_info TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adventures_category_published
  ON public.adventures (category, is_published);

CREATE TRIGGER trg_adventures_updated_at
  BEFORE UPDATE ON public.adventures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. EVENTS (Central calendar & booking records)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_id UUID REFERENCES public.adventures(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('trek', 'trip', 'camping', 'kids', 'volunteer', 'special')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  map_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  start_date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  price NUMERIC(10, 2) CHECK (price IS NULL OR price >= 0),
  max_participants INTEGER CHECK (max_participants IS NULL OR max_participants > 0),
  registration_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'fully_booked', 'registration_closed', 'completed', 'cancelled')
  ),
  registration_instructions TEXT,
  cover_image_url TEXT,
  cover_image_alt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_status_start_date
  ON public.events (status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_category
  ON public.events (category);
CREATE INDEX IF NOT EXISTS idx_events_adventure_id
  ON public.events (adventure_id);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. EVENT IMAGES (Gallery metadata)
CREATE TABLE IF NOT EXISTS public.event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  adventure_id UUID REFERENCES public.adventures(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (event_id IS NOT NULL OR adventure_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON public.event_images (event_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_event_images_adventure_id ON public.event_images (adventure_id, sort_order);

-- 5. TREK LEADERS
CREATE TABLE IF NOT EXISTS public.trek_leaders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT NOT NULL DEFAULT '',
  experience TEXT NOT NULL DEFAULT '',
  specialisation TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  avatar_alt TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trek_leaders_published
  ON public.trek_leaders (is_published, sort_order);

CREATE TRIGGER trg_trek_leaders_updated_at
  BEFORE UPDATE ON public.trek_leaders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. REGISTRATIONS (Website event registrations)
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 1 CHECK (participants_count > 0),
  emergency_contact TEXT,
  message TEXT,
  consent_accepted BOOLEAN NOT NULL DEFAULT FALSE CHECK (consent_accepted = TRUE),
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'confirmed', 'cancelled', 'completed')
  ),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations (status);
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON public.registrations (created_at DESC);

CREATE TRIGGER trg_registrations_updated_at
  BEFORE UPDATE ON public.registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. VOLUNTEER REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.volunteer_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code TEXT NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  participants_count INTEGER NOT NULL DEFAULT 1 CHECK (participants_count > 0),
  message TEXT,
  consent_accepted BOOLEAN NOT NULL DEFAULT FALSE CHECK (consent_accepted = TRUE),
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'contacted', 'confirmed', 'cancelled', 'completed')
  ),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_registrations_event_id
  ON public.volunteer_registrations (event_id);

CREATE TRIGGER trg_volunteer_registrations_updated_at
  BEFORE UPDATE ON public.volunteer_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. ENQUIRIES (General contact enquiries)
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'in_progress', 'resolved', 'archived')
  ),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries (status);

CREATE TRIGGER trg_enquiries_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. COLLABORATION ENQUIRIES
CREATE TABLE IF NOT EXISTS public.collaboration_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organisation TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  collaboration_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (
    status IN ('new', 'in_progress', 'resolved', 'archived')
  ),
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collaboration_enquiries_status
  ON public.collaboration_enquiries (status);

CREATE TRIGGER trg_collaboration_enquiries_updated_at
  BEFORE UPDATE ON public.collaboration_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. WEBSITE SETTINGS (Singleton editable configuration)
CREATE TABLE IF NOT EXISTS public.website_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_name TEXT NOT NULL DEFAULT 'Kaggadu Adventures',
  tagline TEXT NOT NULL DEFAULT 'LIVE WITH NATURE',
  supporting_tagline TEXT NOT NULL DEFAULT 'Explore | Experience | Create Memories',
  logo_url TEXT DEFAULT '/images/kaggadu-logo.png',
  contact_email TEXT NOT NULL DEFAULT 'kaggadu.com',
  contact_phone TEXT NOT NULL DEFAULT '7760013106',
  secondary_phone TEXT NOT NULL DEFAULT '8310668859',
  whatsapp_number TEXT NOT NULL DEFAULT 'https://wa.me/message/2RLALIQ3GCUQM1',
  instagram_url TEXT NOT NULL DEFAULT 'https://www.instagram.com/kaggadu_adventures?utm_source=ig_web_button_share_sheet&knvt=ZDNlZDc0MzIxNw==',
  google_review_url TEXT NOT NULL DEFAULT 'https://g.page/r/Cbm5xxD4yuq-EAE/review',
  office_location TEXT NOT NULL DEFAULT 'Western Ghats, Karnataka, India',
  hero_title TEXT NOT NULL DEFAULT 'LIVE WITH NATURE.',
  hero_subtitle TEXT NOT NULL DEFAULT 'Discover the unexplored beauty of the Western Ghats. Trek through mountains, explore hidden waterfalls, experience nature and create memories that last forever.',
  hero_image_url TEXT DEFAULT '/images/hero-western-ghats.jpg',
  intro_heading TEXT NOT NULL DEFAULT 'BEYOND THE ORDINARY.',
  intro_body TEXT NOT NULL DEFAULT 'Kaggadu Adventures brings people closer to nature through meaningful outdoor experiences. From mountain treks and coastal explorations to camping, kids'' adventures and environmental initiatives, every journey creates a connection with the outdoors.',
  intro_image_url TEXT DEFAULT '/images/intro-trail.jpg',
  footer_note TEXT NOT NULL DEFAULT 'Live with Nature | Explore | Experience | Create Memories',
  seo_default_title TEXT NOT NULL DEFAULT 'Kaggadu Adventures | Live With Nature',
  seo_default_description TEXT NOT NULL DEFAULT 'Discover the unexplored beauty of the Western Ghats with Kaggadu Adventures. Curated treks, trips, camping, kids outdoor programs, and conservation volunteer drives.',
  google_analytics_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_website_settings_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default website_settings row if empty
INSERT INTO public.website_settings (site_name)
SELECT 'Kaggadu Adventures'
WHERE NOT EXISTS (SELECT 1 FROM public.website_settings);
