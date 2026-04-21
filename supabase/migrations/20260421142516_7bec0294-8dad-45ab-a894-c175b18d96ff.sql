ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram_user_id text,
  ADD COLUMN IF NOT EXISTS instagram_access_token text,
  ADD COLUMN IF NOT EXISTS instagram_page_id text,
  ADD COLUMN IF NOT EXISTS instagram_connected boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_instagram_page_id_unique
  ON public.profiles (instagram_page_id)
  WHERE instagram_page_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_instagram_user_id_idx
  ON public.profiles (instagram_user_id)
  WHERE instagram_user_id IS NOT NULL;