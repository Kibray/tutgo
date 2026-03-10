
-- Fix search_path on new functions
ALTER FUNCTION public.generate_slug(text) SET search_path = public;
ALTER FUNCTION public.auto_generate_slug() SET search_path = public;
ALTER FUNCTION public.auto_generate_referral_code() SET search_path = public;
