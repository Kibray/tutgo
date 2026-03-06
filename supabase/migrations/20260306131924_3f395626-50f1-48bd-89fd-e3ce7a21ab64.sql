CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  discount_percent integer NOT NULL DEFAULT 0,
  image_url text,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active deals" ON public.deals FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can insert deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.locations WHERE id = deals.location_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can update deals" ON public.deals FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.locations WHERE id = deals.location_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can delete deals" ON public.deals FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.locations WHERE id = deals.location_id AND owner_id = auth.uid())
);

-- Storage bucket for deal images
INSERT INTO storage.buckets (id, name, public) VALUES ('deals', 'deals', true);

CREATE POLICY "Anyone can view deal images" ON storage.objects FOR SELECT USING (bucket_id = 'deals');
CREATE POLICY "Authenticated users can upload deal images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deals');
CREATE POLICY "Authenticated users can update deal images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'deals');
CREATE POLICY "Authenticated users can delete deal images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'deals');