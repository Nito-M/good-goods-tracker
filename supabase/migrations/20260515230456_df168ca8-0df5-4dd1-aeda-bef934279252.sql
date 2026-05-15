ALTER TABLE public.app_welcome_settings
ADD COLUMN IF NOT EXISTS bg_dim_pct integer NOT NULL DEFAULT 40;

ALTER TABLE public.app_welcome_settings
DROP CONSTRAINT IF EXISTS app_welcome_settings_bg_dim_pct_check;

ALTER TABLE public.app_welcome_settings
ADD CONSTRAINT app_welcome_settings_bg_dim_pct_check
CHECK (bg_dim_pct >= 0 AND bg_dim_pct <= 100);