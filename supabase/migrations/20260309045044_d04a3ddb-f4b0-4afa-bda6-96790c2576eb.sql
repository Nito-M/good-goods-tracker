
ALTER TABLE public.inventory_items
ADD COLUMN IF NOT EXISTS storefront_page text DEFAULT NULL;
