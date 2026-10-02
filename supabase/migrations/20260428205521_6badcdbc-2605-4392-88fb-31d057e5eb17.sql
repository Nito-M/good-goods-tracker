-- Add nested_assembly_id to allow embedding a full assembly inside another assembly as a line item
ALTER TABLE public.assembly_items
  ADD COLUMN IF NOT EXISTS nested_assembly_id uuid REFERENCES public.assemblies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assembly_items_nested_assembly_id
  ON public.assembly_items (nested_assembly_id);

-- Cost sync: when a child assembly's items change, recompute parent assembly_items.unit_cost
-- where parent rows reference the child via nested_assembly_id.
CREATE OR REPLACE FUNCTION public.sync_nested_assembly_cost()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _child_assembly_id uuid;
  _total_cost numeric;
  _selling_price numeric;
BEGIN
  IF TG_TABLE_NAME = 'assembly_items' THEN
    _child_assembly_id := COALESCE(NEW.assembly_id, OLD.assembly_id);
  ELSIF TG_TABLE_NAME = 'assemblies' THEN
    _child_assembly_id := NEW.id;
  END IF;

  IF _child_assembly_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(quantity * COALESCE(unit_cost, 0)), 0)
    INTO _total_cost
    FROM public.assembly_items
    WHERE assembly_id = _child_assembly_id
      AND (nested_assembly_id IS NULL OR nested_assembly_id <> _child_assembly_id);

  SELECT COALESCE(selling_price, 0)
    INTO _selling_price
    FROM public.assemblies
    WHERE id = _child_assembly_id;

  UPDATE public.assembly_items
    SET unit_cost = CASE WHEN _selling_price > 0 THEN _selling_price ELSE _total_cost END
    WHERE nested_assembly_id = _child_assembly_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_nested_assembly_cost_items ON public.assembly_items;
CREATE TRIGGER trg_sync_nested_assembly_cost_items
AFTER INSERT OR UPDATE OR DELETE ON public.assembly_items
FOR EACH ROW EXECUTE FUNCTION public.sync_nested_assembly_cost();

DROP TRIGGER IF EXISTS trg_sync_nested_assembly_cost_price ON public.assemblies;
CREATE TRIGGER trg_sync_nested_assembly_cost_price
AFTER UPDATE OF selling_price ON public.assemblies
FOR EACH ROW EXECUTE FUNCTION public.sync_nested_assembly_cost();