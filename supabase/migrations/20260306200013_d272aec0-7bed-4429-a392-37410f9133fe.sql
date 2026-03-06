
-- Inventory items table
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'шт',
  min_stock numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view inventory" ON public.inventory FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.locations WHERE locations.id = inventory.location_id AND locations.owner_id = auth.uid()));

CREATE POLICY "Owners can insert inventory" ON public.inventory FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.locations WHERE locations.id = inventory.location_id AND locations.owner_id = auth.uid()));

CREATE POLICY "Owners can update inventory" ON public.inventory FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.locations WHERE locations.id = inventory.location_id AND locations.owner_id = auth.uid()));

CREATE POLICY "Owners can delete inventory" ON public.inventory FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.locations WHERE locations.id = inventory.location_id AND locations.owner_id = auth.uid()));

-- Inventory operations history
CREATE TABLE public.inventory_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  operation_type text NOT NULL DEFAULT 'write_off',
  quantity numeric NOT NULL,
  note text,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view operations" ON public.inventory_operations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inventory i
    JOIN public.locations l ON l.id = i.location_id
    WHERE i.id = inventory_operations.inventory_id AND l.owner_id = auth.uid()
  ));

CREATE POLICY "Owners can insert operations" ON public.inventory_operations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.inventory i
    JOIN public.locations l ON l.id = i.location_id
    WHERE i.id = inventory_operations.inventory_id AND l.owner_id = auth.uid()
  ));

-- Trigger to update updated_at
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
