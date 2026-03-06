
-- Create storage bucket for business photos
INSERT INTO storage.buckets (id, name, public) VALUES ('businesses', 'businesses', true);

-- Allow authenticated users to upload to businesses bucket
CREATE POLICY "Partners can upload business photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'businesses' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.locations WHERE owner_id = auth.uid()
));

-- Allow anyone to view business photos
CREATE POLICY "Anyone can view business photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'businesses');

-- Allow owners to delete their business photos
CREATE POLICY "Partners can delete business photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'businesses' AND (storage.foldername(name))[1] IN (
  SELECT id::text FROM public.locations WHERE owner_id = auth.uid()
));
