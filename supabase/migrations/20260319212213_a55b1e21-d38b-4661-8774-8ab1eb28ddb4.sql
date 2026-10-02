
-- Add part_id column to assembly_items
ALTER TABLE public.assembly_items
ADD COLUMN part_id uuid REFERENCES public.parts(id) ON DELETE SET NULL;

-- Backfill existing assembly_items with matching parts (by name + sku)
UPDATE public.assembly_items ai
SET part_id = p.id
FROM public.parts p
WHERE ai.inventory_item_id IS NULL
  AND ai.part_id IS NULL
  AND ai.item_name = p.name
  AND ai.sku = p.sku;

-- Create trigger to sync part name/SKU changes to assembly_items
CREATE OR REPLACE FUNCTION public.sync_part_to_assembly_items_full()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku THEN
    -- Sync to parts_assembly_items (existing behavior)
    UPDATE public.parts_assembly_items
    SET part_name = NEW.name,
        part_sku = NEW.sku
    WHERE part_id = NEW.id;

    -- Sync to assembly_items
    UPDATE public.assembly_items
    SET item_name = NEW.name,
        sku = NEW.sku
    WHERE part_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Replace the old trigger with the new one
DROP TRIGGER IF EXISTS sync_part_name_sku ON public.parts;
CREATE TRIGGER sync_part_name_sku
AFTER UPDATE ON public.parts
FOR EACH ROW
EXECUTE FUNCTION public.sync_part_to_assembly_items_full();
