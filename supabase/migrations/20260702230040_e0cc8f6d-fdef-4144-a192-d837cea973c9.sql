ALTER TABLE public.assemblies ADD COLUMN IF NOT EXISTS selling_price_updated_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.track_assembly_selling_price_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.selling_price IS NOT NULL AND NEW.selling_price > 0 THEN
      NEW.selling_price_updated_at = now();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
      NEW.selling_price_updated_at = now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_assembly_selling_price ON public.assemblies;
CREATE TRIGGER trg_track_assembly_selling_price
BEFORE INSERT OR UPDATE ON public.assemblies
FOR EACH ROW EXECUTE FUNCTION public.track_assembly_selling_price_update();