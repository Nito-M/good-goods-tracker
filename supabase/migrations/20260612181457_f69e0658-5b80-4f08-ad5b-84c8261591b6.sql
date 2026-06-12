ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS inventory_price_display text NOT NULL DEFAULT 'selling'
  CHECK (inventory_price_display IN ('selling','cost'));