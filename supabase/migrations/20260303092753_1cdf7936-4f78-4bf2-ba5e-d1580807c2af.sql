
-- ============================================
-- FIX 1: Change ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- ============================================

-- Drop all restrictive policies on appointments and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can cancel own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owners can view location appointments" ON public.appointments;

CREATE POLICY "Clients can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = client_user_id);

CREATE POLICY "Owners can view location appointments" ON public.appointments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM locations WHERE locations.id = appointments.location_id AND locations.owner_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY "Clients can cancel own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = client_user_id);

CREATE POLICY "Owners can update appointments" ON public.appointments
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM locations WHERE locations.id = appointments.location_id AND locations.owner_id = auth.uid()
  ));

-- Fix locations policies
DROP POLICY IF EXISTS "Anyone can view locations" ON public.locations;
DROP POLICY IF EXISTS "Partners can delete own locations" ON public.locations;
DROP POLICY IF EXISTS "Partners can insert own locations" ON public.locations;
DROP POLICY IF EXISTS "Partners can update own locations" ON public.locations;

CREATE POLICY "Anyone can view locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Partners can insert own locations" ON public.locations FOR INSERT WITH CHECK (auth.uid() = owner_id AND has_role(auth.uid(), 'partner'::app_role));
CREATE POLICY "Partners can update own locations" ON public.locations FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Partners can delete own locations" ON public.locations FOR DELETE USING (auth.uid() = owner_id);

-- Fix categories policies
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- Fix services policies
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Owners can delete services" ON public.services;
DROP POLICY IF EXISTS "Owners can insert services" ON public.services;
DROP POLICY IF EXISTS "Owners can update services" ON public.services;

CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Owners can insert services" ON public.services FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM locations WHERE locations.id = services.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can update services" ON public.services FOR UPDATE USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = services.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can delete services" ON public.services FOR DELETE USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = services.location_id AND locations.owner_id = auth.uid()));

-- Fix staff policies
DROP POLICY IF EXISTS "Anyone can view staff" ON public.staff;
DROP POLICY IF EXISTS "Owners can delete staff" ON public.staff;
DROP POLICY IF EXISTS "Owners can insert staff" ON public.staff;
DROP POLICY IF EXISTS "Owners can update staff" ON public.staff;

CREATE POLICY "Anyone can view staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Owners can insert staff" ON public.staff FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM locations WHERE locations.id = staff.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can update staff" ON public.staff FOR UPDATE USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = staff.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can delete staff" ON public.staff FOR DELETE USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = staff.location_id AND locations.owner_id = auth.uid()));

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FIX 3: Create reviews table
-- ============================================
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users can create own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);

-- Unique constraint: one review per appointment
CREATE UNIQUE INDEX reviews_appointment_unique ON public.reviews (appointment_id);

-- Function to update location rating after review
CREATE OR REPLACE FUNCTION public.update_location_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.locations SET
    rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.reviews WHERE location_id = NEW.location_id),
    review_count = (SELECT COUNT(*) FROM public.reviews WHERE location_id = NEW.location_id)
  WHERE id = NEW.location_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_rating_after_review
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_location_rating();

-- ============================================
-- Enable realtime for appointments and locations
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
