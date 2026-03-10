
-- Drop existing policies on referral_clicks
DROP POLICY IF EXISTS "Anyone can insert referral clicks" ON public.referral_clicks;
DROP POLICY IF EXISTS "Users can view own referral clicks" ON public.referral_clicks;

-- SELECT: user sees only clicks where referral_code belongs to them (via profiles) or location_slug belongs to them (via locations)
CREATE POLICY "Users can view own referral clicks"
ON public.referral_clicks
FOR SELECT
TO authenticated
USING (
  (referral_code IN (SELECT p.referral_code FROM profiles p WHERE p.user_id = auth.uid()))
  OR
  (location_slug IN (SELECT l.slug FROM locations l WHERE l.owner_id = auth.uid()))
);

-- INSERT: anyone (anon + authenticated) can insert clicks for anonymous tracking
CREATE POLICY "Anyone can insert referral clicks"
ON public.referral_clicks
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- No UPDATE or DELETE policies = blocked for all except service role
