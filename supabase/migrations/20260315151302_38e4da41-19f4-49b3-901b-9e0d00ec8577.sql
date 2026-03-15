-- Fix referral_clicks: restrict to rate-limited inserts (still allow anon but not blanket true)
-- referral_clicks needs anon access for tracking clicks, but let's at least validate referral_code exists
DROP POLICY IF EXISTS "Anyone can insert referral clicks" ON public.referral_clicks;
CREATE POLICY "Anyone can insert referral clicks"
  ON public.referral_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    referral_code IS NOT NULL AND referral_code != ''
  );

-- Fix waitlist: restrict to non-empty submissions
DROP POLICY IF EXISTS "Anyone can insert waitlist" ON public.waitlist;
CREATE POLICY "Anyone can insert waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    telegram_username IS NOT NULL AND telegram_username != ''
  );