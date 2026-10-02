ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS inventory_show_quantity boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inventory_show_price boolean NOT NULL DEFAULT true;
