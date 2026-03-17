CREATE OR REPLACE FUNCTION public.sync_parts_assembly_cost_to_assemblies()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _assembly_id uuid;
  _total_cost numeric;
BEGIN
  IF TG_TABLE_NAME = 'parts_assembly_items' THEN
    _assembly_id := COALESCE(NEW.assembly_id, OLD.assembly_id);

    SELECT COALESCE(SUM(pai.quantity * COALESCE(p.price, ii.cost, 0)), 0)
    INTO _total_cost
    FROM public.parts_assembly_items pai
    LEFT JOIN public.parts p ON p.id = pai.part_id
    LEFT JOIN public.inventory_items ii ON ii.id = pai.inventory_item_id
    WHERE pai.assembly_id = _assembly_id;

    UPDATE public.assembly_items
    SET unit_cost = _total_cost
    WHERE parts_assembly_id = _assembly_id;

    RETURN COALESCE(NEW, OLD);
  ELSIF TG_TABLE_NAME = 'parts' THEN
    FOR _assembly_id IN
      SELECT DISTINCT pai.assembly_id
      FROM public.parts_assembly_items pai
      WHERE pai.part_id = NEW.id
    LOOP
      SELECT COALESCE(SUM(pai.quantity * COALESCE(p.price, ii.cost, 0)), 0)
      INTO _total_cost
      FROM public.parts_assembly_items pai
      LEFT JOIN public.parts p ON p.id = pai.part_id
      LEFT JOIN public.inventory_items ii ON ii.id = pai.inventory_item_id
      WHERE pai.assembly_id = _assembly_id;

      UPDATE public.assembly_items
      SET unit_cost = _total_cost
      WHERE parts_assembly_id = _assembly_id;
    END LOOP;

    RETURN NEW;
  ELSIF TG_TABLE_NAME = 'inventory_items' THEN
    FOR _assembly_id IN
      SELECT DISTINCT pai.assembly_id
      FROM public.parts_assembly_items pai
      WHERE pai.inventory_item_id = NEW.id
    LOOP
      SELECT COALESCE(SUM(pai.quantity * COALESCE(p.price, ii.cost, 0)), 0)
      INTO _total_cost
      FROM public.parts_assembly_items pai
      LEFT JOIN public.parts p ON p.id = pai.part_id
      LEFT JOIN public.inventory_items ii ON ii.id = pai.inventory_item_id
      WHERE pai.assembly_id = _assembly_id;

      UPDATE public.assembly_items
      SET unit_cost = _total_cost
      WHERE parts_assembly_id = _assembly_id;
    END LOOP;

    RETURN NEW;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS sync_parts_assembly_items_cost_to_assemblies ON public.parts_assembly_items;
CREATE TRIGGER sync_parts_assembly_items_cost_to_assemblies
AFTER INSERT OR UPDATE OR DELETE ON public.parts_assembly_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_parts_assembly_cost_to_assemblies();

DROP TRIGGER IF EXISTS sync_part_price_to_linked_assemblies ON public.parts;
CREATE TRIGGER sync_part_price_to_linked_assemblies
AFTER UPDATE OF price ON public.parts
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price)
EXECUTE FUNCTION public.sync_parts_assembly_cost_to_assemblies();

DROP TRIGGER IF EXISTS sync_inventory_cost_to_linked_parts_assemblies ON public.inventory_items;
CREATE TRIGGER sync_inventory_cost_to_linked_parts_assemblies
AFTER UPDATE OF cost ON public.inventory_items
FOR EACH ROW
WHEN (OLD.cost IS DISTINCT FROM NEW.cost)
EXECUTE FUNCTION public.sync_parts_assembly_cost_to_assemblies();