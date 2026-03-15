-- 1. Restrict cafe_orders: remove open SELECT/INSERT
DROP POLICY IF EXISTS "Anyone can view orders by table" ON public.cafe_orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.cafe_orders;

-- Authenticated users can view own orders
CREATE POLICY "Users can view own orders"
  ON public.cafe_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = client_id);

-- Authenticated users can create orders with their own client_id
CREATE POLICY "Authenticated users can create orders"
  ON public.cafe_orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- Owners can view orders for their locations
CREATE POLICY "Owners can view location orders"
  ON public.cafe_orders FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM locations
    WHERE locations.id = cafe_orders.location_id
      AND locations.owner_id = auth.uid()
  ));