
-- Add parts_assembly_id column to assembly_items
ALTER TABLE public.assembly_items
  ADD COLUMN parts_assembly_id uuid REFERENCES public.parts_assemblies(id) ON DELETE SET NULL;

-- Function: recalculate parts assembly cost and push to assembly_items
CREATE OR REPLACE FUNCTION public.sync_parts_assembly_cost_to_assemblies()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  _assembly_id uuid;
  _total_cost numeric;
BEGIN
  IF TG_TABLE_NAME = 'parts_assembly_items' THEN
    _assembly_id := COALESCE(NEW.assembly_id, OLD.assembly_id);
  ELSIF TG_TABLE_NAME = 'parts' THEN
    FOR _assembly_id IN
      SELECT DISTINCT pai.assembly_id
      FROM parts_assembly_items pai
      WHERE pai.part_id = NEW.id
    LOOP
      SELECT COALESCE(SUM(pai.quantity * COALESCE(p.price, 0)), 0)
      INTO _total_cost
      FROM parts_assembly_items pai
      LEFT JOIN parts p ON p.id = pai.part_id
      WHERE pai.assembly_id = _assembly_id;

      UPDATE assembly_items
      SET unit_cost = _total_cost
      WHERE parts_assembly_id = _assembly_id;
    END LOOP;
    RETURN NEW;
  END IF;

  SELECT COALESCE(SUM(pai.quantity * COALESCE(p.price, 0)), 0)
  INTO _total_cost
  FROM parts_assembly_items pai
  LEFT JOIN parts p ON p.id = pai.part_id
  WHERE pai.assembly_id = _assembly_id;

  UPDATE assembly_items
  SET unit_cost = _total_cost
  WHERE parts_assembly_id = _assembly_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger on parts_assembly_items changes
CREATE TRIGGER sync_pa_cost_on_items_change
AFTER INSERT OR UPDATE OR DELETE ON public.parts_assembly_items
FOR EACH ROW
EXECUTE FUNCTION public.sync_parts_assembly_cost_to_assemblies();

-- Trigger on parts price changes
CREATE TRIGGER sync_pa_cost_on_part_price_change
AFTER UPDATE OF price ON public.parts
FOR EACH ROW
EXECUTE FUNCTION public.sync_parts_assembly_cost_to_assemblies();
