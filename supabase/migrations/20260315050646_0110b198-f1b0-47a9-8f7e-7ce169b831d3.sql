
-- stays table
CREATE TABLE public.stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text DEFAULT 'hotel',
  photos text[] DEFAULT '{}',
  city text DEFAULT 'Ташкент',
  address text,
  lat double precision,
  lng double precision,
  price_per_night integer DEFAULT 0,
  min_nights integer DEFAULT 1,
  max_guests integer DEFAULT 2,
  amenities text[] DEFAULT '{}',
  rating double precision DEFAULT 0,
  reviews_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- stay_rooms table
CREATE TABLE public.stay_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id uuid REFERENCES public.stays(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  price_per_night integer DEFAULT 0,
  max_guests integer DEFAULT 2,
  bed_type text,
  area_sqm integer,
  amenities text[] DEFAULT '{}',
  photos text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- stay_bookings table
CREATE TABLE public.stay_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stay_id uuid REFERENCES public.stays(id) ON DELETE CASCADE NOT NULL,
  room_id uuid REFERENCES public.stay_rooms(id),
  user_id uuid NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  nights integer DEFAULT 1,
  guests integer DEFAULT 1,
  total_price integer DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for stays
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active stays" ON public.stays FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage stays" ON public.stays FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = stays.location_id AND locations.owner_id = auth.uid()));

-- RLS for stay_rooms
ALTER TABLE public.stay_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view available rooms" ON public.stay_rooms FOR SELECT USING (true);
CREATE POLICY "Owners can manage rooms" ON public.stay_rooms FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM stays s JOIN locations l ON l.id = s.location_id WHERE s.id = stay_rooms.stay_id AND l.owner_id = auth.uid()));

-- RLS for stay_bookings
ALTER TABLE public.stay_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON public.stay_bookings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON public.stay_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.stay_bookings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners can view stay bookings" ON public.stay_bookings FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM stays s JOIN locations l ON l.id = s.location_id WHERE s.id = stay_bookings.stay_id AND l.owner_id = auth.uid()));
CREATE POLICY "Owners can update stay bookings" ON public.stay_bookings FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM stays s JOIN locations l ON l.id = s.location_id WHERE s.id = stay_bookings.stay_id AND l.owner_id = auth.uid()));

-- Seed test data
INSERT INTO public.stays (name, description, category, city, photos, price_per_night, max_guests, amenities, rating, reviews_count) VALUES
('Wyndham Tashkent', 'Премиальный отель в центре Ташкента с видом на город', 'hotel', 'Ташкент', ARRAY['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'], 450000, 4, ARRAY['Бассейн','СПА','Ресторан','Парковка','Wi-Fi','Фитнес'], 4.9, 156),
('Санаторий Чимган', 'Горный санаторий с лечебными процедурами и чистым воздухом', 'sanatorium', 'Чимган', ARRAY['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'], 280000, 3, ARRAY['Лечение','Бассейн','3 питания','Горный воздух'], 4.7, 89),
('Дача у Чарвака', 'Просторная дача с бассейном у озера Чарвак', 'dacha', 'Чарвак', ARRAY['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'], 800000, 12, ARRAY['Бассейн','Мангал','Сад','Парковка'], 4.8, 67),
('Aqua Park Resort Charvak', 'Курорт с аквапарком и пляжем на берегу Чарвака', 'resort', 'Чарвак', ARRAY['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'], 350000, 6, ARRAY['Аквапарк','Пляж','Анимация','Ресторан'], 4.6, 203),
('Glamping Ugam', 'Глэмпинг в горах Угам-Чаткальского заповедника', 'glamping', 'Угам-Чаткал', ARRAY['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'], 600000, 4, ARRAY['Горы','Костёр','Лес','Звёздное небо'], 4.9, 42);

-- Seed rooms for first stay (Wyndham)
INSERT INTO public.stay_rooms (stay_id, name, description, price_per_night, max_guests, bed_type, area_sqm, amenities) VALUES
((SELECT id FROM stays WHERE name = 'Wyndham Tashkent'), 'Стандарт', 'Уютный номер с видом на город', 450000, 2, 'Двуспальная', 28, ARRAY['Wi-Fi','Кондиционер','Мини-бар','Сейф']),
((SELECT id FROM stays WHERE name = 'Wyndham Tashkent'), 'Делюкс', 'Просторный номер с балконом', 650000, 2, 'King-size', 42, ARRAY['Wi-Fi','Кондиционер','Мини-бар','Сейф','Балкон','Халат']),
((SELECT id FROM stays WHERE name = 'Wyndham Tashkent'), 'Люкс', 'Роскошный люкс с гостиной', 1200000, 4, 'King-size', 65, ARRAY['Wi-Fi','Кондиционер','Мини-бар','Сейф','Гостиная','Джакузи']);
