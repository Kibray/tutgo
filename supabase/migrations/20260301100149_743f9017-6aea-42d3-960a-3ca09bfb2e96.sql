
-- 1. Categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '📍',
  sort_order int DEFAULT 0,
  subcategories jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

-- 2. Add category_id to locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);

-- 3. Staff table
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  photo_url text,
  specialties text[] DEFAULT '{}',
  working_days int[] DEFAULT '{1,2,3,4,5}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view staff" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Owners can insert staff" ON public.staff FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.locations WHERE id = location_id AND owner_id = auth.uid()));
CREATE POLICY "Owners can update staff" ON public.staff FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.locations WHERE id = location_id AND owner_id = auth.uid()));
CREATE POLICY "Owners can delete staff" ON public.staff FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.locations WHERE id = location_id AND owner_id = auth.uid()));

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'сум',
  duration_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Owners can insert services" ON public.services FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.locations WHERE id = location_id AND owner_id = auth.uid()));
CREATE POLICY "Owners can update services" ON public.services FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.locations WHERE id = location_id AND owner_id = auth.uid()));
CREATE POLICY "Owners can delete services" ON public.services FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.locations WHERE id = location_id AND owner_id = auth.uid()));

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  client_user_id uuid,
  client_phone text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Clients see own appointments, owners see appointments for their locations
CREATE POLICY "Clients can view own appointments" ON public.appointments FOR SELECT
  USING (auth.uid() = client_user_id);
CREATE POLICY "Owners can view location appointments" ON public.appointments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.locations WHERE id = location_id AND owner_id = auth.uid()));
CREATE POLICY "Authenticated users can create appointments" ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = client_user_id);
CREATE POLICY "Owners can update appointments" ON public.appointments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.locations WHERE id = location_id AND owner_id = auth.uid()));
CREATE POLICY "Clients can cancel own appointments" ON public.appointments FOR UPDATE
  USING (auth.uid() = client_user_id);

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Double-booking prevention function
CREATE OR REPLACE FUNCTION public.check_no_double_booking()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.staff_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.appointments
    WHERE staff_id = NEW.staff_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status NOT IN ('cancelled')
      AND tstzrange(start_time, end_time, '[)') && tstzrange(NEW.start_time, NEW.end_time, '[)')
  ) THEN
    RAISE EXCEPTION 'Double booking: staff member already has an appointment during this time';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_double_booking
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.check_no_double_booking();

-- 7. Seed categories
INSERT INTO public.categories (name, icon, sort_order, subcategories) VALUES
  ('Медицина', '🏥', 1, '[{"id":"dental","name":"Стоматология","icon":"🦷"},{"id":"lab","name":"Анализы","icon":"🧪"},{"id":"clinic","name":"Клиники","icon":"🏥"},{"id":"pharmacy","name":"Аптеки 24/7","icon":"💊"}]'),
  ('Красота', '✨', 2, '[{"id":"barbershop","name":"Барбершопы","icon":"💈"},{"id":"salon","name":"Салоны красоты","icon":"💅"},{"id":"nails","name":"Маникюр","icon":"💅"},{"id":"spa","name":"SPA","icon":"🧖"}]'),
  ('Туры', '🏔️', 3, '[{"id":"mountains","name":"Горы"},{"id":"cities","name":"Города"},{"id":"extreme","name":"Экстрим"},{"id":"resorts","name":"Зоны отдыха"}]'),
  ('Кофейни', '☕️', 4, '[{"id":"coffee","name":"Кофе"},{"id":"restaurant","name":"Рестораны"},{"id":"fastfood","name":"Фастфуд"}]'),
  ('Магазины', '🛍️', 5, '[{"id":"clothes","name":"Одежда"},{"id":"electronics","name":"Электроника"},{"id":"grocery","name":"Продукты"}]'),
  ('Услуги', '🛠️', 6, '[{"id":"repair","name":"Ремонт"},{"id":"cleaning","name":"Уборка"},{"id":"delivery","name":"Доставка"}]');
