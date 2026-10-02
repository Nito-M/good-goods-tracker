
CREATE TABLE public.assembly_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID NOT NULL REFERENCES public.assemblies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  changed_by UUID,
  old_price NUMERIC,
  new_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_assembly_price_history_assembly ON public.assembly_price_history(assembly_id, created_at DESC);

GRANT SELECT, INSERT ON public.assembly_price_history TO authenticated;
GRANT ALL ON public.assembly_price_history TO service_role;

ALTER TABLE public.assembly_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view price history in their org"
  ON public.assembly_price_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "System can insert price history"
  ON public.assembly_price_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_assembly_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.selling_price IS NOT NULL AND NEW.selling_price > 0 THEN
      INSERT INTO public.assembly_price_history (assembly_id, user_id, changed_by, old_price, new_price)
      VALUES (NEW.id, NEW.user_id, auth.uid(), NULL, NEW.selling_price);
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.selling_price IS DISTINCT FROM OLD.selling_price THEN
      INSERT INTO public.assembly_price_history (assembly_id, user_id, changed_by, old_price, new_price)
      VALUES (NEW.id, NEW.user_id, auth.uid(), OLD.selling_price, NEW.selling_price);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assemblies_log_price_change ON public.assemblies;
CREATE TRIGGER assemblies_log_price_change
AFTER INSERT OR UPDATE OF selling_price ON public.assemblies
FOR EACH ROW EXECUTE FUNCTION public.log_assembly_price_change();
