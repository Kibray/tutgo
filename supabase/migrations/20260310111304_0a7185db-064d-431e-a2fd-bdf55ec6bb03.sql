
-- Add slug to locations
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Add referral columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_count integer NOT NULL DEFAULT 0;

-- Create referral_clicks table
CREATE TABLE IF NOT EXISTS public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_type text NOT NULL DEFAULT 'user', -- 'user' or 'business'
  referral_code text NOT NULL,
  location_slug text,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  converted boolean NOT NULL DEFAULT false,
  converted_user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert clicks (anonymous visitors)
CREATE POLICY "Anyone can insert referral clicks" ON public.referral_clicks
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Users can view their own referral clicks
CREATE POLICY "Users can view own referral clicks" ON public.referral_clicks
  FOR SELECT TO authenticated USING (
    referral_code IN (
      SELECT p.referral_code FROM public.profiles p WHERE p.user_id = auth.uid()
    )
    OR
    location_slug IN (
      SELECT l.slug FROM public.locations l WHERE l.owner_id = auth.uid()
    )
  );

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION public.generate_slug(name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  -- Transliterate Cyrillic to Latin
  base_slug := name;
  base_slug := replace(base_slug, 'а', 'a'); base_slug := replace(base_slug, 'б', 'b');
  base_slug := replace(base_slug, 'в', 'v'); base_slug := replace(base_slug, 'г', 'g');
  base_slug := replace(base_slug, 'д', 'd'); base_slug := replace(base_slug, 'е', 'e');
  base_slug := replace(base_slug, 'ё', 'yo'); base_slug := replace(base_slug, 'ж', 'zh');
  base_slug := replace(base_slug, 'з', 'z'); base_slug := replace(base_slug, 'и', 'i');
  base_slug := replace(base_slug, 'й', 'y'); base_slug := replace(base_slug, 'к', 'k');
  base_slug := replace(base_slug, 'л', 'l'); base_slug := replace(base_slug, 'м', 'm');
  base_slug := replace(base_slug, 'н', 'n'); base_slug := replace(base_slug, 'о', 'o');
  base_slug := replace(base_slug, 'п', 'p'); base_slug := replace(base_slug, 'р', 'r');
  base_slug := replace(base_slug, 'с', 's'); base_slug := replace(base_slug, 'т', 't');
  base_slug := replace(base_slug, 'у', 'u'); base_slug := replace(base_slug, 'ф', 'f');
  base_slug := replace(base_slug, 'х', 'kh'); base_slug := replace(base_slug, 'ц', 'ts');
  base_slug := replace(base_slug, 'ч', 'ch'); base_slug := replace(base_slug, 'ш', 'sh');
  base_slug := replace(base_slug, 'щ', 'shch'); base_slug := replace(base_slug, 'ъ', '');
  base_slug := replace(base_slug, 'ы', 'y'); base_slug := replace(base_slug, 'ь', '');
  base_slug := replace(base_slug, 'э', 'e'); base_slug := replace(base_slug, 'ю', 'yu');
  base_slug := replace(base_slug, 'я', 'ya');
  -- Uppercase versions
  base_slug := replace(base_slug, 'А', 'a'); base_slug := replace(base_slug, 'Б', 'b');
  base_slug := replace(base_slug, 'В', 'v'); base_slug := replace(base_slug, 'Г', 'g');
  base_slug := replace(base_slug, 'Д', 'd'); base_slug := replace(base_slug, 'Е', 'e');
  base_slug := replace(base_slug, 'Ё', 'yo'); base_slug := replace(base_slug, 'Ж', 'zh');
  base_slug := replace(base_slug, 'З', 'z'); base_slug := replace(base_slug, 'И', 'i');
  base_slug := replace(base_slug, 'Й', 'y'); base_slug := replace(base_slug, 'К', 'k');
  base_slug := replace(base_slug, 'Л', 'l'); base_slug := replace(base_slug, 'М', 'm');
  base_slug := replace(base_slug, 'Н', 'n'); base_slug := replace(base_slug, 'О', 'o');
  base_slug := replace(base_slug, 'П', 'p'); base_slug := replace(base_slug, 'Р', 'r');
  base_slug := replace(base_slug, 'С', 's'); base_slug := replace(base_slug, 'Т', 't');
  base_slug := replace(base_slug, 'У', 'u'); base_slug := replace(base_slug, 'Ф', 'f');
  base_slug := replace(base_slug, 'Х', 'kh'); base_slug := replace(base_slug, 'Ц', 'ts');
  base_slug := replace(base_slug, 'Ч', 'ch'); base_slug := replace(base_slug, 'Ш', 'sh');
  base_slug := replace(base_slug, 'Щ', 'shch'); base_slug := replace(base_slug, 'Ъ', '');
  base_slug := replace(base_slug, 'Ы', 'y'); base_slug := replace(base_slug, 'Ь', '');
  base_slug := replace(base_slug, 'Э', 'e'); base_slug := replace(base_slug, 'Ю', 'yu');
  base_slug := replace(base_slug, 'Я', 'ya');
  
  base_slug := lower(base_slug);
  base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.locations WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

-- Auto-generate slug on insert/update if not set
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER locations_auto_slug
  BEFORE INSERT OR UPDATE OF name ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_slug();

-- Auto-generate referral_code on profile insert
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  code text;
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    code := substr(md5(random()::text || NEW.user_id::text), 1, 8);
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = code) LOOP
      code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
    END LOOP;
    NEW.referral_code := code;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_auto_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_referral_code();

-- Generate slugs for existing locations
UPDATE public.locations SET slug = public.generate_slug(name) WHERE slug IS NULL;

-- Generate referral codes for existing profiles
UPDATE public.profiles SET referral_code = substr(md5(random()::text || user_id::text), 1, 8) WHERE referral_code IS NULL;
