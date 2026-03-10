
-- Create partner_applications table
CREATE TABLE public.partner_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  category text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  description text,
  instagram text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique phone constraint to prevent duplicates
CREATE UNIQUE INDEX idx_partner_applications_phone ON public.partner_applications(phone);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Users can insert their own applications
CREATE POLICY "Users can create own applications"
  ON public.partner_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON public.partner_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.partner_applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update applications
CREATE POLICY "Admins can update applications"
  ON public.partner_applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all profiles (for admin panel)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all locations
CREATE POLICY "Admins can view all locations for admin"
  ON public.locations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to notify telegram about new partner applications
CREATE OR REPLACE FUNCTION public.telegram_notify_new_partner()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM net.http_post(
    url := 'https://ivnczarwkkeyncwrovio.supabase.co/functions/v1/telegram-notify',
    body := jsonb_build_object(
      'type', 'partner.application',
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'company_name', NEW.company_name,
        'category', NEW.category,
        'phone', NEW.phone,
        'address', NEW.address,
        'description', NEW.description,
        'instagram', NEW.instagram
      )
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_partner_application_created
  AFTER INSERT ON public.partner_applications
  FOR EACH ROW EXECUTE FUNCTION public.telegram_notify_new_partner();
