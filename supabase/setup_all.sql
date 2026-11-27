-- ==============================================================================
-- KAGGADU ADVENTURES — COMPLETE IDEMPOTENT SUPABASE SETUP
-- Combines schema (001), RLS & Storage (002), and starter seed data (003).
-- Safe to run once in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ckgjaqnoqmoavpbtecui/sql/new
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

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
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

DROP TRIGGER IF EXISTS trg_adventures_updated_at ON public.adventures;
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

DROP TRIGGER IF EXISTS trg_events_updated_at ON public.events;
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

DROP TRIGGER IF EXISTS trg_trek_leaders_updated_at ON public.trek_leaders;
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

DROP TRIGGER IF EXISTS trg_registrations_updated_at ON public.registrations;
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

DROP TRIGGER IF EXISTS trg_volunteer_registrations_updated_at ON public.volunteer_registrations;
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

DROP TRIGGER IF EXISTS trg_enquiries_updated_at ON public.enquiries;
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

DROP TRIGGER IF EXISTS trg_collaboration_enquiries_updated_at ON public.collaboration_enquiries;
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

DROP TRIGGER IF EXISTS trg_website_settings_updated_at ON public.website_settings;
CREATE TRIGGER trg_website_settings_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.website_settings (site_name)
SELECT 'Kaggadu Adventures'
WHERE NOT EXISTS (SELECT 1 FROM public.website_settings);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) & STORAGE POLICIES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_staff_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'content_manager')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trek_leaders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin_user());

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Public can view published adventures" ON public.adventures;
CREATE POLICY "Public can view published adventures"
  ON public.adventures FOR SELECT
  USING (is_published = TRUE OR public.is_staff_user());

DROP POLICY IF EXISTS "Staff can manage adventures" ON public.adventures;
CREATE POLICY "Staff can manage adventures"
  ON public.adventures FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Public can view published events" ON public.events;
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT
  USING (
    status IN ('published', 'fully_booked', 'registration_closed', 'completed')
    OR public.is_staff_user()
  );

DROP POLICY IF EXISTS "Staff can manage events" ON public.events;
CREATE POLICY "Staff can manage events"
  ON public.events FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Public can view images of published content" ON public.event_images;
CREATE POLICY "Public can view images of published content"
  ON public.event_images FOR SELECT
  USING (
    public.is_staff_user()
    OR EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_images.event_id
        AND e.status IN ('published', 'fully_booked', 'registration_closed', 'completed')
    )
    OR EXISTS (
      SELECT 1 FROM public.adventures a
      WHERE a.id = event_images.adventure_id
        AND a.is_published = TRUE
    )
  );

DROP POLICY IF EXISTS "Staff can manage event images" ON public.event_images;
CREATE POLICY "Staff can manage event images"
  ON public.event_images FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Public can view published trek leaders" ON public.trek_leaders;
CREATE POLICY "Public can view published trek leaders"
  ON public.trek_leaders FOR SELECT
  USING (is_published = TRUE OR public.is_staff_user());

DROP POLICY IF EXISTS "Staff can manage trek leaders" ON public.trek_leaders;
CREATE POLICY "Staff can manage trek leaders"
  ON public.trek_leaders FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Staff can view and manage registrations" ON public.registrations;
CREATE POLICY "Staff can view and manage registrations"
  ON public.registrations FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Staff can view and manage volunteer registrations" ON public.volunteer_registrations;
CREATE POLICY "Staff can view and manage volunteer registrations"
  ON public.volunteer_registrations FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Staff can view and manage enquiries" ON public.enquiries;
CREATE POLICY "Staff can view and manage enquiries"
  ON public.enquiries FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Staff can view and manage collaboration enquiries" ON public.collaboration_enquiries;
CREATE POLICY "Staff can view and manage collaboration enquiries"
  ON public.collaboration_enquiries FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

DROP POLICY IF EXISTS "Public can read website settings" ON public.website_settings;
CREATE POLICY "Public can read website settings"
  ON public.website_settings FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can update website settings" ON public.website_settings;
CREATE POLICY "Admins can update website settings"
  ON public.website_settings FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

