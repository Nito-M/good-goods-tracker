
CREATE OR REPLACE FUNCTION public.sync_inventory_cost_to_assemblies()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF OLD.cost IS DISTINCT FROM NEW.cost THEN
    UPDATE public.assembly_items
    SET unit_cost = NEW.cost
    WHERE inventory_item_id = NEW.id;

    UPDATE public.part_inventory_items
    SET unit_cost = NEW.cost
    WHERE inventory_item_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_inventory_cost_trigger
AFTER UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_cost_to_assemblies();
