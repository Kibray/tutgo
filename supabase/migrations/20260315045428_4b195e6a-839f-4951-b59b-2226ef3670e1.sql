
CREATE TABLE public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_username text,
  feature text DEFAULT 'trains',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert waitlist" ON public.waitlist
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can view own waitlist" ON public.waitlist
  FOR SELECT TO public USING (true);
