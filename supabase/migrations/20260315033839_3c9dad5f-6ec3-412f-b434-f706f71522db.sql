ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS partner_terms_accepted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS partner_terms_accepted_at timestamp with time zone DEFAULT NULL;