CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  related_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- System can insert notifications via service role, but also allow inserts for triggers
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add granular notification preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notify_confirmed boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_reminder boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_cancelled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_deals boolean NOT NULL DEFAULT true;

-- Trigger: create notification when appointment status changes
CREATE OR REPLACE FUNCTION public.notify_appointment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Confirmed
  IF NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    INSERT INTO public.notifications (user_id, title, body, type, related_id)
    SELECT NEW.client_user_id, 'Запись подтверждена', 
           'Ваша запись на ' || to_char(NEW.start_time AT TIME ZONE 'Asia/Tashkent', 'DD.MM в HH24:MI') || ' подтверждена',
           'confirmed', NEW.id
    WHERE NEW.client_user_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.client_user_id AND notify_confirmed = true);
  END IF;

  -- Cancelled
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    INSERT INTO public.notifications (user_id, title, body, type, related_id)
    SELECT NEW.client_user_id, 'Запись отменена',
           'Ваша запись на ' || to_char(NEW.start_time AT TIME ZONE 'Asia/Tashkent', 'DD.MM в HH24:MI') || ' была отменена',
           'cancelled', NEW.id
    WHERE NEW.client_user_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.client_user_id AND notify_cancelled = true);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_appointment_notification
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_appointment_status_change();