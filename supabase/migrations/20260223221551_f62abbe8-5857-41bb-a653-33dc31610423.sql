
-- Parts Assemblies table (separate from inventory assemblies)
CREATE TABLE public.parts_assemblies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_finished',
  status_notes TEXT,
  type TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Parts Assembly Items (references parts table, not inventory)
CREATE TABLE public.parts_assembly_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id UUID NOT NULL REFERENCES public.parts_assemblies(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  part_name TEXT NOT NULL,
  part_sku TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.parts_assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_assembly_items ENABLE ROW LEVEL SECURITY;

-- RLS for parts_assemblies
CREATE POLICY "Users can view their own parts assemblies" ON public.parts_assemblies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own parts assemblies" ON public.parts_assemblies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own parts assemblies" ON public.parts_assemblies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own parts assemblies" ON public.parts_assemblies FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org parts assemblies" ON public.parts_assemblies FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- RLS for parts_assembly_items (via join to parts_assemblies)
CREATE POLICY "Users can view their own parts assembly items" ON public.parts_assembly_items FOR SELECT USING (EXISTS (SELECT 1 FROM parts_assemblies WHERE parts_assemblies.id = parts_assembly_items.assembly_id AND parts_assemblies.user_id = auth.uid()));
CREATE POLICY "Users can insert their own parts assembly items" ON public.parts_assembly_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM parts_assemblies WHERE parts_assemblies.id = parts_assembly_items.assembly_id AND parts_assemblies.user_id = auth.uid()));
CREATE POLICY "Users can update their own parts assembly items" ON public.parts_assembly_items FOR UPDATE USING (EXISTS (SELECT 1 FROM parts_assemblies WHERE parts_assemblies.id = parts_assembly_items.assembly_id AND parts_assemblies.user_id = auth.uid()));
CREATE POLICY "Users can delete their own parts assembly items" ON public.parts_assembly_items FOR DELETE USING (EXISTS (SELECT 1 FROM parts_assemblies WHERE parts_assemblies.id = parts_assembly_items.assembly_id AND parts_assemblies.user_id = auth.uid()));
CREATE POLICY "Org members can view org parts assembly items" ON public.parts_assembly_items FOR SELECT USING (EXISTS (SELECT 1 FROM parts_assemblies WHERE parts_assemblies.id = parts_assembly_items.assembly_id AND users_share_org(auth.uid(), parts_assemblies.user_id)));

-- Updated_at trigger
CREATE TRIGGER update_parts_assemblies_updated_at BEFORE UPDATE ON public.parts_assemblies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
