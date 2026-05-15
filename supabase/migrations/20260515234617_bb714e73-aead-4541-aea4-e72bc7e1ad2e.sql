ALTER TABLE public.app_welcome_settings
ADD COLUMN IF NOT EXISTS background_image_url_mobile text,
ADD COLUMN IF NOT EXISTS background_video_url_mobile text;