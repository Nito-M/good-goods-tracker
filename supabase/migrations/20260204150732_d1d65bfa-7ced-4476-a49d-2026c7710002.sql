-- Add quantity_unit column to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN quantity_unit TEXT NOT NULL DEFAULT 'pcs';

-- Add a check constraint for valid units
ALTER TABLE public.inventory_items 
ADD CONSTRAINT valid_quantity_unit 
CHECK (quantity_unit IN ('pcs', 'ft', 'm', 'yd', 'in'));