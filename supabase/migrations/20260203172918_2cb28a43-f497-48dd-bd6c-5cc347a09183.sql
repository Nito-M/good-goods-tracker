-- Add unit_cost column to sale_items to track cost at time of sale
ALTER TABLE public.sale_items ADD COLUMN unit_cost numeric NOT NULL DEFAULT 0;