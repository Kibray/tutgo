-- Drop existing deal storage policies
DROP POLICY IF EXISTS "Anyone can view deal images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload deal images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update deal images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete deal images" ON storage.objects;

-- 1. Storage RLS for 'deals' bucket
CREATE POLICY "Anyone can view deal images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'deals');

CREATE POLICY "Owners can upload deal images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'deals'
    AND EXISTS (
      SELECT 1 FROM public.locations
      WHERE locations.owner_id = auth.uid()
        AND locations.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Owners can update deal images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'deals'
    AND EXISTS (
      SELECT 1 FROM public.locations
      WHERE locations.owner_id = auth.uid()
        AND locations.id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Owners can delete deal images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'deals'
    AND EXISTS (
      SELECT 1 FROM public.locations
      WHERE locations.owner_id = auth.uid()
        AND locations.id::text = (storage.foldername(name))[1]
    )
  );

-- 3. Restrict cafe_order_ratings
DROP POLICY IF EXISTS "Anyone can create ratings" ON public.cafe_order_ratings;
DROP POLICY IF EXISTS "Anyone can view ratings" ON public.cafe_order_ratings;

CREATE POLICY "Authenticated users can create ratings"
  ON public.cafe_order_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.cafe_order_ratings r
      WHERE r.order_id = cafe_order_ratings.order_id
        AND r.item_name = cafe_order_ratings.item_name
    )
    AND EXISTS (
      SELECT 1 FROM public.cafe_orders
      WHERE cafe_orders.id = cafe_order_ratings.order_id
        AND cafe_orders.client_id = auth.uid()
    )
  );

CREATE POLICY "Order owners can view ratings"
  ON public.cafe_order_ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.cafe_orders
      WHERE cafe_orders.id = cafe_order_ratings.order_id
        AND cafe_orders.client_id = auth.uid()
    )
  );