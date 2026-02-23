
CREATE OR REPLACE FUNCTION public.sync_part_to_assembly_items()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku THEN
    UPDATE public.parts_assembly_items
    SET part_name = NEW.name,
        part_sku = NEW.sku
    WHERE part_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_sync_part_to_assembly_items
  AFTER UPDATE ON public.parts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_part_to_assembly_items();
