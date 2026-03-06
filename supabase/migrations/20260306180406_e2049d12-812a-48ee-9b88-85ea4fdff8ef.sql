
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id bigint;

-- Enable pg_net extension for calling edge functions from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Enable pg_cron for scheduled reminders
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
