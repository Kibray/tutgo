
CREATE TABLE public.telegram_auth_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  telegram_chat_id bigint NOT NULL,
  telegram_username text,
  telegram_first_name text,
  used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_auth_codes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_telegram_auth_codes_code ON public.telegram_auth_codes(code);
CREATE INDEX idx_telegram_auth_codes_expires ON public.telegram_auth_codes(expires_at);
