
-- Drop the overly permissive public SELECT policy
DROP POLICY "Anyone can view tables" ON public.cafe_tables;

-- Replace with authenticated-only SELECT policy
CREATE POLICY "Authenticated users can view tables"
  ON public.cafe_tables
  FOR SELECT
  TO authenticated
  USING (true);
