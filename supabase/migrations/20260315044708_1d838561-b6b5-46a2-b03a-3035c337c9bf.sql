
-- Transport routes table
CREATE TABLE public.transport_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  from_city text NOT NULL,
  to_city text NOT NULL,
  transport_type text DEFAULT 'bus',
  transport_name text,
  departure_time time,
  arrival_time time,
  duration_minutes int,
  price_per_seat int DEFAULT 0,
  total_seats int DEFAULT 45,
  available_seats int DEFAULT 45,
  amenities text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active routes" ON public.transport_routes
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Owners can manage routes" ON public.transport_routes
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM locations WHERE locations.id = transport_routes.location_id AND locations.owner_id = auth.uid())
  );

-- Transport bookings table
CREATE TABLE public.transport_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid REFERENCES public.transport_routes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  travel_date date NOT NULL,
  seats int DEFAULT 1,
  total_price int DEFAULT 0,
  status text DEFAULT 'pending',
  passenger_name text,
  passenger_phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transport bookings" ON public.transport_bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create transport bookings" ON public.transport_bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transport bookings" ON public.transport_bookings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Owners can view route bookings" ON public.transport_bookings
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM transport_routes tr JOIN locations l ON l.id = tr.location_id WHERE tr.id = transport_bookings.route_id AND l.owner_id = auth.uid())
  );

CREATE POLICY "Owners can update route bookings" ON public.transport_bookings
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM transport_routes tr JOIN locations l ON l.id = tr.location_id WHERE tr.id = transport_bookings.route_id AND l.owner_id = auth.uid())
  );

-- Driver trips table
CREATE TABLE public.driver_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL,
  from_city text NOT NULL,
  to_city text NOT NULL,
  departure_datetime timestamptz,
  price int DEFAULT 0,
  available_seats int DEFAULT 3,
  car_model text,
  car_color text,
  amenities text[] DEFAULT '{}',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active driver trips" ON public.driver_trips
  FOR SELECT TO public USING (status = 'active');

CREATE POLICY "Drivers can manage own trips" ON public.driver_trips
  FOR ALL TO authenticated USING (auth.uid() = driver_id);
