-- Add notes and quantity_unit columns to quote_items for per-item notes and length units
ALTER TABLE public.quote_items 
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS quantity_unit text NOT NULL DEFAULT 'pcs';