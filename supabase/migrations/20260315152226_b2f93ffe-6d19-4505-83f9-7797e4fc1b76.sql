-- Remove public SELECT on waitlist — no self-service reads needed
DROP POLICY IF EXISTS "Anyone can view own waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;

-- Only admins can read waitlist entries
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));