
-- Menu categories
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text DEFAULT '🍽️',
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu categories" ON public.menu_categories FOR SELECT TO public USING (true);
CREATE POLICY "Owners can insert menu categories" ON public.menu_categories FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM locations WHERE locations.id = menu_categories.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can update menu categories" ON public.menu_categories FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = menu_categories.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can delete menu categories" ON public.menu_categories FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = menu_categories.location_id AND locations.owner_id = auth.uid()));

-- Menu items
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'сум',
  photo_url text,
  weight text,
  calories integer,
  cook_time_minutes integer,
  allergens jsonb DEFAULT '[]'::jsonb,
  is_vegetarian boolean DEFAULT false,
  is_spicy boolean DEFAULT false,
  is_available boolean DEFAULT true,
  available_from time,
  available_until time,
  story text,
  recipe_visible boolean DEFAULT false,
  ingredients jsonb DEFAULT '[]'::jsonb,
  chef_note text,
  preparation_steps jsonb DEFAULT '[]'::jsonb,
  origin_country text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT TO public USING (true);
CREATE POLICY "Owners can insert menu items" ON public.menu_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM locations WHERE locations.id = menu_items.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can update menu items" ON public.menu_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = menu_items.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can delete menu items" ON public.menu_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = menu_items.location_id AND locations.owner_id = auth.uid()));

-- Menu modifiers
CREATE TABLE public.menu_modifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_modifiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu modifiers" ON public.menu_modifiers FOR SELECT TO public USING (true);
CREATE POLICY "Owners can manage modifiers" ON public.menu_modifiers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM menu_items mi JOIN locations l ON l.id = mi.location_id WHERE mi.id = menu_modifiers.item_id AND l.owner_id = auth.uid()));

-- Menu combos
CREATE TABLE public.menu_combos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  photo_url text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  original_price integer NOT NULL DEFAULT 0,
  combo_price integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'сум',
  available_from time,
  available_until time,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_combos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active combos" ON public.menu_combos FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Owners can manage combos" ON public.menu_combos FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = menu_combos.location_id AND locations.owner_id = auth.uid()));

-- Table reservations
CREATE TABLE public.table_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES auth.users(id),
  client_name text,
  client_phone text,
  date date NOT NULL,
  time time NOT NULL,
  guests_count integer NOT NULL DEFAULT 2,
  pre_order jsonb DEFAULT '[]'::jsonb,
  total_amount integer DEFAULT 0,
  currency text NOT NULL DEFAULT 'сум',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own reservations" ON public.table_reservations FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Clients can create reservations" ON public.table_reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Owners can view location reservations" ON public.table_reservations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = table_reservations.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Owners can update reservations" ON public.table_reservations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = table_reservations.location_id AND locations.owner_id = auth.uid()));

-- Storage bucket for menu photos
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-photos', 'menu-photos', true);

-- Storage policies
CREATE POLICY "Anyone can view menu photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'menu-photos');
CREATE POLICY "Owners can upload menu photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'menu-photos');
CREATE POLICY "Owners can update menu photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'menu-photos');
CREATE POLICY "Owners can delete menu photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'menu-photos');

-- Telegram notification trigger for reservations
CREATE OR REPLACE FUNCTION public.telegram_notify_new_reservation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ivnczarwkkeyncwrovio.supabase.co/functions/v1/telegram-notify',
    body := jsonb_build_object(
      'type', 'reservation.created',
      'record', jsonb_build_object(
        'id', NEW.id,
        'location_id', NEW.location_id,
        'client_id', NEW.client_id,
        'client_name', NEW.client_name,
        'client_phone', NEW.client_phone,
        'date', NEW.date,
        'time', NEW.time,
        'guests_count', NEW.guests_count,
        'pre_order', NEW.pre_order,
        'total_amount', NEW.total_amount,
        'currency', NEW.currency,
        'notes', NEW.notes
      )
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_reservation_created
  AFTER INSERT ON public.table_reservations
  FOR EACH ROW EXECUTE FUNCTION public.telegram_notify_new_reservation();
