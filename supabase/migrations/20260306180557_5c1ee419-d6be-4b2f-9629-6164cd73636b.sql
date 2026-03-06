
-- Trigger function: notify on new appointment
CREATE OR REPLACE FUNCTION public.telegram_notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _url text;
  _anon_key text;
BEGIN
  _url := current_setting('app.settings.supabase_url', true);
  _anon_key := current_setting('app.settings.supabase_anon_key', true);
  
  -- Use hardcoded URL since app.settings may not be available
  PERFORM extensions.http_post(
    url := 'https://dynahgglwvxaoqqozpkb.supabase.co/functions/v1/telegram-notify',
    body := jsonb_build_object(
      'type', 'appointment.created',
      'record', jsonb_build_object(
        'id', NEW.id,
        'location_id', NEW.location_id,
        'client_name', NEW.client_name,
        'client_user_id', NEW.client_user_id,
        'start_time', NEW.start_time,
        'end_time', NEW.end_time,
        'service_id', NEW.service_id,
        'status', NEW.status
      )
    ),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Trigger function: notify when client cancels
CREATE OR REPLACE FUNCTION public.telegram_notify_client_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    PERFORM extensions.http_post(
      url := 'https://dynahgglwvxaoqqozpkb.supabase.co/functions/v1/telegram-notify',
      body := jsonb_build_object(
        'type', 'appointment.cancelled_by_client',
        'record', jsonb_build_object(
          'id', NEW.id,
          'location_id', NEW.location_id,
          'client_name', NEW.client_name,
          'client_user_id', NEW.client_user_id,
          'start_time', NEW.start_time
        )
      ),
      headers := jsonb_build_object('Content-Type', 'application/json')
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Trigger function: notify on new review
CREATE OR REPLACE FUNCTION public.telegram_notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://dynahgglwvxaoqqozpkb.supabase.co/functions/v1/telegram-notify',
    body := jsonb_build_object(
      'type', 'review.created',
      'record', jsonb_build_object(
        'id', NEW.id,
        'location_id', NEW.location_id,
        'user_id', NEW.user_id,
        'rating', NEW.rating,
        'comment', NEW.comment
      )
    ),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Trigger function: notify on new deal
CREATE OR REPLACE FUNCTION public.telegram_notify_new_deal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://dynahgglwvxaoqqozpkb.supabase.co/functions/v1/telegram-notify',
    body := jsonb_build_object(
      'type', 'deal.created',
      'record', jsonb_build_object(
        'id', NEW.id,
        'location_id', NEW.location_id,
        'title', NEW.title,
        'description', NEW.description,
        'expires_at', NEW.expires_at
      )
    ),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trg_telegram_new_appointment
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_appointment();

CREATE TRIGGER trg_telegram_client_cancelled
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_client_cancelled();

CREATE TRIGGER trg_telegram_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_review();

CREATE TRIGGER trg_telegram_new_deal
  AFTER INSERT ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.telegram_notify_new_deal();
