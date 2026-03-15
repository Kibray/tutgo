
-- Tours table
CREATE TABLE public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  photos text[] DEFAULT '{}',
  duration_days int DEFAULT 1,
  price_per_person int DEFAULT 0,
  price_child int DEFAULT 0,
  max_people int DEFAULT 12,
  min_people int DEFAULT 1,
  departure_city text DEFAULT 'Ташкент',
  destinations text[] DEFAULT '{}',
  category text DEFAULT 'history',
  includes text[] DEFAULT '{}',
  excludes text[] DEFAULT '{}',
  program jsonb DEFAULT '[]',
  highlights jsonb DEFAULT '[]',
  available_dates date[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  rating float DEFAULT 0,
  reviews_count int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tours" ON public.tours
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owners can manage tours" ON public.tours
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.locations WHERE locations.id = tours.location_id AND locations.owner_id = auth.uid()
  ));

-- Tour bookings table
CREATE TABLE public.tour_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id uuid REFERENCES public.tours(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  adults int DEFAULT 1,
  children int DEFAULT 0,
  selected_date date NOT NULL,
  total_price int DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.tour_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON public.tour_bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.tour_bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.tour_bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners can view tour bookings" ON public.tour_bookings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tours t
    JOIN public.locations l ON l.id = t.location_id
    WHERE t.id = tour_bookings.tour_id AND l.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can update tour bookings" ON public.tour_bookings
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.tours t
    JOIN public.locations l ON l.id = t.location_id
    WHERE t.id = tour_bookings.tour_id AND l.owner_id = auth.uid()
  ));
