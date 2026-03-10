
-- Cafe tables
CREATE TABLE public.cafe_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  table_number integer NOT NULL,
  qr_code text,
  capacity integer DEFAULT 4,
  is_active boolean DEFAULT true,
  status text DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(location_id, table_number)
);
ALTER TABLE public.cafe_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tables" ON public.cafe_tables FOR SELECT TO public USING (true);
CREATE POLICY "Owners can manage tables" ON public.cafe_tables FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = cafe_tables.location_id AND locations.owner_id = auth.uid()));

-- Cafe orders
CREATE TABLE public.cafe_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  table_id uuid REFERENCES public.cafe_tables(id) ON DELETE SET NULL,
  table_number integer,
  client_id uuid,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount integer DEFAULT 0,
  discount integer DEFAULT 0,
  final_amount integer DEFAULT 0,
  currency text DEFAULT 'сум',
  payment_method text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  served_at timestamptz,
  paid_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cafe_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view orders by table" ON public.cafe_orders FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can create orders" ON public.cafe_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owners can update orders" ON public.cafe_orders FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM locations WHERE locations.id = cafe_orders.location_id AND locations.owner_id = auth.uid()));
CREATE POLICY "Clients can update own orders" ON public.cafe_orders FOR UPDATE TO authenticated USING (auth.uid() = client_id);

-- Cafe order ratings
CREATE TABLE public.cafe_order_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.cafe_orders(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  item_name text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cafe_order_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings" ON public.cafe_order_ratings FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can create ratings" ON public.cafe_order_ratings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Owners can view ratings" ON public.cafe_order_ratings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM cafe_orders co JOIN locations l ON l.id = co.location_id WHERE co.id = cafe_order_ratings.order_id AND l.owner_id = auth.uid()));

-- Add is_default to menu_modifiers options (no schema change needed - it's JSONB)

-- Trigger for order notifications
CREATE OR REPLACE FUNCTION public.telegram_notify_new_cafe_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ivnczarwkkeyncwrovio.supabase.co/functions/v1/telegram-notify',
    body := jsonb_build_object(
      'type', 'cafe_order.created',
      'record', jsonb_build_object(
        'id', NEW.id,
        'location_id', NEW.location_id,
        'table_number', NEW.table_number,
        'items', NEW.items,
        'total_amount', NEW.total_amount,
        'final_amount', NEW.final_amount,
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

CREATE TRIGGER on_cafe_order_created
  AFTER INSERT ON public.cafe_orders
  FOR EACH ROW EXECUTE FUNCTION public.telegram_notify_new_cafe_order();

-- Enable realtime for cafe_orders and cafe_tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cafe_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cafe_tables;
