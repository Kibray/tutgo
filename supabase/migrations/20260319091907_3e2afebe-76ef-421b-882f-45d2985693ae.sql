-- Add portfolio column to staff
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS portfolio text[] DEFAULT '{}'::text[];

-- Create staff-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-photos', 'staff-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone can view staff photos
CREATE POLICY "Anyone can view staff photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'staff-photos');

-- RLS: owners can upload staff photos (via location ownership)
CREATE POLICY "Owners can upload staff photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'staff-photos'
  AND auth.uid() IS NOT NULL
);

-- RLS: owners can update staff photos
CREATE POLICY "Owners can update staff photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'staff-photos'
  AND auth.uid() IS NOT NULL
);

-- RLS: owners can delete staff photos
CREATE POLICY "Owners can delete staff photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'staff-photos'
  AND auth.uid() IS NOT NULL
);