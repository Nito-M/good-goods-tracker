ALTER TABLE public.parts_assemblies ADD COLUMN IF NOT EXISTS category text;

CREATE TABLE public.parts_assembly_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.parts_assembly_categories TO authenticated;
GRANT ALL ON public.parts_assembly_categories TO service_role;

ALTER TABLE public.parts_assembly_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view sub assembly categories"
ON public.parts_assembly_categories FOR SELECT TO authenticated
USING (public.users_share_org(auth.uid(), user_id) OR auth.uid() = user_id);

CREATE POLICY "Org members can insert sub assembly categories"
ON public.parts_assembly_categories FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org members can update sub assembly categories"
ON public.parts_assembly_categories FOR UPDATE TO authenticated
USING (public.users_share_org(auth.uid(), user_id) OR auth.uid() = user_id)
WITH CHECK (public.users_share_org(auth.uid(), user_id) OR auth.uid() = user_id);

CREATE POLICY "Org members can delete sub assembly categories"
ON public.parts_assembly_categories FOR DELETE TO authenticated
USING (public.users_share_org(auth.uid(), user_id) OR auth.uid() = user_id);

CREATE TRIGGER update_parts_assembly_categories_updated_at
BEFORE UPDATE ON public.parts_assembly_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();