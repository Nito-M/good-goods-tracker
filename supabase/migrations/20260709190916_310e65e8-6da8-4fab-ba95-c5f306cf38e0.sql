
CREATE TABLE public.sop_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sop_id UUID NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_sop_locations_sop_id ON public.sop_locations(sop_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_locations TO authenticated;
GRANT ALL ON public.sop_locations TO service_role;

ALTER TABLE public.sop_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view sop_locations"
  ON public.sop_locations FOR SELECT TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can insert sop_locations"
  ON public.sop_locations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can update sop_locations"
  ON public.sop_locations FOR UPDATE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id))
  WITH CHECK (public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can delete sop_locations"
  ON public.sop_locations FOR DELETE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_sop_locations_updated_at
  BEFORE UPDATE ON public.sop_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
