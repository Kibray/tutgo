
-- Remove overly permissive public profile policy that exposes PII
DROP POLICY IF EXISTS "Anyone can view basic profile info" ON public.profiles;
