-- Make inventory_item_id nullable and add custom item fields
ALTER TABLE public.part_inventory_items ALTER COLUMN inventory_item_id DROP NOT NULL;
ALTER TABLE public.part_inventory_items DROP CONSTRAINT part_inventory_items_part_id_inventory_item_id_key;
ALTER TABLE public.part_inventory_items ADD COLUMN item_name text;
ALTER TABLE public.part_inventory_items ADD COLUMN unit_cost numeric NOT NULL DEFAULT 0;