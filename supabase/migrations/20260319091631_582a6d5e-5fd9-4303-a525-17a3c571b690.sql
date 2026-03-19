ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS telegram_username text DEFAULT NULL;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS telegram_chat_id bigint DEFAULT NULL;