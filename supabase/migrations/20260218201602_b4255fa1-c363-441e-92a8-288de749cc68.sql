
-- Create assemblies table
CREATE TABLE public.assemblies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create assembly_items table
CREATE TABLE public.assembly_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assembly_id uuid NOT NULL REFERENCES public.assemblies(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  sku text NOT NULL DEFAULT '',
  quantity numeric NOT NULL DEFAULT 1,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assemblies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_items ENABLE ROW LEVEL SECURITY;

-- Assemblies RLS policies
CREATE POLICY "Users can view their own assemblies"
  ON public.assemblies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org members can view org assemblies"
  ON public.assemblies FOR SELECT
  USING (users_share_org(auth.uid(), user_id));

CREATE POLICY "Users can insert their own assemblies"
  ON public.assemblies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assemblies"
  ON public.assemblies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assemblies"
  ON public.assemblies FOR DELETE
  USING (auth.uid() = user_id);

-- Assembly items RLS policies
CREATE POLICY "Users can view their own assembly items"
  ON public.assembly_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.assemblies
    WHERE assemblies.id = assembly_items.assembly_id
    AND assemblies.user_id = auth.uid()
  ));

CREATE POLICY "Org members can view org assembly items"
  ON public.assembly_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.assemblies
    WHERE assemblies.id = assembly_items.assembly_id
    AND users_share_org(auth.uid(), assemblies.user_id)
  ));

CREATE POLICY "Users can insert their own assembly items"
  ON public.assembly_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.assemblies
    WHERE assemblies.id = assembly_items.assembly_id
    AND assemblies.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own assembly items"
  ON public.assembly_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.assemblies
    WHERE assemblies.id = assembly_items.assembly_id
    AND assemblies.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own assembly items"
  ON public.assembly_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.assemblies
    WHERE assemblies.id = assembly_items.assembly_id
    AND assemblies.user_id = auth.uid()
  ));

-- Updated_at trigger for assemblies
CREATE TRIGGER update_assemblies_updated_at
  BEFORE UPDATE ON public.assemblies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
