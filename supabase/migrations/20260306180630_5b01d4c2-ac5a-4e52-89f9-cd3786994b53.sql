
-- Fix: use net.http_post (pg_net schema)
CREATE OR REPLACE FUNCTION public.telegram_notify_new_appointment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
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
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.telegram_notify_client_cancelled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    PERFORM net.http_post(
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
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.telegram_notify_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
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
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.telegram_notify_new_deal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM net.http_post(
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
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;
