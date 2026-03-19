
-- Remove the old trigger that only syncs to parts_assembly_items
DROP TRIGGER IF EXISTS trg_sync_part_to_assembly_items ON public.parts;

-- Drop the old function
DROP FUNCTION IF EXISTS public.sync_part_to_assembly_items();
