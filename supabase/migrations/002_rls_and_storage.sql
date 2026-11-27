-- ==============================================================================
-- KAGGADU ADVENTURES — ROW LEVEL SECURITY (RLS) & STORAGE POLICIES
-- ==============================================================================

-- Helper function: checks if current authenticated user is an admin or content_manager
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

-- Enable RLS on all tables
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

-- Explicit schema & table privileges for Supabase API roles (governed by RLS above)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT ON
  public.adventures,
  public.events,
  public.event_images,
  public.trek_leaders,
  public.website_settings
TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_user(), public.is_admin_user() TO anon;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin_user());

CREATE POLICY "Admins can manage profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ADVENTURES
CREATE POLICY "Public can view published adventures"
  ON public.adventures FOR SELECT
  USING (is_published = TRUE OR public.is_staff_user());

CREATE POLICY "Staff can manage adventures"
  ON public.adventures FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- EVENTS
CREATE POLICY "Public can view published events"
  ON public.events FOR SELECT
  USING (
    status IN ('published', 'fully_booked', 'registration_closed', 'completed')
    OR public.is_staff_user()
  );

CREATE POLICY "Staff can manage events"
  ON public.events FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- EVENT IMAGES
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

CREATE POLICY "Staff can manage event images"
  ON public.event_images FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- TREK LEADERS
CREATE POLICY "Public can view published trek leaders"
  ON public.trek_leaders FOR SELECT
  USING (is_published = TRUE OR public.is_staff_user());

CREATE POLICY "Staff can manage trek leaders"
  ON public.trek_leaders FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- REGISTRATIONS (Sensitive participant data: staff read/update only; public inserts via validated server API)
CREATE POLICY "Staff can view and manage registrations"
  ON public.registrations FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- VOLUNTEER REGISTRATIONS
CREATE POLICY "Staff can view and manage volunteer registrations"
  ON public.volunteer_registrations FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- ENQUIRIES
CREATE POLICY "Staff can view and manage enquiries"
  ON public.enquiries FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- COLLABORATION ENQUIRIES
CREATE POLICY "Staff can view and manage collaboration enquiries"
  ON public.collaboration_enquiries FOR ALL
  USING (public.is_staff_user())
  WITH CHECK (public.is_staff_user());

-- WEBSITE SETTINGS
CREATE POLICY "Public can read website settings"
  ON public.website_settings FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can update website settings"
  ON public.website_settings FOR ALL
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- ==============================================================================
-- SUPABASE STORAGE BUCKET: kaggadu-media
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('kaggadu-media', 'kaggadu-media', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view kaggadu media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'kaggadu-media');

CREATE POLICY "Staff can upload kaggadu media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kaggadu-media' AND public.is_staff_user());

CREATE POLICY "Staff can update kaggadu media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'kaggadu-media' AND public.is_staff_user());

CREATE POLICY "Staff can delete kaggadu media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'kaggadu-media' AND public.is_staff_user());
