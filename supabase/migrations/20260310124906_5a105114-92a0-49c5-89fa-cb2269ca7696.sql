
-- Drop the old overly-permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view queue tickets" ON public.queue_tickets;

-- Clients can only see their own tickets
CREATE POLICY "Users can view own tickets"
  ON public.queue_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Business owners can see tickets for their locations
CREATE POLICY "Owners can view location tickets"
  ON public.queue_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.locations
      WHERE locations.id = queue_tickets.location_id
        AND locations.owner_id = auth.uid()
    )
  );
