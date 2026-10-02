-- SOP Types: top-level grouping above categories
CREATE TABLE public.sop_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text DEFAULT 'BookOpen',
  color text DEFAULT '#3b82f6',
  sort_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_types TO authenticated;
GRANT ALL ON public.sop_types TO service_role;

ALTER TABLE public.sop_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view sop_types"
  ON public.sop_types FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can insert sop_types"
  ON public.sop_types FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Org members can update sop_types"
  ON public.sop_types FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE POLICY "Org members can delete sop_types"
  ON public.sop_types FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));

CREATE TRIGGER update_sop_types_updated_at
  BEFORE UPDATE ON public.sop_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attach type_id to categories and sops
ALTER TABLE public.sop_categories ADD COLUMN type_id uuid REFERENCES public.sop_types(id) ON DELETE SET NULL;
ALTER TABLE public.sops ADD COLUMN type_id uuid REFERENCES public.sop_types(id) ON DELETE SET NULL;

CREATE INDEX idx_sop_categories_type_id ON public.sop_categories(type_id);
CREATE INDEX idx_sops_type_id ON public.sops(type_id);