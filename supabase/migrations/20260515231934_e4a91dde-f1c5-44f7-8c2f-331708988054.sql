ALTER TABLE public.app_welcome_settings
  ADD COLUMN IF NOT EXISTS video_loop boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS video_muted boolean NOT NULL DEFAULT true;