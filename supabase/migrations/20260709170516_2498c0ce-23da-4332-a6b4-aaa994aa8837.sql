
-- SOP CATEGORIES (nested)
CREATE TABLE public.sop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.sop_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_categories TO authenticated;
GRANT ALL ON public.sop_categories TO service_role;
ALTER TABLE public.sop_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sop_cat_shared_org" ON public.sop_categories FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE TRIGGER trg_sop_cat_updated BEFORE UPDATE ON public.sop_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sop_cat_user ON public.sop_categories(user_id);
CREATE INDEX idx_sop_cat_parent ON public.sop_categories(parent_id);

-- SOPS
CREATE TABLE public.sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.sop_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  sop_number TEXT,
  department TEXT,
  revision_number TEXT,
  effective_date DATE,
  last_updated_date DATE,
  author TEXT,
  approved_by TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','obsolete')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sops TO authenticated;
GRANT ALL ON public.sops TO service_role;
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sops_shared_org" ON public.sops FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id))
  WITH CHECK (auth.uid() = user_id OR public.users_share_org(auth.uid(), user_id));
CREATE TRIGGER trg_sops_updated BEFORE UPDATE ON public.sops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sops_user ON public.sops(user_id);
CREATE INDEX idx_sops_category ON public.sops(category_id);

-- STEPS
CREATE TABLE public.sop_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content TEXT,
  warnings TEXT,
  notes TEXT,
  tips TEXT,
  required_tools TEXT,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_steps TO authenticated;
GRANT ALL ON public.sop_steps TO service_role;
ALTER TABLE public.sop_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sop_steps_via_sop" ON public.sop_steps FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sops s WHERE s.id = sop_id
    AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sops s WHERE s.id = sop_id
    AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))));
CREATE TRIGGER trg_sop_steps_updated BEFORE UPDATE ON public.sop_steps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sop_steps_sop ON public.sop_steps(sop_id);

-- STEP FILES
CREATE TABLE public.sop_step_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.sop_steps(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_step_files TO authenticated;
GRANT ALL ON public.sop_step_files TO service_role;
ALTER TABLE public.sop_step_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sop_step_files_via_step" ON public.sop_step_files FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sop_steps st JOIN public.sops s ON s.id = st.sop_id
    WHERE st.id = step_id AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sop_steps st JOIN public.sops s ON s.id = st.sop_id
    WHERE st.id = step_id AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))));
CREATE INDEX idx_sop_step_files_step ON public.sop_step_files(step_id);

-- STEP INVENTORY LINKS
CREATE TABLE public.sop_step_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES public.sop_steps(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_step_items TO authenticated;
GRANT ALL ON public.sop_step_items TO service_role;
ALTER TABLE public.sop_step_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sop_step_items_via_step" ON public.sop_step_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sop_steps st JOIN public.sops s ON s.id = st.sop_id
    WHERE st.id = step_id AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sop_steps st JOIN public.sops s ON s.id = st.sop_id
    WHERE st.id = step_id AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))));
CREATE INDEX idx_sop_step_items_step ON public.sop_step_items(step_id);

-- BOM
CREATE TABLE public.sop_bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 1,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  substitute_of_id UUID REFERENCES public.sop_bom_items(id) ON DELETE SET NULL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_bom_items TO authenticated;
GRANT ALL ON public.sop_bom_items TO service_role;
ALTER TABLE public.sop_bom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sop_bom_via_sop" ON public.sop_bom_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sops s WHERE s.id = sop_id
    AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sops s WHERE s.id = sop_id
    AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))));
CREATE INDEX idx_sop_bom_sop ON public.sop_bom_items(sop_id);

-- ATTACHMENTS
CREATE TABLE public.sop_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id UUID NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sop_attachments TO authenticated;
GRANT ALL ON public.sop_attachments TO service_role;
ALTER TABLE public.sop_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sop_attach_via_sop" ON public.sop_attachments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sops s WHERE s.id = sop_id
    AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.sops s WHERE s.id = sop_id
    AND (auth.uid() = s.user_id OR public.users_share_org(auth.uid(), s.user_id))));
CREATE INDEX idx_sop_attach_sop ON public.sop_attachments(sop_id);
