
-- Add queue_enabled to locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS queue_enabled boolean NOT NULL DEFAULT false;

-- Create queue_tickets table
CREATE TABLE public.queue_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  ticket_number integer NOT NULL,
  user_id uuid,
  client_name text,
  status text NOT NULL DEFAULT 'waiting',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  called_at timestamp with time zone,
  completed_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '2 hours'),
  queue_date date NOT NULL DEFAULT CURRENT_DATE
);

-- Enable RLS
ALTER TABLE public.queue_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can view queue for a location (public display)
CREATE POLICY "Anyone can view queue tickets" ON public.queue_tickets
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can take a ticket
CREATE POLICY "Users can take tickets" ON public.queue_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Business owners can update tickets (call next, skip, etc.)
CREATE POLICY "Owners can update queue tickets" ON public.queue_tickets
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.locations WHERE id = queue_tickets.location_id AND owner_id = auth.uid())
    OR auth.uid() = user_id
  );

-- Owners can delete/reset queue
CREATE POLICY "Owners can delete queue tickets" ON public.queue_tickets
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.locations WHERE id = queue_tickets.location_id AND owner_id = auth.uid())
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_tickets;

-- Index for fast queries
CREATE INDEX idx_queue_tickets_location_date ON public.queue_tickets(location_id, queue_date, status);
