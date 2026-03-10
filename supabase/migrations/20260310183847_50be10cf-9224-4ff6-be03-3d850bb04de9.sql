
-- Add ip_address column and unique index for referral rate limiting
ALTER TABLE public.referral_clicks ADD COLUMN IF NOT EXISTS ip_address text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_clicks_ip_code 
ON public.referral_clicks (referral_code, ip_address) 
WHERE ip_address IS NOT NULL;
