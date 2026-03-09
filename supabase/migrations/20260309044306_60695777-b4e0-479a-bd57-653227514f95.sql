ALTER TABLE public.storefront_settings
ADD COLUMN IF NOT EXISTS header_bg_color text DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS header_text_color text DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS header_nav_color text DEFAULT '#6b7280';