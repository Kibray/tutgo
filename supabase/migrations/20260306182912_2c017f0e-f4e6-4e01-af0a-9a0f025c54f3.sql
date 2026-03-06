
-- Only service role accesses this table, but add a deny-all policy for safety
CREATE POLICY "No public access" ON public.telegram_auth_codes FOR ALL TO anon, authenticated USING (false);
