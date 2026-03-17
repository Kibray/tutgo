-- Create a restricted view exposing only public-safe profile fields
CREATE VIEW public.public_profiles
WITH (security_invoker = on) AS
  SELECT user_id, display_name, avatar_url
  FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;