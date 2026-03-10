
-- Security definer function to get public queue stats without exposing individual tickets
CREATE OR REPLACE FUNCTION public.get_queue_stats(p_location_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'waiting_count', (SELECT count(*) FROM queue_tickets WHERE location_id = p_location_id AND queue_date = p_date AND status = 'waiting'),
    'current_serving', (SELECT ticket_number FROM queue_tickets WHERE location_id = p_location_id AND queue_date = p_date AND status = 'serving' ORDER BY called_at DESC LIMIT 1),
    'last_ticket', (SELECT coalesce(max(ticket_number), 0) FROM queue_tickets WHERE location_id = p_location_id AND queue_date = p_date)
  )
$$;
