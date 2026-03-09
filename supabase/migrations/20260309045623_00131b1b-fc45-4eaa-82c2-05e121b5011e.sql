
ALTER TABLE public.storefront_settings
ADD COLUMN IF NOT EXISTS cart_message text DEFAULT '';
