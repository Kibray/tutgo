
-- Add preference columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'ru';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dark_mode boolean NOT NULL DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled boolean NOT NULL DEFAULT true;
