
-- Add inventory_item_id column to parts_assembly_items for inventory items support
ALTER TABLE public.parts_assembly_items
  ADD COLUMN inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL;