INSERT INTO storage.buckets (id, name, public)
VALUES ('kaggadu-media', 'kaggadu-media', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view kaggadu media" ON storage.objects;
CREATE POLICY "Public can view kaggadu media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kaggadu-media');

DROP POLICY IF EXISTS "Staff can upload kaggadu media" ON storage.objects;
CREATE POLICY "Staff can upload kaggadu media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kaggadu-media' AND public.is_staff_user());

DROP POLICY IF EXISTS "Staff can update kaggadu media" ON storage.objects;
CREATE POLICY "Staff can update kaggadu media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'kaggadu-media' AND public.is_staff_user());

DROP POLICY IF EXISTS "Staff can delete kaggadu media" ON storage.objects;
CREATE POLICY "Staff can delete kaggadu media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'kaggadu-media' AND public.is_staff_user());

-- ==============================================================================
-- STARTER SEED DATA
-- ==============================================================================

INSERT INTO public.trek_leaders (
  id,
  full_name,
  slug,
  bio,
  experience,
  specialisation,
  avatar_url,
  avatar_alt,
  is_published,
  sort_order
)
VALUES (
  'b1111111-1111-4111-8111-111111111101',
  'Kaggadu Lead Guide',
  'kaggadu-lead-guide',
  'Certified outdoor trek leaders guiding small-group mountain ridges, waterfall trails, and forest camps across Karnataka since 2020 with a focus on safety, local ecology, and memorable experiences.',
  '6+ years in Western Ghats',
  'Western Ghats Expeditions & Trail Safety',
  '/images/intro-trail.jpg',
  'Kaggadu Adventures trek leader on a misty Western Ghats trail',
  TRUE,
  0
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.adventures (
  id,
  category,
  title,
  slug,
  short_description,
  description,
  location,
  difficulty,
  distance,
  duration,
  elevation,
  price,
  age_requirement,
  highlights,
  itinerary,
  inclusions,
  exclusions,
  safety_guidelines,
  facilities,
  accommodation_info,
  travel_arrangements,
  supervision_info,
  cover_image_url,
  cover_image_alt,
  is_published
)
VALUES
(
  'a1111111-1111-4111-8111-111111111101',
  'trek',
  'Kudremukh Peak Ridge Trek',
  'kudremukh-peak-ridge-trek',
  'Ascend rolling shola grasslands, bamboo forests, and misty mountain ridges in Chikmagalur''s iconic Kudremukh National Park.',
  'Experience one of Karnataka''s most scenic Western Ghats trails. Guided by experienced local trek leaders, this journey traverses stream crossings, shola forest patches, and panoramic emerald ridges rising to 1,894 meters.',
  'Kudremukh, Chikmagalur, Karnataka',
  'Moderate',
  '20 km (Round Trip)',
  '2 Days / 1 Night',
  '1,894 m',
  3499.00,
  '14+ years',
  '["Guided forest permit and check-post entry","Shola grasslands and perennial stream crossings","Authentic Malnad homestay accommodation & meals","First-aid equipped trek leaders"]'::jsonb,
  '[{"day":"Day 0","title":"Overnight Departure","description":"Evening departure toward Kalasa and Mullodi trailhead."},{"day":"Day 1","title":"Kudremukh Peak Ascent","description":"Reach Mullodi base, breakfast, ascend shola ridges to Kudremukh Peak, descend by dusk for campfire dinner."},{"day":"Day 2","title":"Waterfall Visit & Return","description":"Morning waterfall visit, Malnad breakfast, and return journey."}]'::jsonb,
  '["Forest department entry permits","2 breakfasts, 1 packed trail lunch, 1 Malnad dinner","Certified trek leaders & local guide","Shared homestay accommodation"]'::jsonb,
  '["Personal trekking shoes and rainwear","Evening snacks during transit"]'::jsonb,
  'Carry sturdy trekking footwear, at least 2 litres of water, and follow Leave No Trace principles inside the national park.',
  'Homestay washrooms, changing rooms, and basic first-aid kit at base.',
  'Clean shared rooms at a traditional Mullodi homestay.',
  'Pickup options available or self-drive to Kalasa / Mullodi base.',
  NULL,
  '/images/category-treks.jpg',
  'Misty mountain ridges of Kudremukh in the Western Ghats',
  TRUE
),
(
  'a1111111-1111-4111-8111-111111111102',
  'trek',
  'Kodachadri & Hidlumane Falls Trek',
  'kodachadri-hidlumane-falls-trek',
  'Trek past cascading Hidlumane waterfalls and ancient forest shrines to the sunlit summit of Kodachadri.',
  'A rewarding Western Ghats classic combining lush jungle trails, refreshing waterfall dips at Hidlumane, and sweeping sunset views over the Arabian Sea horizon from Kodachadri peak.',
  'Shimoga, Karnataka',
  'Moderate',
  '14 km',
  '2 Days / 1 Night',
  '1,343 m',
  3299.00,
  '12+ years',
  '["Hidlumane Falls forest trail","Sarvajna Peetha summit views","4x4 jeep descent option","Nagara Fort heritage stop"]'::jsonb,
  '[{"day":"Day 1","title":"Hidlumane Falls & Summit","description":"Base arrival, trail ascent via Hidlumane Falls, and summit sunset."},{"day":"Day 2","title":"Nagara Fort & Return","description":"Morning ridge views, Nagara Fort heritage visit, and return."}]'::jsonb,
  '["Guided trek & jeep transfer","Homestay stay & traditional meals","First-aid support"]'::jsonb,
  '["Personal gear & beverages"]'::jsonb,
  'Leech socks recommended during post-monsoon months. Stay with the lead and sweep guides.',
  'Homestay stay and dining hall at base village.',
  'Shared village homestay.',
  'Group transport or base-point meetup.',
  NULL,
  '/images/intro-trail.jpg',
  'Trekkers walking through misty Kodachadri forest trail',
  TRUE
),
(
  'a1111111-1111-4111-8111-111111111103',
  'trip',
  'Gokarna Coastal Cliff & Beach Trail',
  'gokarna-coastal-cliff-beach-trail',
  'Explore Gokarna''s hidden coves, rocky coastal headlands, and palm-fringed beaches on a curated weekend escape.',
  'Walk from Belekan through Paradise Beach, Half Moon Beach, Om Beach, and Kudle Beach along dramatic sea cliffs, paired with coastal cuisine and sunset reflections.',
  'Gokarna, Uttara Kannada, Karnataka',
  'Easy to Moderate',
  '9 km coastal walk',
  '2 Days / 1 Night',
  'Sea Level',
  3999.00,
  '10+ years',
  '["Five-beach cliff-top coastal trek","Mirjan Fort & Honnavar backwater stop","Sunset at Kudle Beach","Beachside stay & local seafood/veg meals"]'::jsonb,
  '[{"day":"Day 1","title":"Five-Beach Coastal Trail","description":"Cliff-top coastal walk from Belekan to Kudle Beach with sunset views."},{"day":"Day 2","title":"Mirjan Fort & Return","description":"Morning coastal breakfast, Mirjan Fort exploration, and return."}]'::jsonb,
  '["Guided coastal walk","1 night stay & 3 meals","Ferry / local transfers"]'::jsonb,
  '["Water sports charges","Personal expenses"]'::jsonb,
  'Carry sun protection, light cotton wear, and avoid swimming in deep surf zones.',
  'Beachside cottages with clean restrooms.',
  'Twin/triple sharing coastal cottages.',
  'Group transit or Gokarna meetup.',
  NULL,
  '/images/category-trips.jpg',
  'Coastal cliffs and turquoise waves along Gokarna shoreline',
  TRUE
),
(
  'a1111111-1111-4111-8111-111111111104',
  'camping',
  'Sakleshpur Forest Ridge & Stargazing Camp',
  'sakleshpur-forest-ridge-stargazing-camp',
  'Unplug in coffee-estate wilderness with cosy canvas tents, warm campfires, guided night walks, and crisp mountain sunrises.',
  'Set in a quiet private clearing bordering the Sakleshpur hills, our weekend camp brings you slow mornings, nature trails, acoustic campfire evenings, and stargazing away from city lights.',
  'Sakleshpur, Hassan, Karnataka',
  'Easy',
  '4 km nature walk',
  '2 Days / 1 Night',
  '950 m',
  2499.00,
  'All ages',
  '["Weatherproof pitched tents with sleeping gear","Campfire stories & acoustic evening","Guided morning birding & stream walk","Home-cooked Malnad dinner & breakfast"]'::jsonb,
  '[{"day":"Day 1","title":"Campsite & Stargazing","description":"Check-in, sunset ridge walk, campfire dinner, and stargazing."},{"day":"Day 2","title":"Sunrise Trail & Checkout","description":"Morning coffee walk, forest stream trail, breakfast, and checkout."}]'::jsonb,
  '["Tent stay with sleeping mats & blankets","Evening tea/snacks, dinner, and breakfast","Guided nature walk"]'::jsonb,
  '["Personal travel to campsite"]'::jsonb,
  'Do not litter or carry single-use plastics. Follow campsite quiet hours after 10:30 PM.',
  'Dedicated permanent washrooms, solar lighting, and secure parking.',
  '2-person and 3-person alpine tents.',
  'Easy road access for cars and group vans.',
  NULL,
  '/images/category-camping.jpg',
  'Warm glowing tents under twilight forest trees in Sakleshpur',
  TRUE
),
(
  'a1111111-1111-4111-8111-111111111105',
  'kids',
  'Young Naturalists Stream & Forest Discovery',
  'young-naturalists-stream-forest-discovery',
  'Hands-on outdoor learning for kids featuring stream ecology, knot tying, map reading, and safe guided trail exploration.',
  'Specially curated for young explorers aged 7 to 14, this day-and-overnight nature program blends fun wilderness skills with curiosity about insects, birds, native trees, and teamwork.',
  'Western Ghats Eco-Base, Karnataka',
  'Beginner Friendly',
  '3 km guided nature trail',
  '1 Day / Optional Overnight',
  '780 m',
  1799.00,
  '7–14 years (parents welcome)',
  '["Shallow stream biodiversity exploration","Basic compass navigation & tent-pitching workshop","Nature journaling & leaf-craft session","High adult-to-child safety ratio"]'::jsonb,
  '[{"day":"Morning","title":"Forest Sensory Walk","description":"Icebreakers, guided forest sensory walk, and shallow stream discovery."},{"day":"Afternoon","title":"Wilderness Skills & Wrap-Up","description":"Nutritious lunch, knot-tying & compass games, campfire snacks, and wrap-up."}]'::jsonb,
  '["Activity kit & nature journal","Nutritious snacks & lunch","Trained outdoor educators & first-aid"]'::jsonb,
  '["Personal water bottle & extra change of clothes"]'::jsonb,
  'Strict 1:6 instructor-to-child ratio, life-vests near water edges, and zero-plastic policy.',
  'Child-safe eco-campus with enclosed restrooms and shaded activity pavilion.',
  'Day program or family-friendly eco-cottages.',
  'Direct parent drop-off or supervised group shuttle.',
  'Led by certified outdoor youth mentors and female chaperones.',
  '/images/category-kids.jpg',
  'Children exploring a gentle forest stream with an outdoor mentor',
  TRUE
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.events (
  id,
  adventure_id,
  category,
  title,
  slug,
  short_description,
  description,
  location,
  map_url,
  latitude,
  longitude,
  start_date,
  end_date,
  start_time,
  end_time,
  price,
  max_participants,
  registration_deadline,
  status,
  registration_instructions,
  cover_image_url,
  cover_image_alt
)
VALUES
(
  'e1111111-1111-4111-8111-111111111101',
  (SELECT id FROM public.adventures WHERE slug = 'kudremukh-peak-ridge-trek' LIMIT 1),
  'trek',
  'Kudremukh Peak Winter Batch',
  'kudremukh-peak-winter-batch-2026-12-05',
  'Join our guided winter ridge trek to Kudremukh Peak with crisp mountain views and Malnad hospitality.',
  'Departure batch for Kudremukh Peak Trek. Includes forest entry permits, Mullodi homestay, local meals, and experienced Kaggadu trek leaders.',
  'Kudremukh, Chikmagalur, Karnataka',
  'https://maps.google.com/?q=Kudremukh+National+Park',
  13.225,
  75.252,
  '2026-12-05',
  '2026-12-06',
  '06:00:00',
  '18:00:00',
  3499.00,
  20,
  '2026-12-03T23:59:59+05:30',
  'published',
  'Carry valid government photo ID for forest permit verification.',
  '/images/category-treks.jpg',
  'Kudremukh mountain trail'
),
(
  'e1111111-1111-4111-8111-111111111102',
  (SELECT id FROM public.adventures WHERE slug = 'sakleshpur-forest-ridge-stargazing-camp' LIMIT 1),
  'camping',
  'Sakleshpur Stargazing & Forest Camp',
  'sakleshpur-stargazing-camp-2026-12-12',
  'Overnight wilderness tent camp in Sakleshpur with campfire dinner, sunrise ridge walk, and clear winter skies.',
  'Weekend forest camp perfect for solo travellers, friends, and families looking to slow down and reconnect with nature.',
  'Sakleshpur, Hassan, Karnataka',
  'https://maps.google.com/?q=Sakleshpur+Karnataka',
  12.944,
  75.786,
  '2026-12-12',
  '2026-12-13',
  '15:00:00',
  '11:00:00',
  2499.00,
  25,
  '2026-12-10T23:59:59+05:30',
  'published',
  'Carry warm fleece/jacket for chilly evening temperatures.',
  '/images/category-camping.jpg',
  'Evening forest campsite'
),
(
  'e1111111-1111-4111-8111-111111111103',
  (SELECT id FROM public.adventures WHERE slug = 'gokarna-coastal-cliff-beach-trail' LIMIT 1),
  'trip',
  'Gokarna Five-Beach Coastal Trail',
  'gokarna-coastal-trail-2026-12-19',
  'Walk scenic coastal cliffs connecting Gokarna''s quiet coves, watch the sunset, and explore historic Mirjan Fort.',
  'Guided weekend coastal getaway covering Gokarna''s classic headland trail and heritage stops.',
  'Gokarna, Uttara Kannada, Karnataka',
  'https://maps.google.com/?q=Gokarna+Karnataka',
  14.547,
  74.318,
  '2026-12-19',
  '2026-12-20',
  '07:00:00',
  '17:00:00',
  3999.00,
  18,
  '2026-12-17T23:59:59+05:30',
  'published',
  'Carry sunscreen, cap, and light walking sandals or trail shoes.',
  '/images/category-trips.jpg',
  'Gokarna coastal cliff trail'
),
(
  'e1111111-1111-4111-8111-111111111104',
  (SELECT id FROM public.adventures WHERE slug = 'young-naturalists-stream-forest-discovery' LIMIT 1),
  'kids',
  'Kids Winter Nature & Stream Camp',
  'kids-winter-nature-camp-2026-12-26',
  'Holiday outdoor discovery session for children aged 7–14 featuring stream ecology, tent skills, and nature games.',
  'A fun, screen-free winter nature camp designed to spark curiosity and confidence outdoors under trained mentorship.',
  'Western Ghats Eco-Base, Karnataka',
  NULL,
  NULL,
  NULL,
  '2026-12-26',
  '2026-12-26',
  '08:30:00',
  '16:30:00',
  1799.00,
  20,
  '2026-12-24T23:59:59+05:30',
  'published',
  'Parents should mention any food allergies in the registration notes.',
  '/images/category-kids.jpg',
  'Kids exploring forest stream'
),
(
  'e1111111-1111-4111-8111-111111111105',
  NULL,
  'volunteer',
  'Western Ghats Trail Cleanup & Sapling Drive',
  'western-ghats-trail-cleanup-2026-12-27',
  'Community conservation drive focused on plastic cleanup along trek trails and planting native saplings.',
  'Join fellow nature lovers and Kaggadu trek leaders for a morning of trail restoration, waste segregation, and native sapling care.',
  'Charmadi Ghat Trailhead, Karnataka',
  'https://maps.google.com/?q=Charmadi+Ghat+Karnataka',
  13.079,
  75.448,
  '2026-12-27',
  '2026-12-27',
  '07:00:00',
  '13:00:00',
  0.00,
  35,
  '2026-12-25T23:59:59+05:30',
  'published',
  'Reusable gloves and collection sacks will be provided at the trailhead.',
  '/images/volunteer-cleanup.jpg',
  'Volunteers restoring Western Ghats forest trail'
)
ON CONFLICT (slug) DO NOTHING;
