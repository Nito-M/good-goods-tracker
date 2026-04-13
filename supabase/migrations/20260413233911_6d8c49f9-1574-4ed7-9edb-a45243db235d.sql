
-- Parts Assemblies 2
CREATE TABLE public.parts_assemblies_2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_finished',
  status_notes TEXT,
  type TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_assemblies_2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parts_assemblies_2"
  ON public.parts_assemblies_2 FOR SELECT
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can create own parts_assemblies_2"
  ON public.parts_assemblies_2 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own parts_assemblies_2"
  ON public.parts_assemblies_2 FOR UPDATE
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can delete own parts_assemblies_2"
  ON public.parts_assemblies_2 FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_parts_assemblies_2_updated_at
  BEFORE UPDATE ON public.parts_assemblies_2
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Parts Assembly Items 2
CREATE TABLE public.parts_assembly_items_2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID NOT NULL REFERENCES public.parts_assemblies_2(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts_2(id) ON DELETE SET NULL,
  inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  part_sku TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parts_assembly_items_2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view parts_assembly_items_2 via assembly"
  ON public.parts_assembly_items_2 FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.parts_assemblies_2 a
    WHERE a.id = assembly_id AND (a.user_id = auth.uid() OR public.users_share_org(auth.uid(), a.user_id))
  ));

CREATE POLICY "Users can insert parts_assembly_items_2 via assembly"
  ON public.parts_assembly_items_2 FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.parts_assemblies_2 a
    WHERE a.id = assembly_id AND (a.user_id = auth.uid() OR public.users_share_org(auth.uid(), a.user_id))
  ));

CREATE POLICY "Users can update parts_assembly_items_2 via assembly"
  ON public.parts_assembly_items_2 FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.parts_assemblies_2 a
    WHERE a.id = assembly_id AND (a.user_id = auth.uid() OR public.users_share_org(auth.uid(), a.user_id))
  ));

CREATE POLICY "Users can delete parts_assembly_items_2 via assembly"
  ON public.parts_assembly_items_2 FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.parts_assemblies_2 a
    WHERE a.id = assembly_id AND (a.user_id = auth.uid() OR public.users_share_org(auth.uid(), a.user_id))
  ));
